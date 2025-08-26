"""
Decision Helper ML Service
FastAPI-based microservice for machine learning algorithms
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from contextlib import asynccontextmanager
from loguru import logger

from app.core.config import settings
from app.api.endpoints import emotion, bandit, behavioral, health
from app.core.database import init_db
from app.services.cache import init_cache
from app.middleware.logging import LoggingMiddleware
from app.middleware.rate_limit import RateLimitMiddleware


# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🤖 Starting Decision Helper ML Service")
    
    # Initialize database connection
    await init_db()
    
    # Initialize cache
    await init_cache()
    
    # Load ML models
    from app.services.model_loader import load_models
    await load_models()
    
    logger.info("✅ ML Service startup complete")
    
    yield
    
    # Shutdown
    logger.info("🔄 Shutting down ML Service")


# Create FastAPI application
app = FastAPI(
    title="Decision Helper ML Service",
    description="AI/ML microservice for decision-making algorithms",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

app.add_middleware(LoggingMiddleware)
app.add_middleware(RateLimitMiddleware)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred",
            "request_id": getattr(request.state, "request_id", None)
        }
    )

# API Routes
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(emotion.router, prefix="/api/emotion", tags=["emotion"])
app.include_router(bandit.router, prefix="/api/bandit", tags=["bandit"])
app.include_router(behavioral.router, prefix="/api/behavioral", tags=["behavioral"])

# Root endpoint
@app.get("/")
async def root():
    return {
        "service": "Decision Helper ML Service",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }

# Run server
if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info",
        access_log=True
    )
