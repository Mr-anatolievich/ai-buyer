"""
Celery Application Configuration for AI-Buyer
Handles async tasks for ML training, optimization, and data processing
"""

from celery import Celery
from celery.schedules import crontab
import os
import logging

logger = logging.getLogger(__name__)

# Configure Celery app
def create_celery_app() -> Celery:
    """Create and configure Celery application"""
    
    # Get configuration from environment
    broker_url = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/1')
    result_backend = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/2')
    
    # Create Celery app
    celery_app = Celery(
        'ai-buyer-tasks',
        broker=broker_url,
        backend=result_backend,
        include=[
            'backend.tasks.ml_training',
            'backend.tasks.optimization',
            'backend.tasks.data_processing',
            'backend.tasks.monitoring',
        ]
    )
    
    # Configure Celery
    celery_app.conf.update(
        # Task execution settings
        task_serializer='json',
        accept_content=['json'],
        result_serializer='json',
        timezone='UTC',
        enable_utc=True,
        
        # Task routing
        task_routes={
            'ml_training.*': {'queue': 'ml_training'},
            'optimization.*': {'queue': 'optimization'},
            'data_processing.*': {'queue': 'data_processing'},
            'monitoring.*': {'queue': 'monitoring'},
        },
        
        # Worker settings
        worker_prefetch_multiplier=1,
        task_acks_late=True,
        task_reject_on_worker_lost=True,
        
        # Task time limits
        task_soft_time_limit=300,  # 5 minutes
        task_time_limit=600,       # 10 minutes
        
        # Result settings
        result_expires=3600,  # 1 hour
        result_persistent=True,
        
        # Task compression
        task_compression='gzip',
        result_compression='gzip',
        
        # Monitoring
        worker_send_task_events=True,
        task_send_sent_event=True,
        
        # Beat schedule for periodic tasks
        beat_schedule={
            # Model retraining
            'retrain-ctr-model': {
                'task': 'ml_training.retrain_ctr_model',
                'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
                'options': {'queue': 'ml_training'}
            },
            
            'retrain-budget-optimizer': {
                'task': 'ml_training.retrain_budget_optimizer',
                'schedule': crontab(hour=3, minute=0, day_of_week=0),  # Weekly on Sunday
                'options': {'queue': 'ml_training'}
            },
            
            # Data processing
            'process-daily-metrics': {
                'task': 'data_processing.process_daily_metrics',
                'schedule': crontab(hour=1, minute=0),  # Daily at 1 AM
                'options': {'queue': 'data_processing'}
            },
            
            'aggregate-hourly-data': {
                'task': 'data_processing.aggregate_hourly_data',
                'schedule': crontab(minute=5),  # Every hour at :05
                'options': {'queue': 'data_processing'}
            },
            
            # Anomaly detection
            'detect-anomalies': {
                'task': 'monitoring.detect_anomalies',
                'schedule': crontab(minute='*/15'),  # Every 15 minutes
                'options': {'queue': 'monitoring'}
            },
            
            # Optimization
            'run-budget-optimization': {
                'task': 'optimization.optimize_all_user_budgets',
                'schedule': crontab(hour='*/6', minute=30),  # Every 6 hours
                'options': {'queue': 'optimization'}
            },
            
            # Monitoring and cleanup
            'cleanup-old-predictions': {
                'task': 'monitoring.cleanup_old_data',
                'schedule': crontab(hour=4, minute=0),  # Daily at 4 AM
                'options': {'queue': 'monitoring'}
            },
            
            'health-check': {
                'task': 'monitoring.health_check',
                'schedule': crontab(minute='*/5'),  # Every 5 minutes
                'options': {'queue': 'monitoring'}
            },
        },
        
        # Queue configuration
        task_default_queue='default',
        task_create_missing_queues=True,
        
        # Worker configuration
        worker_max_tasks_per_child=1000,
        worker_disable_rate_limits=False,
        worker_pool_restarts=True,
    )
    
    logger.info("Celery app configured successfully")
    return celery_app

# Create the Celery app instance
celery_app = create_celery_app()

# Task base configuration
class TaskConfig:
    """Base configuration for Celery tasks"""
    
    # Default task settings
    bind = True
    autoretry_for = (Exception,)
    retry_kwargs = {'max_retries': 3, 'countdown': 60}
    retry_backoff = True
    retry_backoff_max = 700
    retry_jitter = False
    
    # Task tracking
    track_started = True
    acks_late = True
    reject_on_worker_lost = True

# Export for use in other modules
__all__ = ['celery_app', 'TaskConfig']