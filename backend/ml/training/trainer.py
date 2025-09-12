"""
ML Training Pipeline for AI-Buyer
Orchestrates training of CTR prediction and budget optimization models
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime, timedelta
import mlflow
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Import our ML models and feature engineering
from ..models.ctr_predictor import CTRPredictor
from ..models.budget_optimizer import BudgetOptimizer
from ..feature_engineering.facebook_features import FacebookAdFeatureEngineer

logger = logging.getLogger(__name__)

class MLTrainingPipeline:
    """
    Orchestrates the training of ML models for AI-Buyer platform
    Handles data preparation, feature engineering, model training, and deployment
    """
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.feature_engineer = FacebookAdFeatureEngineer()
        self.ctr_predictor = CTRPredictor(user_id)
        self.budget_optimizer = BudgetOptimizer(user_id)
        
        # Training configuration
        self.min_training_samples = 100
        self.max_training_samples = 100000
        self.validation_split = 0.2
        self.test_split = 0.1
        
        # MLflow configuration
        self.experiment_name = f"ml_pipeline_{user_id}"
        self._setup_mlflow()
    
    def _setup_mlflow(self):
        """Setup MLflow experiment for pipeline tracking"""
        try:
            mlflow.set_experiment(self.experiment_name)
            logger.info(f"MLflow experiment set: {self.experiment_name}")
        except Exception as e:
            logger.error(f"Failed to setup MLflow experiment: {e}")
    
    async def prepare_training_data(self, 
                                  raw_data: pd.DataFrame,
                                  include_feature_engineering: bool = True) -> Dict[str, pd.DataFrame]:
        """
        Prepare data for training ML models
        
        Args:
            raw_data: Raw campaign data from ClickHouse
            include_feature_engineering: Whether to apply feature engineering
            
        Returns:
            Dictionary with prepared datasets for different models
        """
        logger.info(f"Preparing training data for user {self.user_id}")
        
        try:
            # Basic data validation
            required_columns = ['campaign_id', 'timestamp', 'impressions', 'clicks', 'spend']
            missing_columns = [col for col in required_columns if col not in raw_data.columns]
            
            if missing_columns:
                raise ValueError(f"Missing required columns: {missing_columns}")
            
            # Filter out invalid data
            raw_data = raw_data[
                (raw_data['impressions'] >= 0) &
                (raw_data['clicks'] >= 0) &
                (raw_data['spend'] >= 0) &
                (raw_data['impressions'] >= raw_data['clicks'])  # Clicks can't exceed impressions
            ].copy()
            
            # Calculate basic metrics if not present
            if 'ctr' not in raw_data.columns:
                raw_data['ctr'] = np.where(
                    raw_data['impressions'] > 0,
                    raw_data['clicks'] / raw_data['impressions'],
                    0
                )
            
            if 'conversions' not in raw_data.columns:
                # Estimate conversions if not available (simplified assumption)
                raw_data['conversions'] = np.random.poisson(raw_data['clicks'] * 0.05)
            
            # Apply feature engineering if requested
            if include_feature_engineering:
                logger.info("Applying feature engineering")
                engineered_data = self.feature_engineer.create_feature_pipeline(raw_data)
            else:
                engineered_data = raw_data.copy()
            
            # Prepare different datasets for different models
            datasets = {}
            
            # CTR prediction dataset
            ctr_data = engineered_data[engineered_data['impressions'] > 0].copy()
            if len(ctr_data) >= self.min_training_samples:
                datasets['ctr_prediction'] = self._prepare_ctr_dataset(ctr_data)
                logger.info(f"CTR prediction dataset prepared: {len(ctr_data)} samples")
            else:
                logger.warning(f"Insufficient data for CTR prediction: {len(ctr_data)} samples")
            
            # Budget optimization dataset (time series)
            budget_data = self._prepare_budget_dataset(engineered_data)
            if len(budget_data) >= self.min_training_samples:
                datasets['budget_optimization'] = budget_data
                logger.info(f"Budget optimization dataset prepared: {len(budget_data)} samples")
            else:
                logger.warning(f"Insufficient data for budget optimization: {len(budget_data)} samples")
            
            # Performance forecasting dataset
            forecast_data = self._prepare_forecast_dataset(engineered_data)
            if len(forecast_data) >= self.min_training_samples:
                datasets['performance_forecasting'] = forecast_data
                logger.info(f"Performance forecasting dataset prepared: {len(forecast_data)} samples")
            
            return datasets
            
        except Exception as e:
            logger.error(f"Error preparing training data: {e}")
            raise
    
    def _prepare_ctr_dataset(self, data: pd.DataFrame) -> pd.DataFrame:
        """Prepare dataset specifically for CTR prediction"""
        # Select relevant features for CTR prediction
        feature_columns = [
            'campaign_id', 'ad_set_id', 'placement', 'device_type',
            'age_group', 'gender', 'hour', 'day_of_week', 'is_weekend',
            'bid_amount', 'frequency', 'budget_utilization',
            'creative_age_days', 'is_video', 'text_length'
        ]
        
        # Include only columns that exist in the data
        available_features = [col for col in feature_columns if col in data.columns]
        target_columns = ['ctr', 'timestamp', 'impressions']
        
        selected_columns = available_features + target_columns
        ctr_dataset = data[selected_columns].copy()
        
        # Filter for records with sufficient impressions for reliable CTR
        ctr_dataset = ctr_dataset[ctr_dataset['impressions'] >= 100]
        
        # Remove outliers (CTR > 50% is likely an error)
        ctr_dataset = ctr_dataset[ctr_dataset['ctr'] <= 0.5]
        
        return ctr_dataset
    
    def _prepare_budget_dataset(self, data: pd.DataFrame) -> pd.DataFrame:
        """Prepare dataset for budget optimization (time series)"""
        # Aggregate by campaign and day for time series
        daily_data = data.groupby(['campaign_id', data['timestamp'].dt.date]).agg({
            'spend': 'sum',
            'conversions': 'sum',
            'clicks': 'sum',
            'impressions': 'sum',
            'ctr': 'mean',
            'cpc': 'mean'
        }).reset_index()
        
        daily_data['timestamp'] = pd.to_datetime(daily_data['timestamp'])
        
        # Calculate ROI and other optimization metrics
        daily_data['roi'] = np.where(
            daily_data['spend'] > 0,
            daily_data['conversions'] / daily_data['spend'],
            0
        )
        
        # Filter campaigns with at least 14 days of data
        campaign_counts = daily_data['campaign_id'].value_counts()
        valid_campaigns = campaign_counts[campaign_counts >= 14].index
        
        budget_dataset = daily_data[daily_data['campaign_id'].isin(valid_campaigns)]
        
        return budget_dataset
    
    def _prepare_forecast_dataset(self, data: pd.DataFrame) -> pd.DataFrame:
        """Prepare dataset for performance forecasting"""
        # Hourly aggregation for more granular forecasting
        hourly_data = data.groupby(['campaign_id', data['timestamp'].dt.floor('H')]).agg({
            'spend': 'sum',
            'conversions': 'sum',
            'clicks': 'sum',
            'impressions': 'sum'
        }).reset_index()
        
        hourly_data['timestamp'] = pd.to_datetime(hourly_data['timestamp'])
        
        # Add temporal features for forecasting
        hourly_data['hour'] = hourly_data['timestamp'].dt.hour
        hourly_data['day_of_week'] = hourly_data['timestamp'].dt.dayofweek
        hourly_data['is_weekend'] = (hourly_data['day_of_week'] >= 5).astype(int)
        
        return hourly_data
    
    async def train_ctr_model(self, training_data: pd.DataFrame) -> Dict[str, Any]:
        """Train CTR prediction model"""
        logger.info("Training CTR prediction model")
        
        try:
            # Run training in thread pool to avoid blocking
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(
                    self.ctr_predictor.train,
                    training_data,
                    target_column='ctr',
                    validation_split=self.validation_split,
                    epochs=50,
                    batch_size=512
                )
                training_result = future.result()
            
            return {
                "model_type": "ctr_prediction",
                "status": "success" if training_result.get("success") else "failed",
                "user_id": self.user_id,
                "training_samples": training_result.get("training_samples", 0),
                "validation_mse": training_result.get("val_mse", None),
                "training_time": training_result.get("epochs_trained", 0),
                "model_version": training_result.get("model_version", None)
            }
            
        except Exception as e:
            logger.error(f"CTR model training failed: {e}")
            return {
                "model_type": "ctr_prediction",
                "status": "failed",
                "error": str(e),
                "user_id": self.user_id
            }
    
    async def train_budget_model(self, training_data: pd.DataFrame) -> Dict[str, Any]:
        """Train budget optimization model"""
        logger.info("Training budget optimization model")
        
        try:
            # Prepare time series data for Prophet
            campaign_data = self.budget_optimizer.prepare_time_series_data(training_data)
            
            # Run training in thread pool
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(
                    self.budget_optimizer.train_prophet_models,
                    campaign_data
                )
                training_result = future.result()
            
            return {
                "model_type": "budget_optimization",
                "status": "success",
                "user_id": self.user_id,
                "campaigns_trained": training_result.get("campaigns_trained", 0),
                "failed_campaigns": len(training_result.get("failed_campaigns", [])),
                "model_performance": training_result.get("model_performance", {})
            }
            
        except Exception as e:
            logger.error(f"Budget optimization model training failed: {e}")
            return {
                "model_type": "budget_optimization", 
                "status": "failed",
                "error": str(e),
                "user_id": self.user_id
            }
    
    async def run_full_training_pipeline(self, 
                                       raw_data: pd.DataFrame,
                                       models_to_train: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Run the complete training pipeline
        
        Args:
            raw_data: Raw campaign data
            models_to_train: List of models to train (None = train all)
            
        Returns:
            Training results for all models
        """
        logger.info(f"Running full training pipeline for user {self.user_id}")
        
        with mlflow.start_run():
            try:
                # Log pipeline parameters
                mlflow.log_params({
                    "user_id": self.user_id,
                    "raw_data_samples": len(raw_data),
                    "min_training_samples": self.min_training_samples,
                    "validation_split": self.validation_split,
                    "models_requested": models_to_train or ["all"]
                })
                
                # Prepare training data
                datasets = await self.prepare_training_data(raw_data)
                
                if not datasets:
                    return {
                        "status": "failed",
                        "error": "No suitable datasets prepared for training",
                        "user_id": self.user_id
                    }
                
                mlflow.log_param("datasets_prepared", list(datasets.keys()))
                
                # Train models
                results = {}
                
                # Train CTR model
                if (models_to_train is None or "ctr_prediction" in models_to_train) and "ctr_prediction" in datasets:
                    ctr_result = await self.train_ctr_model(datasets["ctr_prediction"])
                    results["ctr_prediction"] = ctr_result
                    
                    # Log CTR model metrics
                    if ctr_result["status"] == "success":
                        mlflow.log_metrics({
                            "ctr_training_samples": ctr_result["training_samples"],
                            "ctr_validation_mse": ctr_result.get("validation_mse", 0)
                        })
                
                # Train budget optimization model
                if (models_to_train is None or "budget_optimization" in models_to_train) and "budget_optimization" in datasets:
                    budget_result = await self.train_budget_model(datasets["budget_optimization"])
                    results["budget_optimization"] = budget_result
                    
                    # Log budget model metrics
                    if budget_result["status"] == "success":
                        mlflow.log_metrics({
                            "budget_campaigns_trained": budget_result["campaigns_trained"],
                            "budget_failed_campaigns": budget_result["failed_campaigns"]
                        })
                
                # Calculate overall pipeline success
                successful_models = [k for k, v in results.items() if v["status"] == "success"]
                pipeline_success = len(successful_models) > 0
                
                pipeline_result = {
                    "status": "success" if pipeline_success else "failed",
                    "user_id": self.user_id,
                    "models_trained": successful_models,
                    "datasets_available": list(datasets.keys()),
                    "training_results": results,
                    "pipeline_run_id": mlflow.active_run().info.run_id,
                    "completed_at": datetime.now().isoformat()
                }
                
                # Log overall pipeline metrics
                mlflow.log_metrics({
                    "pipeline_success": 1 if pipeline_success else 0,
                    "models_trained_count": len(successful_models),
                    "total_datasets": len(datasets)
                })
                
                logger.info(f"Training pipeline completed. Success: {pipeline_success}")
                return pipeline_result
                
            except Exception as e:
                logger.error(f"Training pipeline failed: {e}")
                mlflow.log_param("pipeline_error", str(e))
                
                return {
                    "status": "failed",
                    "error": str(e),
                    "user_id": self.user_id,
                    "completed_at": datetime.now().isoformat()
                }
    
    async def evaluate_models(self, test_data: pd.DataFrame) -> Dict[str, Any]:
        """Evaluate trained models on test data"""
        logger.info("Evaluating trained models")
        
        evaluation_results = {}
        
        try:
            # Prepare test datasets
            test_datasets = await self.prepare_training_data(test_data, include_feature_engineering=True)
            
            # Evaluate CTR model
            if "ctr_prediction" in test_datasets and self.ctr_predictor.is_trained:
                ctr_metrics = self.ctr_predictor.evaluate(
                    test_datasets["ctr_prediction"], 
                    target_column='ctr'
                )
                evaluation_results["ctr_prediction"] = ctr_metrics
            
            # Note: Budget optimization evaluation would require more complex setup
            # with actual performance data over time
            
            return {
                "user_id": self.user_id,
                "evaluation_results": evaluation_results,
                "evaluated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Model evaluation failed: {e}")
            return {
                "error": str(e),
                "user_id": self.user_id
            }
    
    def get_model_status(self) -> Dict[str, Any]:
        """Get current status of all models"""
        return {
            "user_id": self.user_id,
            "ctr_predictor_trained": self.ctr_predictor.is_trained,
            "budget_optimizer_trained": self.budget_optimizer.is_trained,
            "ctr_model_version": getattr(self.ctr_predictor, 'model_version', None),
            "budget_models_count": len(self.budget_optimizer.prophet_models),
            "feature_engineer_ready": self.feature_engineer is not None,
            "last_check": datetime.now().isoformat()
        }
    
    async def retrain_models(self, 
                           raw_data: pd.DataFrame,
                           force_retrain: bool = False) -> Dict[str, Any]:
        """
        Retrain models with new data
        
        Args:
            raw_data: New training data
            force_retrain: Whether to force retraining even if models exist
            
        Returns:
            Retraining results
        """
        logger.info(f"Retraining models for user {self.user_id}")
        
        # Check if retraining is needed
        if not force_retrain:
            # Simple heuristic: retrain if we have significantly more data
            # In production, use more sophisticated drift detection
            pass
        
        # Run full training pipeline
        return await self.run_full_training_pipeline(raw_data)