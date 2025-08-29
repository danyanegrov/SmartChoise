# Создаем API роуты и главное приложение FastAPI

# app/api/deps.py - зависимости для API
deps_content = '''from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from app.core.database import get_db, SessionLocal
from app.core.config import settings
from app.models.user import User

security = HTTPBearer()

def get_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            credentials.credentials, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def get_optional_user(
    db: Session = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[User]:
    """Get user if authenticated, None otherwise"""
    if not credentials:
        return None
    
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        username: str = payload.get("sub")
        if username is None:
            return None
            
        user = db.query(User).filter(User.username == username).first()
        return user if user and user.is_active else None
        
    except JWTError:
        return None
'''

# app/api/routes.py - основные API роуты
routes_content = '''from datetime import datetime, timedelta
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
from app.services.nlp_service import process_nlp_request
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
        result = await process_nlp_request(request.text, request.user_context)
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
            message="Feedback recorded successfully"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Feedback submission failed: {str(e)}"
        )

@router.get("/items", response_model=List[Dict[str, Any]])
async def search_items(
    category_id: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    search: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Search and filter items"""
    try:
        query = db.query(Item).filter(Item.is_available == 1)
        
        if category_id:
            query = query.filter(Item.category_id == category_id)
        
        if min_price:
            query = query.filter(Item.price >= min_price)
            
        if max_price:
            query = query.filter(Item.price <= max_price)
            
        if min_rating:
            query = query.filter(Item.rating >= min_rating)
            
        if search:
            query = query.filter(
                or_(
                    Item.name.ilike(f"%{search}%"),
                    Item.description.ilike(f"%{search}%")
                )
            )
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        items = query.offset(offset).limit(limit).all()
        
        # Format response
        items_data = []
        for item in items:
            items_data.append({
                "id": item.id,
                "name": item.name,
                "description": item.description,
                "price": item.price,
                "currency": item.currency,
                "rating": item.rating,
                "rating_count": item.rating_count,
                "category_id": item.category_id,
                "attributes": item.attributes,
                "is_available": item.is_available
            })
        
        return {
            "items": items_data,
            "total": total,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )

@router.get("/items/{item_id}")
async def get_item(item_id: int, db: Session = Depends(get_db)):
    """Get item details"""
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
        "price": item.price,
        "currency": item.currency,
        "rating": item.rating,
        "rating_count": item.rating_count,
        "category_id": item.category_id,
        "attributes": item.attributes,
        "is_available": item.is_available,
        "created_at": item.created_at,
        "updated_at": item.updated_at
    }

@router.get("/categories")
async def get_categories(db: Session = Depends(get_db)):
    """Get all categories"""
    categories = db.query(Category).all()
    
    categories_data = []
    for cat in categories:
        categories_data.append({
            "id": cat.id,
            "name": cat.name,
            "description": cat.description,
            "parent_id": cat.parent_id
        })
    
    return {"categories": categories_data}

@router.post("/users/{user_id}/interactions")
async def record_interaction(
    user_id: int,
    item_id: int,
    interaction_type: str,
    rating: Optional[int] = None,
    feedback: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Record user interaction with item"""
    if current_user.id != user_id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to record interactions for this user"
        )
    
    interaction = UserInteraction(
        user_id=user_id,
        item_id=item_id,
        interaction_type=interaction_type,
        rating=rating,
        feedback=feedback
    )
    
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    
    return {"message": "Interaction recorded", "id": interaction.id}

@router.get("/users/{user_id}/history")
async def get_user_history(
    user_id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get user interaction history"""
    if current_user.id != user_id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this user's history"
        )
    
    interactions = db.query(UserInteraction).filter(
        UserInteraction.user_id == user_id
    ).order_by(
        UserInteraction.timestamp.desc()
    ).limit(limit).all()
    
    history = []
    for interaction in interactions:
        item = db.query(Item).filter(Item.id == interaction.item_id).first()
        history.append({
            "interaction_id": interaction.id,
            "item_id": interaction.item_id,
            "item_name": item.name if item else "Unknown",
            "interaction_type": interaction.interaction_type,
            "rating": interaction.rating,
            "feedback": interaction.feedback,
            "timestamp": interaction.timestamp
        })
    
    return {"history": history}

@router.get("/analytics/stats")
async def get_analytics(db: Session = Depends(get_db)):
    """Get system analytics"""
    try:
        # Basic stats
        total_users = db.query(User).count()
        total_items = db.query(Item).count()
        total_interactions = db.query(UserInteraction).count()
        total_queries = db.query(Choice).count()
        
        # Vector DB stats
        vector_stats = vector_service.get_collection_stats()
        
        return {
            "users": total_users,
            "items": total_items, 
            "interactions": total_interactions,
            "queries": total_queries,
            "vector_db": vector_stats,
            "timestamp": datetime.now()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analytics failed: {str(e)}"
        )
'''

# app/main.py - главное FastAPI приложение
main_content = '''from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import time
import uuid
from loguru import logger

from app.core.config import settings
from app.core.database import Base, engine, check_connections
from app.api.routes import router as api_router

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Intelligent Choice System - AI-powered recommendation engine",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # Configure appropriately for production
)

# Request middleware for logging and metrics
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests with timing"""
    request_id = str(uuid.uuid4())
    start_time = time.time()
    
    # Add request ID to headers
    request.state.request_id = request_id
    
    logger.info(f"Request {request_id}: {request.method} {request.url}")
    
    try:
        response = await call_next(request)
        
        # Calculate processing time
        process_time = time.time() - start_time
        
        # Add headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = str(process_time)
        
        logger.info(
            f"Request {request_id} completed: "
            f"status={response.status_code} time={process_time:.3f}s"
        )
        
        return response
        
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(
            f"Request {request_id} failed: "
            f"error={str(e)} time={process_time:.3f}s"
        )
        
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error",
                "request_id": request_id,
                "error": str(e)
            },
            headers={"X-Request-ID": request_id}
        )

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with system info"""
    connections = check_connections()
    
    return {
        "message": "Intelligent Choice System API",
        "version": "1.0.0",
        "status": "running",
        "connections": connections,
        "docs": "/docs",
        "api": settings.API_V1_PREFIX
    }

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting Intelligent Choice System...")
    
    # Check all connections
    connections = check_connections()
    
    if not all(connections.values()):
        logger.warning("Some services are not available:")
        for service, status in connections.items():
            if not status:
                logger.warning(f"  - {service}: NOT CONNECTED")
    else:
        logger.info("All services connected successfully")
    
    logger.info("System startup completed")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Intelligent Choice System...")
    # Add cleanup code here if needed
    logger.info("Shutdown completed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
'''

# Создаем API файлы
os.makedirs("app/api", exist_ok=True)

with open("app/api/__init__.py", "w") as f:
    f.write("")

with open("app/api/deps.py", "w", encoding="utf-8") as f:
    f.write(deps_content)
    
with open("app/api/routes.py", "w", encoding="utf-8") as f:
    f.write(routes_content)
    
with open("app/main.py", "w", encoding="utf-8") as f:
    f.write(main_content)

print("✅ API и главное приложение созданы:")
print("- app/api/deps.py")
print("- app/api/routes.py") 
print("- app/main.py")