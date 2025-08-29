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
                "explanation": self._generate_main_explanation(nlp_result, len(final_recommendations))
            }

        except Exception as e:
            logger.error(f"Recommendation error: {e}")
            raise

    async def _get_user_profile(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Build user profile from interactions"""
        try:
            # Get user
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return {}

            # Get interaction history
            interactions = db.query(UserInteraction).filter(
                UserInteraction.user_id == user_id
            ).order_by(UserInteraction.timestamp.desc()).limit(100).all()

            # Analyze preferences
            liked_items = [i.item_id for i in interactions if i.interaction_type == "like"]
            purchased_items = [i.item_id for i in interactions if i.interaction_type == "purchase"]

            # Get category preferences
            category_stats = db.query(
                Item.category_id,
                func.count(UserInteraction.id).label("interaction_count")
            ).join(
                UserInteraction, Item.id == UserInteraction.item_id
            ).filter(
                UserInteraction.user_id == user_id,
                UserInteraction.interaction_type.in_(["like", "purchase"])
            ).group_by(Item.category_id).order_by(
                func.count(UserInteraction.id).desc()
            ).limit(5).all()

            preferred_categories = [cat.category_id for cat in category_stats]

            # Calculate average price range
            price_stats = db.query(
                func.avg(Item.price).label("avg_price"),
                func.min(Item.price).label("min_price"),
                func.max(Item.price).label("max_price")
            ).join(
                UserInteraction, Item.id == UserInteraction.item_id
            ).filter(
                UserInteraction.user_id == user_id,
                UserInteraction.interaction_type.in_(["like", "purchase"]),
                Item.price.isnot(None)
            ).first()

            return {
                "user_id": user_id,
                "preferences": user.preferences,
                "liked_items": liked_items,
                "purchased_items": purchased_items,
                "preferred_categories": preferred_categories,
                "price_stats": {
                    "avg": float(price_stats.avg_price) if price_stats.avg_price else None,
                    "min": float(price_stats.min_price) if price_stats.min_price else None,
                    "max": float(price_stats.max_price) if price_stats.max_price else None
                } if price_stats else {},
                "interaction_count": len(interactions)
            }

        except Exception as e:
            logger.error(f"Error building user profile: {e}")
            return {}

    async def _semantic_search(self, 
                             query_embedding: List[float],
                             filters: Dict[str, Any],
                             limit: int) -> List[Dict]:
        """Semantic search using vector similarity"""
        try:
            # Search in Milvus
            similar_items = await vector_service.search_similar(
                query_embedding, 
                top_k=limit
            )

            # Add algorithm info
            for item in similar_items:
                item["algorithm"] = "semantic"
                item["base_score"] = item["similarity_score"]

            return similar_items

        except Exception as e:
            logger.error(f"Semantic search error: {e}")
            return []

    async def _collaborative_filtering(self,
                                     db: Session,
                                     user_id: int,
                                     user_profile: Dict,
                                     limit: int) -> List[Dict]:
        """Collaborative filtering based on similar users"""
        try:
            # Find similar users based on liked items
            user_liked_items = set(user_profile.get("liked_items", []))

            if not user_liked_items:
                return []

            # Get users who liked similar items
            similar_users = db.query(
                UserInteraction.user_id,
                func.count(UserInteraction.item_id).label("common_items")
            ).filter(
                UserInteraction.item_id.in_(user_liked_items),
                UserInteraction.user_id != user_id,
                UserInteraction.interaction_type.in_(["like", "purchase"])
            ).group_by(
                UserInteraction.user_id
            ).having(
                func.count(UserInteraction.item_id) >= 2
            ).order_by(
                func.count(UserInteraction.item_id).desc()
            ).limit(20).all()

            if not similar_users:
                return []

            similar_user_ids = [u.user_id for u in similar_users]

            # Get items liked by similar users but not by current user
            recommended_items = db.query(
                UserInteraction.item_id,
                func.count(UserInteraction.user_id).label("recommendation_score"),
                Item.name,
                Item.price,
                Item.rating
            ).join(
                Item, UserInteraction.item_id == Item.id
            ).filter(
                UserInteraction.user_id.in_(similar_user_ids),
                UserInteraction.interaction_type.in_(["like", "purchase"]),
                ~UserInteraction.item_id.in_(user_liked_items)
            ).group_by(
                UserInteraction.item_id, Item.name, Item.price, Item.rating
            ).order_by(
                func.count(UserInteraction.user_id).desc()
            ).limit(limit).all()

            # Format results
            results = []
            for item in recommended_items:
                results.append({
                    "item_id": item.item_id,
                    "name": item.name,
                    "price": item.price,
                    "rating": item.rating,
                    "algorithm": "collaborative",
                    "base_score": min(item.recommendation_score / 5.0, 1.0),
                    "similarity_score": min(item.recommendation_score / 5.0, 1.0)
                })

            return results

        except Exception as e:
            logger.error(f"Collaborative filtering error: {e}")
            return []

    async def _content_filtering(self,
                               db: Session,
                               user_profile: Dict,
                               filters: Dict,
                               limit: int) -> List[Dict]:
        """Content-based filtering using item attributes"""
        try:
            preferred_categories = user_profile.get("preferred_categories", [])
            price_stats = user_profile.get("price_stats", {})

            # Build query
            query = db.query(Item).filter(Item.is_available == 1)

            # Apply category preference
            if preferred_categories:
                query = query.filter(Item.category_id.in_(preferred_categories))

            # Apply price filter based on user history
            if price_stats.get("avg"):
                avg_price = price_stats["avg"]
                price_range = avg_price * 0.5  # 50% range around average
                query = query.filter(
                    and_(
                        Item.price >= avg_price - price_range,
                        Item.price <= avg_price + price_range
                    )
                )

            # Apply request filters
            if filters.get("max_price"):
                query = query.filter(Item.price <= filters["max_price"])

            if filters.get("min_price"):
                query = query.filter(Item.price >= filters["min_price"])

            if filters.get("category"):
                category = db.query(Category).filter(
                    Category.name.ilike(f"%{filters['category']}%")
                ).first()
                if category:
                    query = query.filter(Item.category_id == category.id)

            # Order by rating and get results
            items = query.order_by(Item.rating.desc()).limit(limit).all()

            # Format results
            results = []
            for item in items:
                # Calculate content score based on match with user preferences
                content_score = 0.5  # Base score

                if item.category_id in preferred_categories:
                    content_score += 0.3

                if item.rating > 4.0:
                    content_score += 0.2

                results.append({
                    "item_id": item.id,
                    "name": item.name,
                    "price": item.price,
                    "rating": item.rating,
                    "category_id": item.category_id,
                    "algorithm": "content",
                    "base_score": min(content_score, 1.0),
                    "similarity_score": min(content_score, 1.0)
                })

            return results

        except Exception as e:
            logger.error(f"Content filtering error: {e}")
            return []

    async def _hybrid_ranking(self,
                            db: Session,
                            semantic_candidates: List[Dict],
                            collaborative_candidates: List[Dict],
                            content_candidates: List[Dict],
                            user_profile: Optional[Dict],
                            limit: int) -> List[Dict]:
        """Combine and rank all candidates"""
        try:
            # Combine all candidates
            all_candidates = {}

            # Add semantic candidates
            for item in semantic_candidates:
                item_id = item["item_id"]
                if item_id not in all_candidates:
                    all_candidates[item_id] = item.copy()
                    all_candidates[item_id]["scores"] = {}

                all_candidates[item_id]["scores"]["semantic"] = item["base_score"]

            # Add collaborative candidates
            for item in collaborative_candidates:
                item_id = item["item_id"]
                if item_id not in all_candidates:
                    all_candidates[item_id] = item.copy()
                    all_candidates[item_id]["scores"] = {}

                all_candidates[item_id]["scores"]["collaborative"] = item["base_score"]

            # Add content candidates
            for item in content_candidates:
                item_id = item["item_id"]
                if item_id not in all_candidates:
                    all_candidates[item_id] = item.copy()
                    all_candidates[item_id]["scores"] = {}

                all_candidates[item_id]["scores"]["content"] = item["base_score"]

            # Calculate hybrid scores
            for item_id, item in all_candidates.items():
                scores = item["scores"]

                hybrid_score = (
                    scores.get("semantic", 0) * self.algorithm_weights["semantic"] +
                    scores.get("collaborative", 0) * self.algorithm_weights["collaborative"] +
                    scores.get("content", 0) * self.algorithm_weights["content"]
                )

                # Apply popularity boost
                item_data = db.query(Item).filter(Item.id == item_id).first()
                if item_data and item_data.rating > 4.0:
                    hybrid_score *= 1.1

                item["final_score"] = hybrid_score
                item["confidence"] = min(len(scores) / 3.0, 1.0)  # Confidence based on algorithm coverage

            # Sort by hybrid score and return top items
            sorted_items = sorted(
                all_candidates.values(),
                key=lambda x: x["final_score"],
                reverse=True
            )

            return sorted_items[:limit]

        except Exception as e:
            logger.error(f"Hybrid ranking error: {e}")
            return []

    async def _explain_recommendation(self,
                                    recommendation: Dict,
                                    nlp_result: Dict,
                                    user_profile: Optional[Dict]) -> str:
        """Generate explanation for recommendation"""
        try:
            reasons = []
            scores = recommendation.get("scores", {})

            # Semantic reasons
            if scores.get("semantic", 0) > 0.5:
                reasons.append("соответствует вашему запросу")

            # Collaborative reasons
            if scores.get("collaborative", 0) > 0.3:
                reasons.append("пользователи с похожими предпочтениями также выбирали")

            # Content reasons
            if scores.get("content", 0) > 0.3:
                reasons.append("подходит по вашим критериям")

            # Rating boost
            if recommendation.get("rating", 0) > 4.0:
                reasons.append(f"высокий рейтинг ({recommendation.get('rating', 0):.1f})")

            # Price considerations
            if user_profile and user_profile.get("price_stats", {}).get("avg"):
                avg_price = user_profile["price_stats"]["avg"]
                item_price = recommendation.get("price", 0)
                if item_price <= avg_price * 1.2:  # Within 20% of average
                    reasons.append("соответствует вашему бюджету")

            if not reasons:
                reasons.append("рекомендовано системой")

            return "Рекомендуем, потому что " + ", ".join(reasons) + "."

        except Exception as e:
            logger.error(f"Explanation generation error: {e}")
            return "Рекомендовано на основе анализа ваших предпочтений."

    def _generate_main_explanation(self, nlp_result: Dict, count: int) -> str:
        """Generate main explanation for the query"""
        intent = nlp_result.get("intent", "search")

        explanations = {
            "purchase": f"Найдено {count} вариантов для покупки на основе вашего запроса.",
            "compare": f"Подобрано {count} вариантов для сравнения по указанным критериям.",
            "recommend": f"Рекомендовано {count} лучших вариантов согласно вашим предпочтениям.",
            "search": f"Найдено {count} вариантов, соответствующих вашему поиску."
        }

        return explanations.get(intent, f"Найдено {count} подходящих вариантов.")

    async def _save_query(self,
                        db: Session,
                        user_id: Optional[int],
                        query: str,
                        nlp_result: Dict,
                        recommendations: List[Dict]) -> str:
        """Save query to database"""
        try:
            choice = Choice(
                user_id=user_id,
                query_text=query,
                processed_query=nlp_result["cleaned_text"],
                intent=nlp_result["intent"],
                selected_items=json.dumps([r["item_id"] for r in recommendations]),
                algorithm_version="v1.0"
            )

            db.add(choice)
            db.commit()
            db.refresh(choice)

            return str(choice.id)

        except Exception as e:
            logger.error(f"Failed to save query: {e}")
            return "unknown"

# Global recommendation engine
recommendation_engine = RecommendationEngine()
