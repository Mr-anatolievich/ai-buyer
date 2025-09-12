"""
ML Training Tasks for AI-Buyer Celery
Handles model training, validation, and deployment
"""

import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from celery import Task
import mlflow
import numpy as np
import pandas as pd

from backend.tasks import celery_app, TaskConfig
from backend.ml.models.ctr_predictor import CTRPredictor
from backend.ml.models.budget_optimizer import BudgetOptimizer
from backend.ml.training.trainer import ModelTrainer

logger = logging.getLogger(__name__)

class MLTrainingTask(Task, TaskConfig):
    """Base class for ML training tasks"""
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Handle task failure"""
        logger.error(f"ML Training task {task_id} failed: {exc}")
        # Could send alerts, update model status, etc.

@celery_app.task(base=MLTrainingTask, bind=True)
def train_ctr_model(self, user_id: str, training_config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Train CTR prediction model for a specific user
    
    Args:
        user_id: User identifier
        training_config: Training configuration parameters
        
    Returns:
        Training results and metrics
    """
    try:
        self.update_state(state='PROGRESS', meta={'status': 'Initializing CTR model training'})
        
        logger.info(f"Starting CTR model training for user {user_id}")
        start_time = time.time()
        
        # Initialize trainer
        trainer = ModelTrainer()
        predictor = CTRPredictor()
        
        # Update state
        self.update_state(state='PROGRESS', meta={'status': 'Loading training data'})
        
        # Load training data (this would query ClickHouse)
        training_data = trainer.load_training_data(
            user_id=user_id,
            model_type='ctr_prediction',
            lookback_days=training_config.get('lookback_days', 30)
        )
        
        if training_data.empty:
            raise ValueError(f"No training data found for user {user_id}")
        
        logger.info(f"Loaded {len(training_data)} training samples")
        
        # Update state
        self.update_state(state='PROGRESS', meta={
            'status': 'Preparing features',
            'training_samples': len(training_data)
        })
        
        # Prepare features
        X, y = predictor.prepare_features(training_data)
        
        # Update state
        self.update_state(state='PROGRESS', meta={
            'status': 'Training model',
            'features_count': X.shape[1] if hasattr(X, 'shape') else len(X)
        })
        
        # Train model with MLflow tracking
        with mlflow.start_run(run_name=f"ctr_training_{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"):
            # Log parameters
            mlflow.log_params(training_config)
            mlflow.log_param("user_id", user_id)
            mlflow.log_param("training_samples", len(training_data))
            
            # Train model
            model, metrics = predictor.train(X, y)
            
            # Log metrics
            for metric_name, metric_value in metrics.items():
                mlflow.log_metric(metric_name, metric_value)
            
            # Update state
            self.update_state(state='PROGRESS', meta={
                'status': 'Validating model',
                'training_metrics': metrics
            })
            
            # Validate model
            validation_metrics = trainer.validate_model(model, X, y)
            
            # Log validation metrics
            for metric_name, metric_value in validation_metrics.items():
                mlflow.log_metric(f"val_{metric_name}", metric_value)
            
            # Save model
            model_version = predictor.save_model(model, user_id)
            mlflow.log_param("model_version", model_version)
            
            # Register model in MLflow
            model_name = f"ctr_predictor_{user_id}"
            mlflow.register_model(
                model_uri=f"runs:/{mlflow.active_run().info.run_id}/model",
                name=model_name
            )
        
        training_time = time.time() - start_time
        
        # Prepare results
        results = {
            'status': 'completed',
            'user_id': user_id,
            'model_version': model_version,
            'training_time_seconds': training_time,
            'training_samples': len(training_data),
            'features_count': X.shape[1] if hasattr(X, 'shape') else len(X),
            'training_metrics': metrics,
            'validation_metrics': validation_metrics,
            'mlflow_run_id': mlflow.active_run().info.run_id if mlflow.active_run() else None,
            'created_at': datetime.now().isoformat()
        }
        
        logger.info(f"CTR model training completed for user {user_id} in {training_time:.2f} seconds")
        return results
        
    except Exception as e:
        logger.error(f"CTR model training failed for user {user_id}: {e}")
        return {
            'status': 'failed',
            'user_id': user_id,
            'error': str(e),
            'created_at': datetime.now().isoformat()
        }

@celery_app.task(base=MLTrainingTask, bind=True)
def train_budget_optimizer(self, user_id: str, training_config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Train budget optimization model for a specific user
    
    Args:
        user_id: User identifier
        training_config: Training configuration parameters
        
    Returns:
        Training results and metrics
    """
    try:
        self.update_state(state='PROGRESS', meta={'status': 'Initializing budget optimizer training'})
        
        logger.info(f"Starting budget optimizer training for user {user_id}")
        start_time = time.time()
        
        # Initialize trainer and optimizer
        trainer = ModelTrainer()
        optimizer = BudgetOptimizer()
        
        # Update state
        self.update_state(state='PROGRESS', meta={'status': 'Loading historical data'})
        
        # Load historical campaign data
        historical_data = trainer.load_training_data(
            user_id=user_id,
            model_type='budget_optimization',
            lookback_days=training_config.get('lookback_days', 90)
        )
        
        if historical_data.empty:
            raise ValueError(f"No historical data found for user {user_id}")
        
        logger.info(f"Loaded {len(historical_data)} historical records")
        
        # Update state
        self.update_state(state='PROGRESS', meta={
            'status': 'Preparing time series data',
            'historical_records': len(historical_data)
        })
        
        # Prepare time series data
        time_series_data = optimizer.prepare_time_series_data(historical_data)
        
        # Update state
        self.update_state(state='PROGRESS', meta={
            'status': 'Training Prophet models',
            'campaigns_count': len(time_series_data)
        })
        
        # Train models with MLflow tracking
        with mlflow.start_run(run_name=f"budget_optimizer_{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"):
            # Log parameters
            mlflow.log_params(training_config)
            mlflow.log_param("user_id", user_id)
            mlflow.log_param("historical_records", len(historical_data))
            mlflow.log_param("campaigns_count", len(time_series_data))
            
            # Train models for each campaign
            trained_models = {}
            training_metrics = {}
            
            for campaign_id, campaign_data in time_series_data.items():
                logger.info(f"Training model for campaign {campaign_id}")
                
                # Train Prophet model
                model, metrics = optimizer.train_campaign_model(campaign_data)
                trained_models[campaign_id] = model
                training_metrics[campaign_id] = metrics
                
                # Log campaign-specific metrics
                for metric_name, metric_value in metrics.items():
                    mlflow.log_metric(f"{campaign_id}_{metric_name}", metric_value)
            
            # Calculate overall metrics
            overall_metrics = {
                'avg_mape': np.mean([m.get('mape', 0) for m in training_metrics.values()]),
                'avg_rmse': np.mean([m.get('rmse', 0) for m in training_metrics.values()]),
                'models_trained': len(trained_models)
            }
            
            # Log overall metrics
            for metric_name, metric_value in overall_metrics.items():
                mlflow.log_metric(metric_name, metric_value)
            
            # Update state
            self.update_state(state='PROGRESS', meta={
                'status': 'Saving models',
                'models_trained': len(trained_models)
            })
            
            # Save models
            model_version = optimizer.save_models(trained_models, user_id)
            mlflow.log_param("model_version", model_version)
            
            # Register model in MLflow
            model_name = f"budget_optimizer_{user_id}"
            mlflow.register_model(
                model_uri=f"runs:/{mlflow.active_run().info.run_id}/model",
                name=model_name
            )
        
        training_time = time.time() - start_time
        
        # Prepare results
        results = {
            'status': 'completed',
            'user_id': user_id,
            'model_version': model_version,
            'training_time_seconds': training_time,
            'historical_records': len(historical_data),
            'models_trained': len(trained_models),
            'training_metrics': overall_metrics,
            'campaign_metrics': training_metrics,
            'mlflow_run_id': mlflow.active_run().info.run_id if mlflow.active_run() else None,
            'created_at': datetime.now().isoformat()
        }
        
        logger.info(f"Budget optimizer training completed for user {user_id} in {training_time:.2f} seconds")
        return results
        
    except Exception as e:
        logger.error(f"Budget optimizer training failed for user {user_id}: {e}")
        return {
            'status': 'failed',
            'user_id': user_id,
            'error': str(e),
            'created_at': datetime.now().isoformat()
        }

@celery_app.task(base=MLTrainingTask, bind=True)
def retrain_ctr_model(self) -> Dict[str, Any]:
    """
    Periodic task to retrain CTR models for all users
    
    Returns:
        Retraining summary
    """
    try:
        logger.info("Starting periodic CTR model retraining")
        start_time = time.time()
        
        # Get list of active users (this would query the database)
        active_users = ['user1', 'user2', 'user3']  # Placeholder
        
        results = {}
        for user_id in active_users:
            try:
                # Check if model needs retraining
                if _should_retrain_model(user_id, 'ctr_prediction'):
                    # Trigger training task
                    training_config = {
                        'lookback_days': 30,
                        'validation_split': 0.2,
                        'early_stopping': True
                    }
                    
                    # Run training
                    result = train_ctr_model.apply_async(
                        args=[user_id, training_config],
                        queue='ml_training'
                    )
                    
                    results[user_id] = {'task_id': result.id, 'status': 'scheduled'}
                else:
                    results[user_id] = {'status': 'skipped', 'reason': 'recent_training'}
                    
            except Exception as e:
                logger.error(f"Failed to schedule retraining for user {user_id}: {e}")
                results[user_id] = {'status': 'failed', 'error': str(e)}
        
        total_time = time.time() - start_time
        
        summary = {
            'status': 'completed',
            'total_users': len(active_users),
            'scheduled_trainings': len([r for r in results.values() if r.get('status') == 'scheduled']),
            'skipped_trainings': len([r for r in results.values() if r.get('status') == 'skipped']),
            'failed_schedulings': len([r for r in results.values() if r.get('status') == 'failed']),
            'results': results,
            'total_time_seconds': total_time,
            'created_at': datetime.now().isoformat()
        }
        
        logger.info(f"Periodic CTR retraining completed in {total_time:.2f} seconds")
        return summary
        
    except Exception as e:
        logger.error(f"Periodic CTR retraining failed: {e}")
        return {
            'status': 'failed',
            'error': str(e),
            'created_at': datetime.now().isoformat()
        }

@celery_app.task(base=MLTrainingTask, bind=True)
def retrain_budget_optimizer(self) -> Dict[str, Any]:
    """
    Periodic task to retrain budget optimization models for all users
    
    Returns:
        Retraining summary
    """
    try:
        logger.info("Starting periodic budget optimizer retraining")
        start_time = time.time()
        
        # Get list of active users
        active_users = ['user1', 'user2', 'user3']  # Placeholder
        
        results = {}
        for user_id in active_users:
            try:
                # Check if model needs retraining
                if _should_retrain_model(user_id, 'budget_optimization'):
                    # Trigger training task
                    training_config = {
                        'lookback_days': 90,
                        'forecast_horizon': 30,
                        'seasonality_mode': 'multiplicative'
                    }
                    
                    # Run training
                    result = train_budget_optimizer.apply_async(
                        args=[user_id, training_config],
                        queue='ml_training'
                    )
                    
                    results[user_id] = {'task_id': result.id, 'status': 'scheduled'}
                else:
                    results[user_id] = {'status': 'skipped', 'reason': 'recent_training'}
                    
            except Exception as e:
                logger.error(f"Failed to schedule budget optimizer retraining for user {user_id}: {e}")
                results[user_id] = {'status': 'failed', 'error': str(e)}
        
        total_time = time.time() - start_time
        
        summary = {
            'status': 'completed',
            'total_users': len(active_users),
            'scheduled_trainings': len([r for r in results.values() if r.get('status') == 'scheduled']),
            'skipped_trainings': len([r for r in results.values() if r.get('status') == 'skipped']),
            'failed_schedulings': len([r for r in results.values() if r.get('status') == 'failed']),
            'results': results,
            'total_time_seconds': total_time,
            'created_at': datetime.now().isoformat()
        }
        
        logger.info(f"Periodic budget optimizer retraining completed in {total_time:.2f} seconds")
        return summary
        
    except Exception as e:
        logger.error(f"Periodic budget optimizer retraining failed: {e}")
        return {
            'status': 'failed',
            'error': str(e),
            'created_at': datetime.now().isoformat()
        }

@celery_app.task(base=MLTrainingTask, bind=True)
def validate_model_performance(self, user_id: str, model_type: str) -> Dict[str, Any]:
    """
    Validate model performance against recent data
    
    Args:
        user_id: User identifier
        model_type: Type of model to validate
        
    Returns:
        Validation results
    """
    try:
        logger.info(f"Starting model validation for user {user_id}, model {model_type}")
        start_time = time.time()
        
        # Initialize trainer
        trainer = ModelTrainer()
        
        # Load recent data for validation
        validation_data = trainer.load_training_data(
            user_id=user_id,
            model_type=model_type,
            lookback_days=7  # Last week's data
        )
        
        if validation_data.empty:
            return {
                'status': 'no_data',
                'user_id': user_id,
                'model_type': model_type,
                'message': 'No recent data available for validation'
            }
        
        # Load current model
        if model_type == 'ctr_prediction':
            predictor = CTRPredictor()
            model = predictor.load_model(user_id)
            
            # Prepare features
            X, y = predictor.prepare_features(validation_data)
            
            # Make predictions
            predictions = predictor.predict(X, model)
            
        elif model_type == 'budget_optimization':
            optimizer = BudgetOptimizer()
            models = optimizer.load_models(user_id)
            
            # This would implement validation for budget optimizer
            predictions = None  # Placeholder
            
        else:
            raise ValueError(f"Unknown model type: {model_type}")
        
        # Calculate validation metrics
        validation_metrics = trainer.calculate_validation_metrics(y, predictions)
        
        validation_time = time.time() - start_time
        
        # Prepare results
        results = {
            'status': 'completed',
            'user_id': user_id,
            'model_type': model_type,
            'validation_samples': len(validation_data),
            'validation_metrics': validation_metrics,
            'validation_time_seconds': validation_time,
            'created_at': datetime.now().isoformat()
        }
        
        logger.info(f"Model validation completed for user {user_id} in {validation_time:.2f} seconds")
        return results
        
    except Exception as e:
        logger.error(f"Model validation failed for user {user_id}: {e}")
        return {
            'status': 'failed',
            'user_id': user_id,
            'model_type': model_type,
            'error': str(e),
            'created_at': datetime.now().isoformat()
        }

def _should_retrain_model(user_id: str, model_type: str) -> bool:
    """
    Check if a model should be retrained based on various criteria
    
    Args:
        user_id: User identifier
        model_type: Type of model
        
    Returns:
        Whether the model should be retrained
    """
    try:
        # This would implement logic to check:
        # - Last training date
        # - Model performance degradation
        # - Amount of new data available
        # - User preferences
        
        # Placeholder logic
        return True
        
    except Exception as e:
        logger.error(f"Error checking retrain status for user {user_id}: {e}")
        return False