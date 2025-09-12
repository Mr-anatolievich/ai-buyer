/**
 * ML API Service for AI-Buyer Frontend
 * Handles communication with ML models and predictions
 */

import React from 'react';
import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Specific feature types instead of any
export interface CTRFeatures {
  age_range: string;
  gender: string;
  device_platform: string;
  bid_amount: number;
  ad_relevance_score?: number;
  audience_size?: number;
  time_of_day?: string;
  day_of_week?: string;
}

export interface BudgetFeatures {
  current_budget: number;
  campaign_performance: number;
  target_cpm: number;
  audience_reach: number;
  seasonality_factor?: number;
}

export interface AnomalyFeatures {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  timestamp: string;
}

// Types for ML API responses
export interface PredictionRequest {
  campaign_id: string;
  features: CTRFeatures | BudgetFeatures | AnomalyFeatures;
  model_type: 'ctr_prediction' | 'budget_optimization' | 'anomaly_detection';
  include_confidence?: boolean;
}

export interface PredictionResponse {
  prediction_id: string;
  prediction_result: {
    value: number;
    category?: string;
    recommendations?: string[];
  };
  confidence_score: number;
  model_version: string;
  processing_time_ms: number;
  recommendations?: string[];
}

export interface ModelInfo {
  model_name: string;
  model_version: string;
  model_type: string;
  accuracy_metrics: Record<string, number>;
  last_trained: string;
  status: 'active' | 'training' | 'deprecated';
}

export interface TrainingFilter {
  date_range?: {
    start_date: string;
    end_date: string;
  };
  campaign_ids?: string[];
  min_performance_threshold?: number;
}

export interface ModelHyperparameters {
  learning_rate?: number;
  batch_size?: number;
  epochs?: number;
  hidden_layers?: number[];
  dropout_rate?: number;
  regularization?: number;
}

export interface TrainingRequest {
  model_type: 'ctr_prediction' | 'budget_optimization';
  training_data_filter?: TrainingFilter;
  hyperparameters?: ModelHyperparameters;
  experiment_name?: string;
}

export interface TrainingResponse {
  training_id: string;
  status: 'started' | 'running' | 'completed' | 'failed';
  estimated_completion_time?: string;
  current_metrics?: Record<string, number>;
}

export interface CampaignConstraints {
  min_budget?: number;
  max_budget?: number;
  target_cpa?: number;
  max_bid?: number;
  audience_restrictions?: string[];
}

export interface OptimizationRequest {
  user_id: string;
  campaigns: Array<{
    campaign_id: string;
    current_budget: number;
    target_metric: string;
    constraints?: CampaignConstraints;
  }>;
  optimization_goal: 'maximize_roas' | 'maximize_conversions' | 'minimize_cost';
  time_horizon_days: number;
}

export interface OptimizationResponse {
  optimization_id: string;
  recommendations: Array<{
    campaign_id: string;
    recommended_budget: number;
    expected_improvement: number;
    confidence_score: number;
    reasoning: string;
  }>;
  expected_total_improvement: number;
  risk_assessment: string;
}

export interface AnomalyDetectionResponse {
  anomalies: Array<{
    campaign_id: string;
    metric_name: string;
    anomaly_type: 'spike' | 'drop' | 'trend_change' | 'seasonal_deviation';
    severity: 'low' | 'medium' | 'high' | 'critical';
    detection_time: string;
    description: string;
    suggested_actions: string[];
  }>;
  summary: {
    total_anomalies: number;
    critical_count: number;
    affected_campaigns: number;
  };
}

export interface ModelMetrics {
  model_name: string;
  metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1_score?: number;
    mse?: number;
    rmse?: number;
    mae?: number;
    r2_score?: number;
  };
  validation_date: string;
  data_quality_score: number;
}

// Event listener types
export type EventCallback = (data: unknown) => void;
export type WebSocketPayload = {
  type: string;
  data: unknown;
  timestamp?: string;
};

class MLApiService {
  private api: AxiosInstance;
  private wsConnection: WebSocket | null = null;
  private eventListeners: Map<string, EventCallback[]> = new Map();

  constructor(baseURL: string = process.env.REACT_APP_API_URL || 'http://localhost:8000') {
    this.api = axios.create({
      baseURL: `${baseURL}/api/v1`,
      timeout: 30000, // 30 seconds for ML operations
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for auth
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('ML API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  // =============================================================================
  // PREDICTION METHODS
  // =============================================================================

  /**
   * Get CTR prediction for a campaign
   */
  async getCTRPrediction(
    campaign_id: string,
    features: CTRFeatures
  ): Promise<PredictionResponse> {
    const response: AxiosResponse<PredictionResponse> = await this.api.post('/ml/predict/ctr', {
      campaign_id,
      features,
      model_type: 'ctr_prediction',
      include_confidence: true,
    });
    return response.data;
  }

  /**
   * Get budget optimization recommendations
   */
  async getBudgetOptimization(request: OptimizationRequest): Promise<OptimizationResponse> {
    const response: AxiosResponse<OptimizationResponse> = await this.api.post(
      '/ml/optimize/budget',
      request
    );
    return response.data;
  }

  /**
   * Get anomaly detection results
   */
  async getAnomalyDetection(
    user_id: string,
    time_range_hours: number = 24
  ): Promise<AnomalyDetectionResponse> {
    const response: AxiosResponse<AnomalyDetectionResponse> = await this.api.get(
      `/ml/detect/anomalies`,
      {
        params: {
          user_id,
          time_range_hours,
        },
      }
    );
    return response.data;
  }

  /**
   * Make generic prediction request
   */
  async makePrediction(request: PredictionRequest): Promise<PredictionResponse> {
    const response: AxiosResponse<PredictionResponse> = await this.api.post(
      '/ml/predict',
      request
    );
    return response.data;
  }

  // =============================================================================
  // MODEL MANAGEMENT
  // =============================================================================

  /**
   * Get available ML models
   */
  async getAvailableModels(): Promise<ModelInfo[]> {
    const response: AxiosResponse<ModelInfo[]> = await this.api.get('/ml/models');
    return response.data;
  }

  /**
   * Get model metrics and performance
   */
  async getModelMetrics(model_name: string): Promise<ModelMetrics> {
    const response: AxiosResponse<ModelMetrics> = await this.api.get(
      `/ml/models/${model_name}/metrics`
    );
    return response.data;
  }

  /**
   * Start model training
   */
  async startModelTraining(request: TrainingRequest): Promise<TrainingResponse> {
    const response: AxiosResponse<TrainingResponse> = await this.api.post(
      '/ml/train',
      request
    );
    return response.data;
  }

  /**
   * Get training status
   */
  async getTrainingStatus(training_id: string): Promise<TrainingResponse> {
    const response: AxiosResponse<TrainingResponse> = await this.api.get(
      `/ml/train/${training_id}/status`
    );
    return response.data;
  }

  // =============================================================================
  // REAL-TIME FEATURES
  // =============================================================================

  /**
   * Connect to WebSocket for real-time updates
   */
  connectWebSocket(user_id: string): void {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';
    this.wsConnection = new WebSocket(`${wsUrl}/ws/ml/${user_id}`);

    this.wsConnection.onopen = () => {
      console.log('ML WebSocket connected');
      this.emit('ws:connected', {});
    };

    this.wsConnection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit(`ws:${data.type}`, data.payload);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.wsConnection.onclose = () => {
      console.log('ML WebSocket disconnected');
      this.emit('ws:disconnected', {});
      
      // Auto-reconnect after 5 seconds
      setTimeout(() => {
        if (!this.wsConnection || this.wsConnection.readyState === WebSocket.CLOSED) {
          this.connectWebSocket(user_id);
        }
      }, 5000);
    };

    this.wsConnection.onerror = (error) => {
      console.error('ML WebSocket error:', error);
      this.emit('ws:error', error);
    };
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  /**
   * Send message via WebSocket
   */
  sendWebSocketMessage(type: string, payload: WebSocketPayload): void {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({ type, payload }));
    }
  }

  // =============================================================================
  // EVENT HANDLING
  // =============================================================================

  /**
   * Add event listener
   */
  on(event: string, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: EventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  private emit(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // =============================================================================
  // BATCH OPERATIONS
  // =============================================================================

  /**
   * Get predictions for multiple campaigns
   */
  async getBatchPredictions(
    requests: PredictionRequest[]
  ): Promise<PredictionResponse[]> {
    const response: AxiosResponse<PredictionResponse[]> = await this.api.post(
      '/ml/predict/batch',
      { requests }
    );
    return response.data;
  }

  /**
   * Get comprehensive analytics for dashboard
   */
  async getDashboardAnalytics(user_id: string): Promise<{
    recent_predictions: PredictionResponse[];
    anomalies: AnomalyDetectionResponse;
    model_performance: ModelMetrics[];
    optimization_suggestions: OptimizationResponse;
  }> {
    const response = await this.api.get(`/ml/dashboard/${user_id}`);
    return response.data;
  }

  // =============================================================================
  // UTILITIES
  // =============================================================================

  /**
   * Health check for ML services
   */
  async healthCheck(): Promise<{
    status: string;
    models_available: number;
    predictions_today: number;
    avg_response_time_ms: number;
  }> {
    const response = await this.api.get('/ml/health');
    return response.data;
  }

  /**
   * Get feature importance for a model
   */
  async getFeatureImportance(model_name: string): Promise<{
    features: Array<{
      name: string;
      importance: number;
      description: string;
    }>;
  }> {
    const response = await this.api.get(`/ml/models/${model_name}/features`);
    return response.data;
  }

  /**
   * Get prediction explanations
   */
  async getPredictionExplanation(
    prediction_id: string
  ): Promise<{
    explanation: string;
    contributing_factors: Array<{
      factor: string;
      impact: number;
      description: string;
    }>;
    confidence_breakdown: Record<string, number>;
  }> {
    const response = await this.api.get(`/ml/predictions/${prediction_id}/explain`);
    return response.data;
  }
}

// Create singleton instance
export const mlApiService = new MLApiService();

// Export default instance
export default mlApiService;

// Export utility functions for React hooks
export const usePrediction = (request: PredictionRequest | null) => {
  const [prediction, setPrediction] = React.useState<PredictionResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!request) return;

    setLoading(true);
    setError(null);

    mlApiService
      .makePrediction(request)
      .then(setPrediction)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [request]);

  return { prediction, loading, error };
};

export const useModelMetrics = (modelName: string) => {
  const [metrics, setMetrics] = React.useState<ModelMetrics | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!modelName) return;

    setLoading(true);
    setError(null);

    mlApiService
      .getModelMetrics(modelName)
      .then(setMetrics)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [modelName]);

  return { metrics, loading, error };
};

export const useAnomalyDetection = (userId: string, timeRangeHours: number = 24) => {
  const [anomalies, setAnomalies] = React.useState<AnomalyDetectionResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    mlApiService
      .getAnomalyDetection(userId, timeRangeHours)
      .then(setAnomalies)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId, timeRangeHours]);

  return { anomalies, loading, error };
};