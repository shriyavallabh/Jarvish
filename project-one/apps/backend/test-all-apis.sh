#!/bin/bash

# Jarvish Platform - API Testing Script
# Tests all implemented API endpoints

BASE_URL="http://localhost:8001"
echo "🧪 Testing Jarvish Platform APIs..."
echo "=================================="

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -n "Testing: $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi
    
    if [ "$response" = "200" ] || [ "$response" = "201" ]; then
        echo -e "${GREEN}✅ Success ($response)${NC}"
    else
        echo -e "${RED}❌ Failed ($response)${NC}"
    fi
}

echo ""
echo "1️⃣ Health & System Endpoints"
echo "------------------------------"
test_endpoint "GET" "/health" "Health Check"
test_endpoint "GET" "/api/v1" "API Info"

echo ""
echo "2️⃣ Compliance Endpoints"
echo "------------------------"
test_endpoint "POST" "/api/compliance/check" "Compliance Check" '{"content":"Invest in mutual funds for guaranteed returns","language":"en"}'
test_endpoint "GET" "/api/compliance/rules" "Get Compliance Rules"
test_endpoint "GET" "/api/compliance/stats" "Compliance Statistics"
test_endpoint "GET" "/api/compliance/health" "Compliance Health"

echo ""
echo "3️⃣ WhatsApp Template Endpoints"
echo "--------------------------------"
test_endpoint "GET" "/api/whatsapp/templates" "Get All Templates"
test_endpoint "GET" "/api/whatsapp/templates/approved" "Get Approved Templates"
test_endpoint "GET" "/api/whatsapp/templates/image" "Get Image Templates"
test_endpoint "GET" "/api/whatsapp/health" "WhatsApp Health"

echo ""
echo "4️⃣ Image Processing Endpoints"
echo "------------------------------"
test_endpoint "POST" "/api/images/process-gpt" "Process GPT Image" '{"base64Data":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="}'
test_endpoint "GET" "/api/images/storage-stats" "Storage Statistics"
test_endpoint "GET" "/api/images/health" "Image Processing Health"

echo ""
echo "5️⃣ Billing Endpoints"
echo "--------------------"
test_endpoint "GET" "/api/billing/plans" "Get Subscription Plans"
test_endpoint "GET" "/api/billing/pricing" "Get Pricing"
test_endpoint "GET" "/api/billing/comparison" "Plan Comparison"
test_endpoint "POST" "/api/billing/validate-promo" "Validate Promo Code" '{"promoCode":"FOUNDING100"}'
test_endpoint "GET" "/api/billing/health" "Billing Health"

echo ""
echo "6️⃣ Monitoring Endpoints"
echo "-----------------------"
test_endpoint "GET" "/api/monitoring/health" "Monitoring Health"
test_endpoint "GET" "/api/monitoring/metrics/system" "System Metrics"
test_endpoint "GET" "/api/monitoring/metrics/business" "Business Metrics"
test_endpoint "GET" "/api/monitoring/dashboard" "Monitoring Dashboard"
test_endpoint "GET" "/api/monitoring/alerts" "Active Alerts"

echo ""
echo "7️⃣ Analytics Endpoints"
echo "----------------------"
test_endpoint "GET" "/api/analytics/advisors" "Advisor Metrics"
test_endpoint "GET" "/api/analytics/content" "Content Analytics"
test_endpoint "GET" "/api/analytics/revenue" "Revenue Analytics"
test_endpoint "GET" "/api/analytics/churn-prediction" "Churn Prediction"
test_endpoint "GET" "/api/analytics/business-intelligence" "Business Intelligence"

echo ""
echo "=================================="
echo "✨ API Testing Complete!"
echo ""

# Test summary
echo "📊 Quick Stats:"
curl -s "$BASE_URL/api/monitoring/health" | jq -r '.data.business.sla | "WhatsApp Delivery: \(.delivery)\nCompliance Response: \(.compliance)"'
echo ""
echo "💰 Revenue Stats:"
curl -s "$BASE_URL/api/analytics/revenue" | jq -r '.data.current | "MRR: ₹\(.recurringRevenue)\nGrowth Rate: \(.growthRate)%"'