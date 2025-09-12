"""
Data Processing Tasks for AI-Buyer Celery
Handles data aggregation, cleaning, and preparation
"""

import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from celery import Task

from backend.tasks import celery_app, TaskConfig

logger = logging.getLogger(__name__)

class DataProcessingTask(Task, TaskConfig):
    """Base class for data processing tasks"""
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Handle task failure"""
        logger.error(f"Data processing task {task_id} failed: {exc}")

@celery_app.task(base=DataProcessingTask, bind=True)
def process_daily_metrics(self) -> Dict[str, Any]:
    """
    Daily task to process and aggregate campaign metrics
    
    Returns:
        Processing summary
    """
    try:
        logger.info("Starting daily metrics processing")
        start_time = time.time()
        
        # Get yesterday's date
        yesterday = (datetime.now() - timedelta(days=1)).date()
        
        # Process metrics for each user
        users_processed = 0
        total_records = 0
        
        # This would query for all users with data
        active_users = _get_users_with_recent_data(yesterday)
        
        for user_id in active_users:
            try:
                # Process user's daily metrics
                records_processed = _process_user_daily_metrics(user_id, yesterday)
                total_records += records_processed
                users_processed += 1
                
                logger.info(f"Processed {records_processed} records for user {user_id}")
                
            except Exception as e:
                logger.error(f"Failed to process daily metrics for user {user_id}: {e}")
        
        processing_time = time.time() - start_time
        
        results = {
            'status': 'completed',
            'date_processed': yesterday.isoformat(),
            'users_processed': users_processed,
            'total_records': total_records,
            'processing_time_seconds': processing_time,
            'created_at': datetime.now().isoformat()
        }
        
        logger.info(f"Daily metrics processing completed in {processing_time:.2f} seconds")
        return results
        
    except Exception as e:
        logger.error(f"Daily metrics processing failed: {e}")
        return {
            'status': 'failed',
            'error': str(e),
            'created_at': datetime.now().isoformat()
        }

@celery_app.task(base=DataProcessingTask, bind=True)
def aggregate_hourly_data(self) -> Dict[str, Any]:
    """
    Hourly task to aggregate real-time data
    
    Returns:
        Aggregation summary
    """
    try:
        logger.info("Starting hourly data aggregation")
        start_time = time.time()
        
        # Get current hour
        current_hour = datetime.now().replace(minute=0, second=0, microsecond=0)
        previous_hour = current_hour - timedelta(hours=1)
        
        # Aggregate data for the previous hour
        aggregation_results = _aggregate_hour_data(previous_hour)
        
        processing_time = time.time() - start_time
        
        results = {
            'status': 'completed',
            'hour_processed': previous_hour.isoformat(),
            'aggregation_results': aggregation_results,
            'processing_time_seconds': processing_time,
            'created_at': datetime.now().isoformat()
        }
        
        logger.info(f"Hourly aggregation completed in {processing_time:.2f} seconds")
        return results
        
    except Exception as e:
        logger.error(f"Hourly aggregation failed: {e}")
        return {
            'status': 'failed',
            'error': str(e),
            'created_at': datetime.now().isoformat()
        }

def _get_users_with_recent_data(date: datetime.date) -> List[str]:
    """Get users who have data for the specified date"""
    # This would query ClickHouse
    return ['user1', 'user2', 'user3']

def _process_user_daily_metrics(user_id: str, date: datetime.date) -> int:
    """Process daily metrics for a specific user"""
    # This would aggregate and process the user's daily data
    return 100  # Number of records processed

def _aggregate_hour_data(hour: datetime) -> Dict[str, Any]:
    """Aggregate data for a specific hour"""
    # This would perform hourly aggregation
    return {
        'records_aggregated': 500,
        'unique_campaigns': 25,
        'total_spend': 1500.0
    }