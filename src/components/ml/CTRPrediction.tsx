/**
 * CTR Prediction Component for AI-Buyer
 * Provides interface for CTR prediction and analysis
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Target, AlertCircle, Info } from 'lucide-react';
import { mlApiService, PredictionResponse } from '@/services/mlApi';

interface CTRPredictionProps {
  campaignId?: string;
  onPredictionComplete?: (prediction: PredictionResponse) => void;
}

interface PredictionFeatures {
  age_range: string;
  gender: string;
  device_platform: string;
  placement: string;
  time_of_day: number;
  day_of_week: number;
  bid_amount: number;
  daily_budget: number;
  audience_size: number;
  ad_relevance_score: number;
  landing_page_quality: number;
  previous_ctr: number;
}

const AGE_RANGES = [
  { value: '18-24', label: '18-24' },
  { value: '25-34', label: '25-34' },
  { value: '35-44', label: '35-44' },
  { value: '45-54', label: '45-54' },
  { value: '55-64', label: '55-64' },
  { value: '65+', label: '65+' },
];

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'all', label: 'All' },
];

const DEVICES = [
  { value: 'mobile', label: 'Mobile' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'tablet', label: 'Tablet' },
];

const PLACEMENTS = [
  { value: 'feed', label: 'News Feed' },
  { value: 'stories', label: 'Stories' },
  { value: 'right_column', label: 'Right Column' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'video_feeds', label: 'Video Feeds' },
];

export const CTRPrediction: React.FC<CTRPredictionProps> = ({ 
  campaignId = '', 
  onPredictionComplete 
}) => {
  const [features, setFeatures] = useState<PredictionFeatures>({
    age_range: '25-34',
    gender: 'all',
    device_platform: 'mobile',
    placement: 'feed',
    time_of_day: 12,
    day_of_week: 3,
    bid_amount: 1.50,
    daily_budget: 100,
    audience_size: 50000,
    ad_relevance_score: 7,
    landing_page_quality: 8,
    previous_ctr: 0.02,
  });

  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<Array<{
    date: string;
    predicted_ctr: number;
    actual_ctr?: number;
  }>>([]);

  // Handle form input changes
  const handleInputChange = (field: keyof PredictionFeatures, value: string | number) => {
    setFeatures(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Make CTR prediction
  const makePrediction = async () => {
    if (!campaignId) {
      setError('Campaign ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const predictionResponse = await mlApiService.getCTRPrediction(campaignId, features);
      setPrediction(predictionResponse);
      
      // Add to historical data for trending
      const newDataPoint = {
        date: new Date().toISOString().split('T')[0],
        predicted_ctr: predictionResponse.prediction_result.ctr_prediction as number,
      };
      
      setHistoricalData(prev => [...prev.slice(-9), newDataPoint]);

      if (onPredictionComplete) {
        onPredictionComplete(predictionResponse);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to make prediction');
    } finally {
      setLoading(false);
    }
  };

  // Get confidence color based on score
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get CTR performance level
  const getCTRLevel = (ctr: number): { level: string; color: string } => {
    if (ctr >= 0.05) return { level: 'Excellent', color: 'text-green-600' };
    if (ctr >= 0.03) return { level: 'Good', color: 'text-blue-600' };
    if (ctr >= 0.02) return { level: 'Average', color: 'text-yellow-600' };
    return { level: 'Below Average', color: 'text-red-600' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Target className="h-6 w-6" />
        <h2 className="text-2xl font-bold">CTR Prediction</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Features</CardTitle>
            <CardDescription>
              Configure campaign parameters for CTR prediction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Campaign ID */}
            <div className="space-y-2">
              <Label htmlFor="campaign-id">Campaign ID</Label>
              <Input
                id="campaign-id"
                value={campaignId}
                placeholder="Enter campaign ID"
                disabled
              />
            </div>

            {/* Audience Demographics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Age Range</Label>
                <Select
                  value={features.age_range}
                  onValueChange={(value) => handleInputChange('age_range', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_RANGES.map(range => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={features.gender}
                  onValueChange={(value) => handleInputChange('gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDERS.map(gender => (
                      <SelectItem key={gender.value} value={gender.value}>
                        {gender.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Platform & Placement */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Device Platform</Label>
                <Select
                  value={features.device_platform}
                  onValueChange={(value) => handleInputChange('device_platform', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICES.map(device => (
                      <SelectItem key={device.value} value={device.value}>
                        {device.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Placement</Label>
                <Select
                  value={features.placement}
                  onValueChange={(value) => handleInputChange('placement', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLACEMENTS.map(placement => (
                      <SelectItem key={placement.value} value={placement.value}>
                        {placement.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Budget & Bid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bid-amount">Bid Amount ($)</Label>
                <Input
                  id="bid-amount"
                  type="number"
                  step="0.01"
                  value={features.bid_amount}
                  onChange={(e) => handleInputChange('bid_amount', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="daily-budget">Daily Budget ($)</Label>
                <Input
                  id="daily-budget"
                  type="number"
                  value={features.daily_budget}
                  onChange={(e) => handleInputChange('daily_budget', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Quality Scores */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="relevance-score">Ad Relevance Score (1-10)</Label>
                <Input
                  id="relevance-score"
                  type="number"
                  min="1"
                  max="10"
                  value={features.ad_relevance_score}
                  onChange={(e) => handleInputChange('ad_relevance_score', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="landing-quality">Landing Page Quality (1-10)</Label>
                <Input
                  id="landing-quality"
                  type="number"
                  min="1"
                  max="10"
                  value={features.landing_page_quality}
                  onChange={(e) => handleInputChange('landing_page_quality', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Previous Performance */}
            <div className="space-y-2">
              <Label htmlFor="previous-ctr">Previous CTR (as decimal)</Label>
              <Input
                id="previous-ctr"
                type="number"
                step="0.001"
                value={features.previous_ctr}
                onChange={(e) => handleInputChange('previous_ctr', parseFloat(e.target.value) || 0)}
              />
            </div>

            {/* Predict Button */}
            <Button 
              onClick={makePrediction} 
              disabled={loading || !campaignId}
              className="w-full"
            >
              {loading ? 'Predicting...' : 'Predict CTR'}
            </Button>

            {error && (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prediction Results */}
        <Card>
          <CardHeader>
            <CardTitle>Prediction Results</CardTitle>
            <CardDescription>
              AI-powered CTR prediction and insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            {prediction ? (
              <div className="space-y-6">
                {/* Main Prediction */}
                <div className="text-center space-y-2">
                  <div className="text-4xl font-bold text-blue-600">
                    {((prediction.prediction_result.ctr_prediction as number) * 100).toFixed(3)}%
                  </div>
                  <div className="text-lg text-muted-foreground">Predicted CTR</div>
                  
                  <div className="flex items-center justify-center space-x-4">
                    <Badge variant="outline" className={getConfidenceColor(prediction.confidence_score)}>
                      {(prediction.confidence_score * 100).toFixed(1)}% Confidence
                    </Badge>
                    <Badge variant="outline" className={getCTRLevel(prediction.prediction_result.ctr_prediction as number).color}>
                      {getCTRLevel(prediction.prediction_result.ctr_prediction as number).level}
                    </Badge>
                  </div>
                </div>

                {/* Performance Indicators */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Confidence Level</span>
                    <span className="text-sm font-medium">
                      {(prediction.confidence_score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={prediction.confidence_score * 100} className="h-2" />
                </div>

                {/* Additional Metrics */}
                {prediction.prediction_result.additional_metrics && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Expected CPC</div>
                      <div className="font-medium">
                        ${(prediction.prediction_result.expected_cpc as number || 0).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Quality Score</div>
                      <div className="font-medium">
                        {(prediction.prediction_result.quality_score as number || 0).toFixed(1)}/10
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {prediction.recommendations && prediction.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Info className="h-4 w-4" />
                      <span className="font-medium">Recommendations</span>
                    </div>
                    <ul className="text-sm space-y-1">
                      {prediction.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Processing Info */}
                <div className="text-xs text-muted-foreground text-center">
                  Model: {prediction.model_version} • 
                  Processing time: {prediction.processing_time_ms}ms
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <div>Configure campaign features and click "Predict CTR" to see results</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Historical Trends */}
      {historicalData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>CTR Prediction Trends</CardTitle>
            <CardDescription>
              Historical prediction results for this campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis 
                    tickFormatter={(value) => `${(value * 100).toFixed(2)}%`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${(value * 100).toFixed(3)}%`, 'Predicted CTR']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predicted_ctr" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                  {historicalData.some(d => d.actual_ctr) && (
                    <Line 
                      type="monotone" 
                      dataKey="actual_ctr" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CTRPrediction;