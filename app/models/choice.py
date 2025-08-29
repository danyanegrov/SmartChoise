from sqlalchemy import Column, Integer, String, DateTime, JSON, Text, Float, ForeignKey
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
