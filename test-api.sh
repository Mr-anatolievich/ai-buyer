#!/bin/bash

echo "=== Testing AI-Buyer Backend API ==="
echo

echo "1. Health Check:"
curl -s http://localhost:8000/health | jq . 2>/dev/null || curl -s http://localhost:8000/health
echo -e "\n"

echo "2. Campaigns API:"
curl -s http://localhost:8000/api/v1/campaigns | jq '.campaigns[0]' 2>/dev/null || curl -s http://localhost:8000/api/v1/campaigns
echo -e "\n"

echo "3. Dashboard API:"
curl -s http://localhost:8000/api/v1/dashboard | jq '.' 2>/dev/null || curl -s http://localhost:8000/api/v1/dashboard
echo -e "\n"

echo "4. Performance Analytics:"
curl -s http://localhost:8000/api/v1/analytics/performance | jq '.total_impressions' 2>/dev/null || curl -s http://localhost:8000/api/v1/analytics/performance
echo -e "\n"

echo "5. Models Status:"
curl -s http://localhost:8000/api/v1/models/status | jq '.overall_status' 2>/dev/null || curl -s http://localhost:8000/api/v1/models/status
echo -e "\n"

echo "6. CTR Prediction (POST):"
curl -s -X POST http://localhost:8000/api/v1/predictions/ctr \
  -H "Content-Type: application/json" \
  -d '{"campaign_id": "test_123", "audience_size": 50000}' | jq '.predicted_ctr' 2>/dev/null || \
curl -s -X POST http://localhost:8000/api/v1/predictions/ctr \
  -H "Content-Type: application/json" \
  -d '{"campaign_id": "test_123", "audience_size": 50000}'
echo -e "\n"

echo "7. Budget Optimization (POST):"
curl -s -X POST http://localhost:8000/api/v1/predictions/budget \
  -H "Content-Type: application/json" \
  -d '{"campaigns": [{"campaign_id": "test", "budget": 1000}], "total_budget": 5000}' | jq '.optimization_success' 2>/dev/null || \
curl -s -X POST http://localhost:8000/api/v1/predictions/budget \
  -H "Content-Type: application/json" \
  -d '{"campaigns": [{"campaign_id": "test", "budget": 1000}], "total_budget": 5000}'
echo -e "\n"

echo "=== API Documentation ==="
echo "Swagger UI: http://localhost:8000/docs"
echo "ReDoc: http://localhost:8000/redoc"