from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from app.core.database import get_db, check_connections
from app.core.config import settings
from app.models.user import User, UserInteraction
from app.models.choice import Item, Category, Choice
from app.models.schemas import (
    RecommendationRequest, RecommendationResponse,
    NLPRequest, NLPResponse, HealthCheck,
    SearchRequest, SearchResponse,
    FeedbackRequest, FeedbackResponse
)
from app.services.nlp_service import nlp_processor
from app.services.recommendation_service import recommendation_engine
from app.services.vector_service import vector_service
from app.api.deps import get_current_active_user, get_optional_user

router = APIRouter()

@router.get("/health", response_model=HealthCheck)
async def health_check():
    """Health check endpoint"""
    connections = check_connections()

    return HealthCheck(
        status="healthy" if all(connections.values()) else "unhealthy",
        timestamp=datetime.now(),
        services=connections,
        version="1.0.0"
    )

@router.post("/nlp/process", response_model=Dict[str, Any])
async def process_nlp(request: NLPRequest):
    """Process text with NLP pipeline"""
    try:
        result = await nlp_processor.process_query(request.text, request.user_context)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"NLP processing failed: {str(e)}"
        )

@router.post("/recommendations", response_model=Dict[str, Any])
async def get_recommendations(
    request: RecommendationRequest,
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Get personalized recommendations"""
    try:
        user_id = current_user.id if current_user else request.user_id

        result = await recommendation_engine.get_recommendations(
            user_id=user_id,
            query=request.query,
            filters=request.filters,
            limit=request.limit
        )

        return result

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recommendation failed: {str(e)}"
        )

@router.post("/recommendations/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    request: FeedbackRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Submit feedback for recommendations"""
    try:
        # Update choice with feedback
        choice = db.query(Choice).filter(Choice.id == request.query_id).first()
        if choice:
            choice.user_feedback = request.rating
            choice.feedback_text = request.feedback_text
            db.commit()

        # Record individual item ratings
        if request.item_ratings and current_user:
            for item_id, rating in request.item_ratings.items():
                interaction = UserInteraction(
                    user_id=current_user.id,
                    item_id=int(item_id),
                    interaction_type="rating",
                    rating=rating,
                    feedback=request.feedback_text
                )
                db.add(interaction)
            db.commit()

        return FeedbackResponse(
            success=True,
            message="Feedback submitted successfully"
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Feedback submission failed: {str(e)}"
        )

@router.get("/search", response_model=SearchResponse)
async def search_items(
    query: Optional[str] = None,
    category_id: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    tags: Optional[List[str]] = None,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Search items with filters"""
    try:
        # Build query
        db_query = db.query(Item)
        
        if query:
            # Simple text search
            db_query = db_query.filter(
                or_(
                    Item.name.ilike(f"%{query}%"),
                    Item.description.ilike(f"%{query}%")
                )
            )
        
        if category_id:
            db_query = db_query.filter(Item.category_id == category_id)
        
        if min_price is not None:
            db_query = db_query.filter(Item.price >= min_price)
        
        if max_price is not None:
            db_query = db_query.filter(Item.price <= max_price)
        
        if min_rating is not None:
            db_query = db_query.filter(Item.rating >= min_rating)
        
        # Get total count
        total = db_query.count()
        
        # Apply pagination
        items = db_query.offset(offset).limit(limit).all()
        
        # Build response
        filters_applied = {
            "query": query,
            "category_id": category_id,
            "min_price": min_price,
            "max_price": max_price,
            "min_rating": min_rating,
            "tags": tags
        }
        
        return SearchResponse(
            items=items,
            total=total,
            limit=limit,
            offset=offset,
            filters_applied=filters_applied
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )

@router.get("/categories", response_model=List[Dict[str, Any]])
async def get_categories(db: Session = Depends(get_db)):
    """Get all categories"""
    try:
        categories = db.query(Category).all()
        return [
            {
                "id": cat.id,
                "name": cat.name,
                "description": cat.description,
                "parent_id": cat.parent_id
            }
            for cat in categories
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get categories: {str(e)}"
        )

@router.get("/items/{item_id}", response_model=Dict[str, Any])
async def get_item(item_id: int, db: Session = Depends(get_db)):
    """Get item details"""
    try:
        item = db.query(Item).filter(Item.id == item_id).first()
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item not found"
            )
        
        return {
            "id": item.id,
            "name": item.name,
            "description": item.description,
            "category_id": item.category_id,
            "price": item.price,
            "currency": item.currency,
            "rating": item.rating,
            "rating_count": item.rating_count,
            "attributes": item.attributes,
            "is_available": item.is_available,
            "stock_quantity": item.stock_quantity,
            "created_at": item.created_at,
            "updated_at": item.updated_at
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get item: {str(e)}"
        )

@router.post("/vector/search", response_model=List[Dict[str, Any]])
async def vector_search(
    query: str,
    limit: int = 10,
    filters: Optional[Dict[str, Any]] = None
):
    """Search using vector similarity"""
    try:
        # Process query with NLP to get embedding
        nlp_result = await nlp_processor.process_query(query)
        embedding = nlp_result["embedding"]
        
        # Search in vector database
        results = await vector_service.search_similar(
            embedding, 
            filters or {}, 
            limit
        )
        
        return results

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Vector search failed: {str(e)}"
        )

@router.get("/vector/stats", response_model=Dict[str, Any])
async def get_vector_stats():
    """Get vector database statistics"""
    try:
        stats = await vector_service.get_collection_stats()
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get vector stats: {str(e)}"
        )

@router.post("/vector/clear")
async def clear_vector_database():
    """Clear vector database (admin only)"""
    try:
        success = await vector_service.clear_collection()
        if success:
            return {"message": "Vector database cleared successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to clear vector database"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear vector database: {str(e)}"
        )
