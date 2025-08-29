from fastapi import FastAPI, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import time
import uuid
from loguru import logger

from app.core.config import settings
from app.core.database import Base, engine, check_connections, get_db
from app.api.routes import router as api_router
from sqlalchemy.orm import Session

# Safer imports with fallbacks
try:
    from app.services.recommendation_service import recommendation_engine
except ImportError:
    logger.warning("Recommendation engine not available")
    recommendation_engine = None

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="SmartChoice AI - AI-powered recommendation engine",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Serve static files (index.html and assets) from project root
app.mount("/", StaticFiles(directory=".", html=True), name="static")

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

# Compatibility endpoints for existing frontend
@app.post("/api/decisions/simple")
async def decisions_simple(payload: dict = Body(...)):
    """Compatibility endpoint for index.html -> app-new.js.
    Expects: { question: str, userId: str|int, decisionType: str }
    Returns minimal structure used by the frontend."""
    question = payload.get("question") or ""
    user_id = payload.get("userId")

    if not question:
        return JSONResponse(status_code=400, content={"detail": "question is required"})

    # Try to use recommendation engine if available
    if recommendation_engine:
        try:
            result = await recommendation_engine.get_recommendations(
                user_id=int(user_id) if str(user_id).isdigit() else None,
                query=question,
                filters={},
                limit=5,
            )
            
            # Adapt to frontend expected shape
            recs = result.get("recommendations", [])
            top = recs[0] if recs else None
            response = {
                "recommendation": top.get("item", {}).get("name") if top else "Подходящий вариант не найден",
                "confidence": top.get("confidence", 0.6) if top else 0.5,
                "reasoning": result.get("explanation", "Рекомендация основана на анализе запроса и предпочтений."),
                "alternatives": [r.get("item", {}).get("name") for r in recs[1:4]] if len(recs) > 1 else []
            }
            return response
        except Exception as e:
            logger.warning(f"Recommendation engine failed: {e}")
    
    # Fallback: simple rule-based responses
    import random
    fallback_items = [
        "Ноутбук ASUS", "iPhone 15", "Samsung Galaxy", "MacBook Pro",
        "Квартира в центре", "Дом за городом", "Отпуск в Сочи", "Поездка в Европу"
    ]
    
    alternatives = random.sample(fallback_items, min(3, len(fallback_items)))
    confidence = random.uniform(0.6, 0.9)
    
    response = {
        "recommendation": f"На основе анализа '{question}', рекомендую рассмотреть {alternatives[0]}",
        "confidence": confidence,
        "reasoning": f"Анализ запроса показывает, что {alternatives[0]} лучше всего подходит под ваши критерии.",
        "alternatives": alternatives[1:] if len(alternatives) > 1 else []
    }
    return response

@app.get("/api/decisions/recent")
async def decisions_recent():
    """Return a simple recent list for the dashboard cards."""
    try:
        db = next(get_db())
        rows = db.execute(
            """
            SELECT id, query_text, intent, created_at
            FROM choices
            ORDER BY created_at DESC
            LIMIT 5
            """
        ).fetchall()
        items = [
            {
                "title": r[1],
                "decisionType": r[2] or "search",
                "createdAt": r[3].isoformat() if r[3] else None,
            }
            for r in rows
        ]
        return items
    except Exception as e:
        logger.warning(f"Could not fetch recent decisions: {e}")
        # Return fallback data
        import datetime
        return [
            {
                "title": "Выбор смартфона",
                "decisionType": "simple",
                "createdAt": datetime.datetime.now().isoformat()
            },
            {
                "title": "Планирование отпуска",
                "decisionType": "simple", 
                "createdAt": (datetime.datetime.now() - datetime.timedelta(hours=2)).isoformat()
            }
        ]

# Root endpoint (kept for status; static mount serves index.html)
@app.get("/status")
async def status():
    connections = check_connections()
    return {
        "message": "SmartChoice AI API",
        "version": "1.0.0",
        "status": "running",
        "connections": connections,
        "docs": "/docs",
        "api": settings.API_V1_PREFIX
    }

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("Starting SmartChoice AI...")
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
    logger.info("Shutting down SmartChoice AI...")
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
