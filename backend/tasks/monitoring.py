"""
Monitoring Tasks for AI-Buyer Celery
Handles system monitoring, health checks, and anomaly detection
"""

import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from celery import Task

from backend.tasks import celery_app, TaskConfig

logger = logging.getLogger(__name__)

class MonitoringTask(Task, TaskConfig):
    """Base class for monitoring tasks"""
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Handle task failure"""
        logger.error(f"Monitoring task {task_id} failed: {exc}")

@celery_app.task(base=MonitoringTask, bind=True)
def detect_anomalies(self) -> Dict[str, Any]:
    """
    Periodic task to detect anomalies in campaign performance
    
    Returns:
        Anomaly detection results
    """
    try:
        logger.info("Starting anomaly detection")
        start_time = time.time()
        
        # Get recent data for anomaly detection
        detection_window = datetime.now() - timedelta(hours=1)
        
        # Detect anomalies for all active users
        anomalies_detected = []
        users_checked = 0
        
        active_users = _get_active_users()
        
        for user_id in active_users:
            try:
                user_anomalies = _detect_user_anomalies(user_id, detection_window)
                anomalies_detected.extend(user_anomalies)
                users_checked += 1
                
            except Exception as e:
                logger.error(f"Failed to detect anomalies for user {user_id}: {e}")
        
        # Process and alert on critical anomalies
        critical_anomalies = [a for a in anomalies_detected if a.get('severity') == 'critical']
        
        if critical_anomalies:
            _send_anomaly_alerts(critical_anomalies)
        
        detection_time = time.time() - start_time
        
        results = {
            'status': 'completed',
            'users_checked': users_checked,
            'total_anomalies': len(anomalies_detected),
            'critical_anomalies': len(critical_anomalies),
            'anomalies': anomalies_detected,
            'detection_time_seconds': detection_time,
            'created_at': datetime.now().isoformat()
        }
        
        logger.info(f"Anomaly detection completed in {detection_time:.2f} seconds")
        return results
        
    except Exception as e:
        logger.error(f"Anomaly detection failed: {e}")
        return {
            'status': 'failed',
            'error': str(e),
            'created_at': datetime.now().isoformat()
        }

@celery_app.task(base=MonitoringTask, bind=True)
def health_check(self) -> Dict[str, Any]:
    """
    System health check task
    
    Returns:
        Health status
    """
    try:
        logger.info("Starting system health check")
        start_time = time.time()
        
        health_status = {
            'database': _check_database_health(),
            'kafka': _check_kafka_health(),
            'redis': _check_redis_health(),
            'mlflow': _check_mlflow_health(),
            'models': _check_models_health()
        }
        
        # Determine overall health
        all_healthy = all(status.get('status') == 'healthy' for status in health_status.values())
        overall_status = 'healthy' if all_healthy else 'degraded'
        
        check_time = time.time() - start_time
        
        results = {
            'status': overall_status,
            'components': health_status,
            'check_time_seconds': check_time,
            'created_at': datetime.now().isoformat()
        }
        
        if overall_status != 'healthy':
            logger.warning(f"System health check found issues: {health_status}")
        
        return results
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            'status': 'unhealthy',
            'error': str(e),
            'created_at': datetime.now().isoformat()
        }

@celery_app.task(base=MonitoringTask, bind=True)
def cleanup_old_data(self) -> Dict[str, Any]:
    """
    Cleanup old data and temporary files
    
    Returns:
        Cleanup summary
    """
    try:
        logger.info("Starting data cleanup")
        start_time = time.time()
        
        cleanup_results = {
            'old_predictions': _cleanup_old_predictions(),
            'old_logs': _cleanup_old_logs(),
            'temp_files': _cleanup_temp_files(),
            'old_experiments': _cleanup_old_experiments()
        }
        
        cleanup_time = time.time() - start_time
        total_cleaned = sum(result.get('items_cleaned', 0) for result in cleanup_results.values())
        
        results = {
            'status': 'completed',
            'cleanup_results': cleanup_results,
            'total_items_cleaned': total_cleaned,
            'cleanup_time_seconds': cleanup_time,
            'created_at': datetime.now().isoformat()
        }
        
        logger.info(f"Data cleanup completed in {cleanup_time:.2f} seconds")
        return results
        
    except Exception as e:
        logger.error(f"Data cleanup failed: {e}")
        return {
            'status': 'failed',
            'error': str(e),
            'created_at': datetime.now().isoformat()
        }

# Helper functions

def _get_active_users() -> List[str]:
    """Get list of active users for monitoring"""
    return ['user1', 'user2', 'user3']

def _detect_user_anomalies(user_id: str, detection_window: datetime) -> List[Dict[str, Any]]:
    """Detect anomalies for a specific user"""
    # This would implement anomaly detection logic
    return [
        {
            'user_id': user_id,
            'campaign_id': 'camp1',
            'anomaly_type': 'spending_spike',
            'severity': 'medium',
            'description': 'Unusual spending increase detected',
            'detected_at': datetime.now().isoformat()
        }
    ]

def _send_anomaly_alerts(anomalies: List[Dict[str, Any]]) -> None:
    """Send alerts for critical anomalies"""
    # This would send alerts via email, Slack, etc.
    logger.warning(f"Sending alerts for {len(anomalies)} critical anomalies")

def _check_database_health() -> Dict[str, Any]:
    """Check ClickHouse database health"""
    try:
        # This would check database connectivity and performance
        return {'status': 'healthy', 'response_time_ms': 50}
    except Exception as e:
        return {'status': 'unhealthy', 'error': str(e)}

def _check_kafka_health() -> Dict[str, Any]:
    """Check Kafka health"""
    try:
        # This would check Kafka connectivity and topics
        return {'status': 'healthy', 'topics_available': 5}
    except Exception as e:
        return {'status': 'unhealthy', 'error': str(e)}

def _check_redis_health() -> Dict[str, Any]:
    """Check Redis health"""
    try:
        # This would check Redis connectivity
        return {'status': 'healthy', 'memory_usage': '45%'}
    except Exception as e:
        return {'status': 'unhealthy', 'error': str(e)}

def _check_mlflow_health() -> Dict[str, Any]:
    """Check MLflow health"""
    try:
        # This would check MLflow tracking server
        return {'status': 'healthy', 'experiments_count': 15}
    except Exception as e:
        return {'status': 'unhealthy', 'error': str(e)}

def _check_models_health() -> Dict[str, Any]:
    """Check ML models health"""
    try:
        # This would check model availability and performance
        return {'status': 'healthy', 'models_loaded': 8}
    except Exception as e:
        return {'status': 'unhealthy', 'error': str(e)}

def _cleanup_old_predictions() -> Dict[str, Any]:
    """Cleanup old prediction records"""
    # This would delete old predictions from database
    return {'items_cleaned': 150, 'space_freed_mb': 25}

def _cleanup_old_logs() -> Dict[str, Any]:
    """Cleanup old log files"""
    # This would clean up old log files
    return {'items_cleaned': 10, 'space_freed_mb': 100}

def _cleanup_temp_files() -> Dict[str, Any]:
    """Cleanup temporary files"""
    # This would clean up temp files
    return {'items_cleaned': 75, 'space_freed_mb': 50}

def _cleanup_old_experiments() -> Dict[str, Any]:
    """Cleanup old MLflow experiments"""
    # This would clean up old experiments
    return {'items_cleaned': 5, 'space_freed_mb': 200}