from pydantic import BaseModel, EmailStr
from typing import List, Dict, Optional, Any
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

class User(UserBase):
    id: int
    is_active: bool
    preferences: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

# Item schemas
class ItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    price: Optional[float] = None
    currency: str = "RUB"

class ItemCreate(ItemBase):
    attributes: Optional[Dict[str, Any]] = {}

class Item(ItemBase):
    id: int
    rating: float
    rating_count: int
    attributes: Dict[str, Any]
    is_available: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Recommendation schemas
class RecommendationRequest(BaseModel):
    query: str
    user_id: Optional[int] = None
    filters: Optional[Dict[str, Any]] = {}
    limit: int = 10

class RecommendationItem(BaseModel):
    item_id: int
    item: Item
    score: float
    confidence: float
    explanation: str
    reasoning_factors: List[str]

class RecommendationResponse(BaseModel):
    query_id: str
    original_query: str
    processed_query: str
    intent: str
    intent_confidence: float
    recommendations: List[RecommendationItem]
    total_found: int
    processing_time_ms: int
    explanation: str

# NLP schemas
class NLPRequest(BaseModel):
    text: str
    user_context: Optional[Dict[str, Any]] = {}

class Entity(BaseModel):
    text: str
    label: str
    start: int
    end: int
    confidence: float

class NLPResponse(BaseModel):
    original_text: str
    cleaned_text: str
    tokens: List[str]
    entities: List[Entity]
    intent: str
    intent_confidence: float
    sentiment: str
    sentiment_score: float
    filters: Dict[str, Any]
    embedding: List[float]

# Feedback schemas
class FeedbackRequest(BaseModel):
    query_id: str
    rating: int  # 1-5
    feedback_text: Optional[str] = None
    item_ratings: Optional[Dict[int, int]] = {}  # item_id -> rating

class FeedbackResponse(BaseModel):
    success: bool
    message: str

# Search schemas
class SearchRequest(BaseModel):
    query: Optional[str] = None
    category_id: Optional[int] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_rating: Optional[float] = None
    tags: Optional[List[str]] = []
    limit: int = 20
    offset: int = 0

class SearchResponse(BaseModel):
    items: List[Item]
    total: int
    limit: int
    offset: int
    filters_applied: Dict[str, Any]

# Health check
class HealthCheck(BaseModel):
    status: str
    timestamp: datetime
    services: Dict[str, bool]
    version: str
