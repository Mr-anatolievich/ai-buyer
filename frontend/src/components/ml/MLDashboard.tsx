/**
 * ML Dashboard Component for AI-Buyer
 * Displays ML predictions, model performance, and optimization recommendations
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { AlertTriangle, TrendingUp, Brain, Target, Zap, Info } from 'lucide-react';
import { mlApiService, PredictionResponse, ModelMetrics, AnomalyDetectionResponse, OptimizationResponse } from '@/services/mlApi';

interface MLDashboardProps {
  userId: string;
}

interface DashboardData {
  recent_predictions: PredictionResponse[];
  anomalies: AnomalyDetectionResponse;
  model_performance: ModelMetrics[];
  optimization_suggestions: OptimizationResponse;
}

export const MLDashboard: React.FC<MLDashboardProps> = ({ userId }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [realtimeUpdates, setRealtimeUpdates] = useState(true);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await mlApiService.getDashboardAnalytics(userId);
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Set up real-time updates
  useEffect(() => {
    if (!realtimeUpdates) return;

    mlApiService.connectWebSocket(userId);

    // Listen for real-time updates
    mlApiService.on('ws:prediction_complete', (data: PredictionResponse) => {
      setDashboardData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          recent_predictions: [data, ...prev.recent_predictions.slice(0, 9)] // Keep last 10
        };
      });
    });

    mlApiService.on('ws:anomaly_detected', () => {
      // Reload anomaly data when new anomaly is detected
      loadDashboardData();
    });

    mlApiService.on('ws:optimization_complete', (data: OptimizationResponse) => {
      setDashboardData(prev => {
        if (!prev) return prev;
        return { ...prev, optimization_suggestions: data };
      });
    });

    return () => {
      mlApiService.disconnectWebSocket();
    };
  }, [userId, realtimeUpdates, loadDashboardData]);

  // Initial data load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Format confidence score for display
  const formatConfidence = (score: number): string => {
    return `${(score * 100).toFixed(1)}%`;
  };

  // Get severity color for badges
  const getSeverityColor = (severity: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-2">
          <Brain className="h-6 w-6 animate-pulse" />
          <h1 className="text-2xl font-bold">ML Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading ML Dashboard</AlertTitle>
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-4" 
            onClick={loadDashboardData}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { recent_predictions, anomalies, model_performance, optimization_suggestions } = dashboardData;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="h-6 w-6" />
          <h1 className="text-2xl font-bold">ML Dashboard</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={realtimeUpdates ? "default" : "outline"}
            size="sm"
            onClick={() => setRealtimeUpdates(!realtimeUpdates)}
          >
            <Zap className="h-4 w-4 mr-2" />
            Real-time {realtimeUpdates ? 'ON' : 'OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={loadDashboardData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Predictions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recent_predictions.length}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Anomalies</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {anomalies.summary.critical_count}
            </div>
            <p className="text-xs text-muted-foreground">
              {anomalies.summary.total_anomalies} total detected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Model Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {model_performance.length > 0 
                ? `${(model_performance[0].metrics.accuracy || 0 * 100).toFixed(1)}%`
                : 'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Best performing model
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optimization Impact</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{(optimization_suggestions.expected_total_improvement * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Expected ROAS improvement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="predictions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="models">Model Performance</TabsTrigger>
        </TabsList>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Predictions</CardTitle>
              <CardDescription>
                Latest ML predictions with confidence scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recent_predictions.map((prediction, index) => (
                  <div key={prediction.prediction_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">
                        Prediction #{prediction.prediction_id.slice(-8)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Model: {prediction.model_version} • 
                        Processing time: {prediction.processing_time_ms}ms
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={prediction.confidence_score > 0.8 ? "default" : "secondary"}>
                        {formatConfidence(prediction.confidence_score)}
                      </Badge>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
                {recent_predictions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent predictions found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anomalies Tab */}
        <TabsContent value="anomalies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detected Anomalies</CardTitle>
              <CardDescription>
                {anomalies.summary.total_anomalies} anomalies affecting {anomalies.summary.affected_campaigns} campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {anomalies.anomalies.map((anomaly, index) => (
                  <Alert key={index} variant={anomaly.severity === 'critical' ? 'destructive' : 'default'}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="flex items-center justify-between">
                      <span>{anomaly.metric_name} - {anomaly.anomaly_type}</span>
                      <Badge variant={getSeverityColor(anomaly.severity)}>
                        {anomaly.severity}
                      </Badge>
                    </AlertTitle>
                    <AlertDescription className="space-y-2">
                      <div>{anomaly.description}</div>
                      <div className="text-sm text-muted-foreground">
                        Campaign: {anomaly.campaign_id} • Detected: {new Date(anomaly.detection_time).toLocaleString()}
                      </div>
                      {anomaly.suggested_actions.length > 0 && (
                        <div className="mt-2">
                          <div className="text-sm font-medium">Suggested Actions:</div>
                          <ul className="text-sm list-disc list-inside">
                            {anomaly.suggested_actions.map((action, i) => (
                              <li key={i}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
                {anomalies.anomalies.length === 0 && (
                  <div className="text-center py-8 text-green-600">
                    <Target className="h-8 w-8 mx-auto mb-2" />
                    No anomalies detected - all campaigns performing normally
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Optimization Recommendations</CardTitle>
              <CardDescription>
                AI-powered budget allocation suggestions for improved performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {optimization_suggestions.recommendations.map((rec, index) => (
                  <div key={rec.campaign_id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Campaign {rec.campaign_id}</div>
                      <Badge variant="outline">
                        {formatConfidence(rec.confidence_score)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Recommended Budget</div>
                        <div className="font-medium">${rec.recommended_budget.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Expected Improvement</div>
                        <div className="font-medium text-green-600">
                          +{(rec.expected_improvement * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {rec.reasoning}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <div className="font-medium text-blue-600">Risk Assessment</div>
                </div>
                <div className="text-sm text-blue-800">
                  {optimization_suggestions.risk_assessment}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Model Performance Tab */}
        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Performance Metrics</CardTitle>
              <CardDescription>
                Performance tracking for active ML models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {model_performance.map((model, index) => (
                  <div key={model.model_name} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">{model.model_name}</h3>
                      <Badge variant="outline">
                        Data Quality: {(model.data_quality_score * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(model.metrics).map(([metric, value]) => (
                        <div key={metric} className="space-y-2">
                          <div className="text-sm text-muted-foreground capitalize">
                            {metric.replace('_', ' ')}
                          </div>
                          <div className="text-xl font-bold">
                            {typeof value === 'number' ? (value * 100).toFixed(1) + '%' : 'N/A'}
                          </div>
                          <Progress 
                            value={typeof value === 'number' ? value * 100 : 0} 
                            className="h-2"
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Last validated: {new Date(model.validation_date).toLocaleString()}
                    </div>
                  </div>
                ))}
                
                {model_performance.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No model performance data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MLDashboard;