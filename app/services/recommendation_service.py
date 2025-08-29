import asyncio
import json
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from loguru import logger

from app.models.choice import Item, Category, UserInteraction, Choice
from app.models.user import User
from app.services.vector_service import vector_service
from app.services.nlp_service import nlp_processor
from app.core.database import get_db, redis_client

class RecommendationEngine:
    def __init__(self):
        self.algorithm_weights = {
            "semantic": 0.4,
            "collaborative": 0.35, 
            "content": 0.25
        }

    async def get_recommendations(self,
                                user_id: Optional[int],
                                query: str,
                                filters: Dict[str, Any] = {},
                                limit: int = 10) -> Dict[str, Any]:
        """Main recommendation method"""
        start_time = datetime.now()

        try:
            # Process NLP
            nlp_result = await nlp_processor.process_query(query)

            # Get database session
            db = next(get_db())

            # Get user profile if available
            user_profile = None
            if user_id:
                user_profile = await self._get_user_profile(db, user_id)

            # Merge filters from NLP and request
            combined_filters = {**nlp_result.get("filters", {}), **filters}

            # Get candidate items using different algorithms
            semantic_candidates = await self._semantic_search(
                nlp_result["embedding"],
                combined_filters,
                limit * 3
            )

            collaborative_candidates = []
            if user_id and user_profile:
                collaborative_candidates = await self._collaborative_filtering(
                    db, user_id, user_profile, limit * 2
                )

            content_candidates = []
            if user_profile:
                content_candidates = await self._content_filtering(
                    db, user_profile, combined_filters, limit * 2
                )

            # Combine and rank all candidates
            final_recommendations = await self._hybrid_ranking(
                db,
                semantic_candidates,
                collaborative_candidates, 
                content_candidates,
                user_profile,
                limit
            )

            # Generate explanations
            for rec in final_recommendations:
                rec["explanation"] = await self._explain_recommendation(
                    rec, nlp_result, user_profile
                )

            # Calculate processing time
            processing_time = (datetime.now() - start_time).total_seconds() * 1000

            # Save query to database
            query_id = await self._save_query(
                db, user_id, query, nlp_result, final_recommendations
            )

            db.close()

            return {
                "query_id": query_id,
                "original_query": query,
                "processed_query": nlp_result["cleaned_text"],
                "intent": nlp_result["intent"],
                "intent_confidence": nlp_result["intent_confidence"],
                "recommendations": final_recommendations,
                "total_found": len(final_recommendations),
                "processing_time_ms": int(processing_time),
                "explanation": "Рекомендации основаны на семантическом поиске, коллаборативной фильтрации и анализе контента"
            }

        except Exception as e:
            logger.error(f"Error getting recommendations: {e}")
            raise

    async def _get_user_profile(self, db: Session, user_id: int) -> Optional[Dict]:
        """Get user profile and preferences"""
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return None

            # Get user interactions
            interactions = db.query(UserInteraction).filter(
                UserInteraction.user_id == user_id
            ).all()

            # Build profile
            profile = {
                "id": user.id,
                "preferences": user.preferences or {},
                "interactions": [
                    {
                        "item_id": i.item_id,
                        "type": i.interaction_type,
                        "rating": i.rating,
                        "timestamp": i.timestamp.isoformat()
                    }
                    for i in interactions
                ]
            }

            return profile

        except Exception as e:
            logger.error(f"Error getting user profile: {e}")
            return None

    async def _semantic_search(self, embedding: List[float], filters: Dict, limit: int) -> List[Dict]:
        """Semantic search using vector embeddings"""
        try:
            # Use vector service for semantic search
            results = await vector_service.search_similar(
                embedding, 
                filters, 
                limit
            )
            
            return results

        except Exception as e:
            logger.error(f"Semantic search failed: {e}")
            return []

    async def _collaborative_filtering(self, db: Session, user_id: int, user_profile: Dict, limit: int) -> List[Dict]:
        """Collaborative filtering based on similar users"""
        try:
            # Find users with similar preferences
            similar_users = await self._find_similar_users(db, user_id, user_profile)
            
            if not similar_users:
                return []

            # Get items liked by similar users
            candidate_items = []
            for similar_user_id in similar_users:
                interactions = db.query(UserInteraction).filter(
                    and_(
                        UserInteraction.user_id == similar_user_id,
                        UserInteraction.interaction_type.in_(["like", "purchase"]),
                        UserInteraction.rating >= 4
                    )
                ).all()

                for interaction in interactions:
                    candidate_items.append({
                        "item_id": interaction.item_id,
                        "score": interaction.rating / 5.0,
                        "source": "collaborative"
                    })

            # Remove duplicates and sort by score
            unique_items = {}
            for item in candidate_items:
                if item["item_id"] not in unique_items:
                    unique_items[item["item_id"]] = item
                else:
                    unique_items[item["item_id"]]["score"] = max(
                        unique_items[item["item_id"]]["score"], 
                        item["score"]
                    )

            # Sort by score and return top items
            sorted_items = sorted(
                unique_items.values(), 
                key=lambda x: x["score"], 
                reverse=True
            )

            return sorted_items[:limit]

        except Exception as e:
            logger.error(f"Collaborative filtering failed: {e}")
            return []

    async def _content_filtering(self, db: Session, user_profile: Dict, filters: Dict, limit: int) -> List[Dict]:
        """Content-based filtering based on user preferences"""
        try:
            # Get user's preferred categories and attributes
            preferences = user_profile.get("preferences", {})
            preferred_categories = preferences.get("categories", [])
            preferred_attributes = preferences.get("attributes", {})

            # Build query
            query = db.query(Item)
            
            if preferred_categories:
                query = query.filter(Item.category_id.in_(preferred_categories))
            
            if filters.get("max_price"):
                query = query.filter(Item.price <= filters["max_price"])
            
            if filters.get("min_rating"):
                query = query.filter(Item.rating >= filters["min_rating"])

            # Get items
            items = query.limit(limit * 2).all()
            
            # Score items based on user preferences
            scored_items = []
            for item in items:
                score = 0.0
                
                # Category preference
                if item.category_id in preferred_categories:
                    score += 0.3
                
                # Rating preference
                if item.rating >= 4.0:
                    score += 0.2
                
                # Price preference
                if "max_price" in preferences and item.price <= preferences["max_price"]:
                    score += 0.1
                
                # Attribute matching
                for attr, value in preferred_attributes.items():
                    if attr in item.attributes and item.attributes[attr] == value:
                        score += 0.1

                scored_items.append({
                    "item_id": item.id,
                    "score": score,
                    "source": "content"
                })

            # Sort by score and return top items
            sorted_items = sorted(scored_items, key=lambda x: x["score"], reverse=True)
            return sorted_items[:limit]

        except Exception as e:
            logger.error(f"Content filtering failed: {e}")
            return []

    async def _hybrid_ranking(self, db: Session, semantic_candidates: List, 
                             collaborative_candidates: List, content_candidates: List,
                             user_profile: Optional[Dict], limit: int) -> List[Dict]:
        """Combine and rank all candidates using hybrid approach"""
        try:
            # Combine all candidates
            all_candidates = {}
            
            # Add semantic candidates
            for item in semantic_candidates:
                item_id = item["item_id"]
                if item_id not in all_candidates:
                    all_candidates[item_id] = {
                        "item_id": item_id,
                        "semantic_score": item.get("score", 0),
                        "collaborative_score": 0,
                        "content_score": 0,
                        "final_score": 0
                    }

            # Add collaborative candidates
            for item in collaborative_candidates:
                item_id = item["item_id"]
                if item_id not in all_candidates:
                    all_candidates[item_id] = {
                        "item_id": item_id,
                        "semantic_score": 0,
                        "collaborative_score": item.get("score", 0),
                        "content_score": 0,
                        "final_score": 0
                    }
                else:
                    all_candidates[item_id]["collaborative_score"] = item.get("score", 0)

            # Add content candidates
            for item in content_candidates:
                item_id = item["item_id"]
                if item_id not in all_candidates:
                    all_candidates[item_id] = {
                        "item_id": item_id,
                        "semantic_score": 0,
                        "collaborative_score": 0,
                        "content_score": item.get("score", 0),
                        "final_score": 0
                    }
                else:
                    all_candidates[item_id]["content_score"] = item.get("score", 0)

            # Calculate final scores
            for item_id, candidate in all_candidates.items():
                final_score = (
                    candidate["semantic_score"] * self.algorithm_weights["semantic"] +
                    candidate["collaborative_score"] * self.algorithm_weights["collaborative"] +
                    candidate["content_score"] * self.algorithm_weights["content"]
                )
                candidate["final_score"] = final_score

            # Sort by final score
            sorted_candidates = sorted(
                all_candidates.values(), 
                key=lambda x: x["final_score"], 
                reverse=True
            )

            # Get item details for top candidates
            top_item_ids = [c["item_id"] for c in sorted_candidates[:limit]]
            items = db.query(Item).filter(Item.id.in_(top_item_ids)).all()
            
            # Create item lookup
            item_lookup = {item.id: item for item in items}
            
            # Build final recommendations
            final_recommendations = []
            for candidate in sorted_candidates[:limit]:
                item = item_lookup.get(candidate["item_id"])
                if item:
                    final_recommendations.append({
                        "item_id": item.id,
                        "item": {
                            "id": item.id,
                            "name": item.name,
                            "description": item.description,
                            "price": item.price,
                            "rating": item.rating,
                            "attributes": item.attributes
                        },
                        "score": candidate["final_score"],
                        "confidence": min(candidate["final_score"] * 2, 1.0),
                        "reasoning_factors": self._get_reasoning_factors(candidate)
                    })

            return final_recommendations

        except Exception as e:
            logger.error(f"Hybrid ranking failed: {e}")
            return []

    def _get_reasoning_factors(self, candidate: Dict) -> List[str]:
        """Get reasoning factors for recommendation"""
        factors = []
        
        if candidate["semantic_score"] > 0.5:
            factors.append("Семантическое соответствие запросу")
        
        if candidate["collaborative_score"] > 0.5:
            factors.append("Похожие пользователи выбирали это")
        
        if candidate["content_score"] > 0.5:
            factors.append("Соответствует вашим предпочтениям")
        
        return factors

    async def _explain_recommendation(self, recommendation: Dict, nlp_result: Dict, user_profile: Optional[Dict]) -> str:
        """Generate explanation for recommendation"""
        try:
            item_name = recommendation["item"]["name"]
            score = recommendation["score"]
            
            if score > 0.8:
                explanation = f"Отличный выбор! {item_name} идеально подходит для вашего запроса."
            elif score > 0.6:
                explanation = f"Хороший вариант: {item_name} соответствует вашим критериям."
            else:
                explanation = f"Интересный вариант: {item_name} может вас заинтересовать."
            
            return explanation

        except Exception as e:
            logger.error(f"Error generating explanation: {e}")
            return "Рекомендация основана на анализе вашего запроса и предпочтений."

    async def _save_query(self, db: Session, user_id: Optional[int], query: str, 
                         nlp_result: Dict, recommendations: List[Dict]) -> str:
        """Save query and results to database"""
        try:
            # Generate query ID
            query_id = f"q_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{hash(query) % 10000}"
            
            # Create choice record
            choice = Choice(
                user_id=user_id,
                query_text=query,
                processed_query=nlp_result["cleaned_text"],
                intent=nlp_result["intent"],
                selected_items=[r["item_id"] for r in recommendations],
                algorithm_version="hybrid_v1",
                processing_time_ms=0
            )
            
            db.add(choice)
            db.commit()
            
            return query_id

        except Exception as e:
            logger.error(f"Error saving query: {e}")
            return f"q_{datetime.now().strftime('%Y%m%d_%H%M%S')}_error"

    async def _find_similar_users(self, db: Session, user_id: int, user_profile: Dict) -> List[int]:
        """Find users with similar preferences"""
        try:
            # Simple implementation - find users who liked similar items
            user_interactions = db.query(UserInteraction).filter(
                UserInteraction.user_id == user_id,
                UserInteraction.interaction_type.in_(["like", "purchase"]),
                UserInteraction.rating >= 4
            ).all()
            
            if not user_interactions:
                return []
            
            # Get items liked by current user
            liked_item_ids = [i.item_id for i in user_interactions]
            
            # Find users who also liked these items
            similar_users = db.query(UserInteraction.user_id).filter(
                and_(
                    UserInteraction.item_id.in_(liked_item_ids),
                    UserInteraction.user_id != user_id,
                    UserInteraction.interaction_type.in_(["like", "purchase"]),
                    UserInteraction.rating >= 4
                )
            ).distinct().limit(10).all()
            
            return [u[0] for u in similar_users]

        except Exception as e:
            logger.error(f"Error finding similar users: {e}")
            return []

# Global instance
recommendation_engine = RecommendationEngine()
