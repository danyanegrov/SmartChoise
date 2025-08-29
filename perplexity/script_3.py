# Создаем модели базы данных

# app/models/user.py
user_model_content = '''from sqlalchemy import Column, Integer, String, DateTime, JSON, Boolean, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    
    # JSON field for preferences
    preferences = Column(JSON, default={})
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    interactions = relationship("UserInteraction", back_populates="user")
    choices = relationship("Choice", back_populates="user")

class UserInteraction(Base):
    __tablename__ = "user_interactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    item_id = Column(Integer, nullable=False, index=True)
    interaction_type = Column(String(20), nullable=False)  # view, like, dislike, purchase
    rating = Column(Integer)  # 1-5 stars
    feedback = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    user = relationship("User", back_populates="interactions")
'''

# app/models/choice.py  
choice_model_content = '''from sqlalchemy import Column, Integer, String, DateTime, JSON, Text, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text)
    parent_id = Column(Integer, ForeignKey("categories.id"))
    
    # Self-referential relationship
    parent = relationship("Category", remote_side=[id])
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Item(Base):
    __tablename__ = "items"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text)
    category_id = Column(Integer, ForeignKey("categories.id"))
    
    # Price and rating
    price = Column(Float)
    currency = Column(String(3), default="RUB")
    rating = Column(Float, default=0.0)
    rating_count = Column(Integer, default=0)
    
    # JSON attributes for flexible data
    attributes = Column(JSON, default={})
    
    # Availability
    is_available = Column(Integer, default=1)
    stock_quantity = Column(Integer)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    category = relationship("Category")

class Choice(Base):
    __tablename__ = "choices"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Query information
    query_text = Column(Text, nullable=False)
    processed_query = Column(Text)
    intent = Column(String(50))
    
    # Results
    selected_items = Column(JSON)  # List of recommended item IDs with scores
    user_feedback = Column(Integer)  # 1-5 rating of recommendation quality
    feedback_text = Column(Text)
    
    # Metadata
    algorithm_version = Column(String(20))
    processing_time_ms = Column(Integer)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    user = relationship("User", back_populates="choices")

class QuerySession(Base):
    __tablename__ = "query_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Session data
    queries = Column(JSON, default=[])  # List of queries in this session
    context = Column(JSON, default={})  # Session context
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))
'''

# app/models/schemas.py
schemas_content = '''from pydantic import BaseModel, EmailStr
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
'''

# Создаем файлы моделей
os.makedirs("app/models", exist_ok=True)

with open("app/models/__init__.py", "w") as f:
    f.write("")

with open("app/models/user.py", "w", encoding="utf-8") as f:
    f.write(user_model_content)
    
with open("app/models/choice.py", "w", encoding="utf-8") as f:
    f.write(choice_model_content)
    
with open("app/models/schemas.py", "w", encoding="utf-8") as f:
    f.write(schemas_content)

print("✅ Модели данных созданы:")
print("- app/models/user.py")
print("- app/models/choice.py")
print("- app/models/schemas.py")