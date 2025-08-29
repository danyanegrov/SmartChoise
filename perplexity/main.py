from fastapi import FastAPI, Request
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
