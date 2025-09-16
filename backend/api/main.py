"""
AI-Buyer FastAPI Backend
Main application entry point for ML-powered Facebook advertising optimization
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
import os

# Import route modules
from .routes import campaigns, analytics, facebook_accounts
# from .routes import predictions  # Temporary disabled due to ML dependencies

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AI-Buyer ML Service",
    description="Machine Learning backend for Facebook advertising optimization",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS configuration for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative React dev server
        "http://localhost:8082",  # New Vite dev server
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8082",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "ai-buyer-ml",
        "version": "1.0.0"
    }

# System status endpoint
@app.get("/api/status")
async def system_status():
    """System status with more detailed information"""
    try:
        # TODO: Add actual checks for external services
        services_status = {
            "clickhouse": "connected",  # Will implement actual check
            "redis": "connected",       # Will implement actual check
            "kafka": "connected",       # Will implement actual check
            "mlflow": "connected"       # Will implement actual check
        }
        
        return {
            "status": "operational",
            "timestamp": datetime.now().isoformat(),
            "services": services_status,
            "uptime": "calculating..."  # Will implement actual uptime
        }
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={"status": "degraded", "error": str(e)}
        )

# Include route modules
# Register route modules
app.include_router(campaigns.router)
# app.include_router(predictions.router)  # Temporary disabled due to ML dependencies
app.include_router(analytics.router)
app.include_router(facebook_accounts.router)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": "internal_error"}
    )

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("AI-Buyer ML Service starting up...")
    # TODO: Initialize ML models, database connections, etc.

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("AI-Buyer ML Service shutting down...")
    # TODO: Cleanup resources

if __name__ == "__main__":
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )