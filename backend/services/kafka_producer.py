"""
Kafka Producer Service for AI-Buyer
Handles real-time streaming of Facebook advertising data to Kafka topics
"""

import json
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging
from dataclasses import dataclass, asdict
import uuid
from kafka import KafkaProducer
from kafka.errors import KafkaError
import time

logger = logging.getLogger(__name__)

@dataclass
class FacebookCampaignEvent:
    """Data class for Facebook campaign events"""
    user_id: str
    campaign_id: str
    ad_set_id: str
    ad_id: str
    timestamp: str
    event_type: str  # 'metrics_update', 'campaign_created', 'campaign_paused', etc.
    metrics: Dict[str, Any]
    metadata: Dict[str, Any]
    event_id: str = None
    
    def __post_init__(self):
        if self.event_id is None:
            self.event_id = str(uuid.uuid4())

@dataclass 
class MLPredictionEvent:
    """Data class for ML prediction events"""
    user_id: str
    model_name: str
    model_version: str
    prediction_id: str
    input_features: Dict[str, Any]
    prediction_result: Dict[str, Any]
    confidence_score: float
    timestamp: str
    event_id: str = None
    
    def __post_init__(self):
        if self.event_id is None:
            self.event_id = str(uuid.uuid4())

@dataclass
class UserActionEvent:
    """Data class for user action events"""
    user_id: str
    action_type: str  # 'budget_change', 'campaign_pause', 'optimization_applied'
    action_data: Dict[str, Any]
    timestamp: str
    session_id: str
    event_id: str = None
    
    def __post_init__(self):
        if self.event_id is None:
            self.event_id = str(uuid.uuid4())

class FacebookDataStreamer:
    """
    High-performance Kafka producer for Facebook advertising data
    Handles real-time streaming with batching and error handling
    """
    
    def __init__(self, 
                 bootstrap_servers: List[str] = None,
                 max_batch_size: int = 100,
                 max_batch_timeout: float = 1.0,
                 compression_type: str = 'gzip'):
        
        self.bootstrap_servers = bootstrap_servers or ['localhost:9092']
        self.max_batch_size = max_batch_size
        self.max_batch_timeout = max_batch_timeout
        
        # Topic configuration
        self.topics = {
            'campaign_events': 'facebook-campaign-events',
            'ml_predictions': 'ml-predictions',
            'user_actions': 'user-actions',
            'anomalies': 'anomaly-detection',
            'optimization_results': 'optimization-results'
        }
        
        # Initialize Kafka producer
        self.producer = self._create_producer(compression_type)
        
        # Batching configuration
        self.batch_buffer = []
        self.last_batch_time = time.time()
        
        # Performance metrics
        self.messages_sent = 0
        self.messages_failed = 0
        self.total_bytes_sent = 0
        
        logger.info(f"FacebookDataStreamer initialized with servers: {self.bootstrap_servers}")
    
    def _create_producer(self, compression_type: str) -> KafkaProducer:
        """Create and configure Kafka producer"""
        try:
            producer = KafkaProducer(
                bootstrap_servers=self.bootstrap_servers,
                value_serializer=lambda v: json.dumps(v, default=self._json_serializer).encode('utf-8'),
                key_serializer=lambda k: k.encode('utf-8') if k else None,
                compression_type=compression_type,
                
                # Performance optimizations
                batch_size=16384,  # 16KB batch size
                linger_ms=10,      # Wait up to 10ms to batch messages
                buffer_memory=33554432,  # 32MB buffer
                
                # Reliability settings
                acks='all',        # Wait for all replicas to acknowledge
                retries=3,         # Retry failed sends
                retry_backoff_ms=100,
                
                # Timeout settings
                request_timeout_ms=30000,
                delivery_timeout_ms=120000,
                
                # Error handling
                enable_idempotence=True
            )
            
            logger.info("Kafka producer created successfully")
            return producer
            
        except Exception as e:
            logger.error(f"Failed to create Kafka producer: {e}")
            raise
    
    def _json_serializer(self, obj):
        """Custom JSON serializer for datetime and other objects"""
        if isinstance(obj, datetime):
            return obj.isoformat()
        raise TypeError(f"Object of type {type(obj)} is not JSON serializable")
    
    def stream_campaign_metrics(self, 
                               user_id: str, 
                               campaign_data: Dict[str, Any],
                               partition_key: Optional[str] = None) -> bool:
        """
        Stream campaign metrics to Kafka
        
        Args:
            user_id: User identifier
            campaign_data: Campaign metrics and metadata
            partition_key: Optional partition key for message ordering
            
        Returns:
            Success status
        """
        try:
            # Create campaign event
            event = FacebookCampaignEvent(
                user_id=user_id,
                campaign_id=campaign_data.get('campaign_id', ''),
                ad_set_id=campaign_data.get('ad_set_id', ''),
                ad_id=campaign_data.get('ad_id', ''),
                timestamp=datetime.now().isoformat(),
                event_type='metrics_update',
                metrics=campaign_data.get('metrics', {}),
                metadata=campaign_data.get('metadata', {})
            )
            
            # Use campaign_id as partition key if not provided
            if partition_key is None:
                partition_key = f"{user_id}:{event.campaign_id}"
            
            # Send to Kafka
            return self._send_message(
                topic=self.topics['campaign_events'],
                key=partition_key,
                value=asdict(event)
            )
            
        except Exception as e:
            logger.error(f"Failed to stream campaign metrics: {e}")
            return False
    
    def stream_ml_prediction(self,
                           user_id: str,
                           model_name: str,
                           prediction_data: Dict[str, Any]) -> bool:
        """
        Stream ML model predictions to Kafka
        
        Args:
            user_id: User identifier
            model_name: Name of the ML model
            prediction_data: Prediction results and metadata
            
        Returns:
            Success status
        """
        try:
            event = MLPredictionEvent(
                user_id=user_id,
                model_name=model_name,
                model_version=prediction_data.get('model_version', 'unknown'),
                prediction_id=prediction_data.get('prediction_id', str(uuid.uuid4())),
                input_features=prediction_data.get('input_features', {}),
                prediction_result=prediction_data.get('prediction_result', {}),
                confidence_score=prediction_data.get('confidence_score', 0.0),
                timestamp=datetime.now().isoformat()
            )
            
            partition_key = f"{user_id}:{model_name}"
            
            return self._send_message(
                topic=self.topics['ml_predictions'],
                key=partition_key,
                value=asdict(event)
            )
            
        except Exception as e:
            logger.error(f"Failed to stream ML prediction: {e}")
            return False
    
    def stream_user_action(self,
                          user_id: str,
                          action_type: str,
                          action_data: Dict[str, Any],
                          session_id: str) -> bool:
        """
        Stream user actions to Kafka
        
        Args:
            user_id: User identifier
            action_type: Type of action performed
            action_data: Action details and metadata
            session_id: User session identifier
            
        Returns:
            Success status
        """
        try:
            event = UserActionEvent(
                user_id=user_id,
                action_type=action_type,
                action_data=action_data,
                timestamp=datetime.now().isoformat(),
                session_id=session_id
            )
            
            partition_key = user_id
            
            return self._send_message(
                topic=self.topics['user_actions'],
                key=partition_key,
                value=asdict(event)
            )
            
        except Exception as e:
            logger.error(f"Failed to stream user action: {e}")
            return False
    
    def stream_anomaly_detection(self,
                                user_id: str,
                                anomaly_data: Dict[str, Any]) -> bool:
        """
        Stream anomaly detection results to Kafka
        
        Args:
            user_id: User identifier
            anomaly_data: Anomaly detection results
            
        Returns:
            Success status
        """
        try:
            event = {
                'event_id': str(uuid.uuid4()),
                'user_id': user_id,
                'timestamp': datetime.now().isoformat(),
                'anomaly_type': anomaly_data.get('anomaly_type', 'unknown'),
                'campaign_id': anomaly_data.get('campaign_id', ''),
                'metric_name': anomaly_data.get('metric_name', ''),
                'severity': anomaly_data.get('severity', 'medium'),
                'detection_details': anomaly_data.get('detection_details', {}),
                'suggested_actions': anomaly_data.get('suggested_actions', [])
            }
            
            partition_key = f"{user_id}:anomaly"
            
            return self._send_message(
                topic=self.topics['anomalies'],
                key=partition_key,
                value=event
            )
            
        except Exception as e:
            logger.error(f"Failed to stream anomaly detection: {e}")
            return False
    
    def stream_optimization_result(self,
                                  user_id: str,
                                  optimization_data: Dict[str, Any]) -> bool:
        """
        Stream budget optimization results to Kafka
        
        Args:
            user_id: User identifier
            optimization_data: Optimization results and recommendations
            
        Returns:
            Success status
        """
        try:
            event = {
                'event_id': str(uuid.uuid4()),
                'user_id': user_id,
                'timestamp': datetime.now().isoformat(),
                'optimization_id': optimization_data.get('optimization_id', str(uuid.uuid4())),
                'optimization_type': optimization_data.get('optimization_type', 'budget_allocation'),
                'recommendations': optimization_data.get('recommendations', []),
                'expected_improvement': optimization_data.get('expected_improvement', {}),
                'confidence_score': optimization_data.get('confidence_score', 0.0),
                'model_version': optimization_data.get('model_version', 'unknown')
            }
            
            partition_key = f"{user_id}:optimization"
            
            return self._send_message(
                topic=self.topics['optimization_results'],
                key=partition_key,
                value=event
            )
            
        except Exception as e:
            logger.error(f"Failed to stream optimization result: {e}")
            return False
    
    def _send_message(self, topic: str, key: str, value: Dict[str, Any]) -> bool:
        """
        Send message to Kafka topic with error handling
        
        Args:
            topic: Kafka topic name
            key: Message key for partitioning
            value: Message payload
            
        Returns:
            Success status
        """
        try:
            # Send message asynchronously
            future = self.producer.send(
                topic=topic,
                key=key,
                value=value
            )
            
            # Add callback for success/failure tracking
            future.add_callback(self._on_send_success)
            future.add_errback(self._on_send_error)
            
            # Optional: Wait for acknowledgment (blocks)
            # record_metadata = future.get(timeout=10)
            
            self.messages_sent += 1
            self.total_bytes_sent += len(json.dumps(value).encode('utf-8'))
            
            return True
            
        except KafkaError as e:
            logger.error(f"Kafka error sending message to {topic}: {e}")
            self.messages_failed += 1
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending message to {topic}: {e}")
            self.messages_failed += 1
            return False
    
    def _on_send_success(self, record_metadata):
        """Callback for successful message send"""
        logger.debug(f"Message sent successfully to {record_metadata.topic} "
                    f"partition {record_metadata.partition} offset {record_metadata.offset}")
    
    def _on_send_error(self, exception):
        """Callback for failed message send"""
        logger.error(f"Failed to send message: {exception}")
        self.messages_failed += 1
    
    def batch_send_metrics(self, 
                          user_id: str, 
                          campaigns_data: List[Dict[str, Any]],
                          force_send: bool = False) -> Dict[str, int]:
        """
        Batch send multiple campaign metrics for efficiency
        
        Args:
            user_id: User identifier
            campaigns_data: List of campaign data dictionaries
            force_send: Force immediate send regardless of batch size
            
        Returns:
            Dictionary with success/failure counts
        """
        results = {'success': 0, 'failed': 0}
        
        # Add to batch buffer
        for campaign_data in campaigns_data:
            self.batch_buffer.append({
                'user_id': user_id,
                'campaign_data': campaign_data,
                'timestamp': time.time()
            })
        
        # Check if we should send the batch
        should_send = (
            force_send or
            len(self.batch_buffer) >= self.max_batch_size or
            (time.time() - self.last_batch_time) >= self.max_batch_timeout
        )
        
        if should_send:
            # Process batch
            for item in self.batch_buffer:
                success = self.stream_campaign_metrics(
                    item['user_id'],
                    item['campaign_data']
                )
                if success:
                    results['success'] += 1
                else:
                    results['failed'] += 1
            
            # Clear buffer and update timestamp
            self.batch_buffer.clear()
            self.last_batch_time = time.time()
            
            # Flush producer to ensure messages are sent
            self.producer.flush()
        
        return results
    
    async def async_stream_campaign_metrics(self,
                                          user_id: str,
                                          campaign_data: Dict[str, Any]) -> bool:
        """
        Async version of stream_campaign_metrics
        
        Args:
            user_id: User identifier
            campaign_data: Campaign metrics and metadata
            
        Returns:
            Success status
        """
        # Run in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            self.stream_campaign_metrics,
            user_id,
            campaign_data
        )
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get producer performance metrics"""
        return {
            'messages_sent': self.messages_sent,
            'messages_failed': self.messages_failed,
            'total_bytes_sent': self.total_bytes_sent,
            'success_rate': (
                self.messages_sent / (self.messages_sent + self.messages_failed)
                if (self.messages_sent + self.messages_failed) > 0 else 0
            ),
            'current_batch_size': len(self.batch_buffer),
            'topics_configured': list(self.topics.keys())
        }
    
    def health_check(self) -> Dict[str, Any]:
        """Check health of Kafka connection"""
        try:
            # Check cluster metadata
            metadata = self.producer.list_topics(timeout=5)
            
            # Check if our topics exist
            existing_topics = set(metadata.topics.keys())
            configured_topics = set(self.topics.values())
            missing_topics = configured_topics - existing_topics
            
            return {
                'status': 'healthy' if not missing_topics else 'degraded',
                'connected': True,
                'cluster_nodes': len(metadata.brokers),
                'existing_topics': list(existing_topics),
                'missing_topics': list(missing_topics),
                'producer_metrics': self.get_metrics()
            }
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                'status': 'unhealthy',
                'connected': False,
                'error': str(e),
                'producer_metrics': self.get_metrics()
            }
    
    def close(self):
        """Close Kafka producer and clean up resources"""
        try:
            # Send any remaining messages in batch
            if self.batch_buffer:
                self.batch_send_metrics('', [], force_send=True)
            
            # Close producer
            self.producer.close(timeout=30)
            logger.info("Kafka producer closed successfully")
            
        except Exception as e:
            logger.error(f"Error closing Kafka producer: {e}")

# Singleton instance for global use
_kafka_streamer: Optional[FacebookDataStreamer] = None

def get_kafka_streamer() -> FacebookDataStreamer:
    """Get singleton Kafka streamer instance"""
    global _kafka_streamer
    if _kafka_streamer is None:
        _kafka_streamer = FacebookDataStreamer()
    return _kafka_streamer

def initialize_kafka_streamer(bootstrap_servers: List[str] = None) -> FacebookDataStreamer:
    """Initialize and configure Kafka streamer"""
    global _kafka_streamer
    _kafka_streamer = FacebookDataStreamer(bootstrap_servers=bootstrap_servers)
    return _kafka_streamer