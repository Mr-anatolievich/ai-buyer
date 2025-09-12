"""
Predictions API Routes for AI-Buyer
Handles CTR predictions and budget optimization
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime

from ..ml.models.ctr_predictor import CTRPredictor
from ..ml.models.budget_optimizer import BudgetOptimizer

logger = logging.getLogger(__name__)
router = APIRouter()

# Request/Response Models
class CTRPredictionRequest(BaseModel):
    campaign_id: str = Field(..., description="Campaign ID")
    age_group: str = Field(..., description="Target age group")
    gender: str = Field(..., description="Target gender")
    device_type: str = Field(..., description="Device type")
    placement: str = Field(..., description="Ad placement")
    bid_amount: float = Field(..., gt=0, description="Bid amount in USD")
    budget_remaining: float = Field(..., ge=0, description="Remaining budget")
    audience_size: int = Field(..., gt=0, description="Target audience size")

class CTRPredictionResponse(BaseModel):
    predicted_ctr: float
    confidence_interval: List[float]
    model_version: str
    prediction_date: str
    recommendation: str

class BudgetOptimizationRequest(BaseModel):
    user_id: str = Field(..., description="User identifier")
    campaigns: List[Dict[str, Any]] = Field(..., description="List of campaigns")
    total_budget: float = Field(..., gt=0, description="Total budget to allocate")
    optimization_goal: str = Field(default="conversions", description="Optimization goal")
    time_horizon_days: int = Field(default=7, ge=1, le=30, description="Optimization time horizon")

class BudgetOptimizationResponse(BaseModel):
    recommendations: List[Dict[str, Any]]
    expected_improvement: Dict[str, float]
    confidence_score: float
    optimization_success: bool

# CTR Prediction Endpoint
@router.post("/ctr/predict", response_model=CTRPredictionResponse)
async def predict_ctr(request: CTRPredictionRequest, user_id: str = "default"):
    """
    Predict Click-Through Rate for Facebook ad campaign
    """
    try:
        logger.info(f"CTR prediction request for user {user_id}, campaign {request.campaign_id}")
        
        # Initialize predictor
        predictor = CTRPredictor(user_id)
        
        # Prepare campaign data
        campaign_data = {
            "campaign_id": request.campaign_id,
            "age_group": request.age_group,
            "gender": request.gender,
            "device_type": request.device_type,
            "placement": request.placement,
            "bid_amount": request.bid_amount,
            "budget_remaining": request.budget_remaining,
            "audience_size": request.audience_size,
            "timestamp": datetime.now()
        }
        
        # Get prediction
        result = predictor.predict(campaign_data)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        # Generate recommendation
        ctr = result["predicted_ctr"]
        if ctr >= 0.02:
            recommendation = "Високий потенціал CTR - рекомендуємо збільшити бюджет"
        elif ctr >= 0.01:
            recommendation = "Середній CTR - можна оптимізувати таргетинг"
        else:
            recommendation = "Низький CTR - рекомендуємо змінити креатив або аудиторію"
        
        return CTRPredictionResponse(
            predicted_ctr=result["predicted_ctr"],
            confidence_interval=result["confidence_interval"],
            model_version=result.get("model_version", "unknown"),
            prediction_date=result["prediction_date"],
            recommendation=recommendation
        )
        
    except Exception as e:
        logger.error(f"CTR prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# Budget Optimization Endpoint
@router.post("/budget/optimize", response_model=BudgetOptimizationResponse)
async def optimize_budget(request: BudgetOptimizationRequest, background_tasks: BackgroundTasks):
    """
    Optimize budget allocation across campaigns
    """
    try:
        logger.info(f"Budget optimization for user {request.user_id}, {len(request.campaigns)} campaigns")
        
        # Initialize optimizer
        optimizer = BudgetOptimizer(request.user_id)
        
        # Check if models are trained
        if not optimizer.is_trained:
            try:
                optimizer.load_models()
            except Exception:
                raise HTTPException(
                    status_code=400, 
                    detail="Models not trained for this user. Please train models first."
                )
        
        # Run optimization
        result = optimizer.optimize_budget_allocation(
            campaigns=request.campaigns,
            total_budget=request.total_budget,
            optimization_goal=request.optimization_goal
        )
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return BudgetOptimizationResponse(
            recommendations=result["recommendations"],
            expected_improvement=result["expected_improvement"],
            confidence_score=result.get("confidence_score", 0.7),
            optimization_success=result["optimization_success"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Budget optimization failed: {e}")
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

# Model Training Endpoint
@router.post("/models/train")
async def train_models(user_id: str, background_tasks: BackgroundTasks):
    """
    Trigger model training for user (async)
    """
    try:
        # Add training task to background
        background_tasks.add_task(train_user_models, user_id)
        
        return {
            "message": "Model training started",
            "user_id": user_id,
            "status": "in_progress",
            "started_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Training trigger failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Background task for training
async def train_user_models(user_id: str):
    """Background task to train ML models"""
    try:
        from ..ml.training.trainer import MLTrainingPipeline
        
        # This would fetch user's data from ClickHouse
        # For now, using mock data
        import pandas as pd
        import numpy as np
        
        # Generate mock training data
        n_samples = 1000
        training_data = pd.DataFrame({
            'campaign_id': [f'camp_{i%10}' for i in range(n_samples)],
            'timestamp': pd.date_range('2024-01-01', periods=n_samples, freq='H'),
            'impressions': np.random.randint(100, 10000, n_samples),
            'clicks': np.random.randint(1, 500, n_samples),
            'spend': np.random.uniform(10, 1000, n_samples),
            'conversions': np.random.randint(0, 50, n_samples)
        })
        
        # Initialize training pipeline
        trainer = MLTrainingPipeline(user_id)
        
        # Run training
        result = await trainer.run_full_training_pipeline(training_data)
        
        logger.info(f"Training completed for user {user_id}: {result}")
        
    except Exception as e:
        logger.error(f"Background training failed for user {user_id}: {e}")

# Model Status Endpoint
@router.get("/models/status")
async def get_model_status(user_id: str = "default"):
    """Get status of ML models for user"""
    try:
        from ..ml.training.trainer import MLTrainingPipeline
        
        trainer = MLTrainingPipeline(user_id)
        status = trainer.get_model_status()
        
        return status
        
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))