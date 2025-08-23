#!/bin/bash

# Quick Manual Test Runner for Jarvish
# Runs through key test scenarios

echo "🧪 JARVISH Quick Manual Test Runner"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

BASE_URL="http://localhost:3000"

# Function to test endpoint
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected="$3"
    
    echo -ne "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" = "$expected" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $response)"
    else
        echo -e "${RED}❌ FAIL${NC} (Expected $expected, got $response)"
    fi
}

# Function to test API
test_api() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected="$5"
    
    echo -ne "Testing API: $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi
    
    if [ "$response" = "$expected" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $response)"
    else
        echo -e "${RED}❌ FAIL${NC} (Expected $expected, got $response)"
    fi
}

echo -e "${BLUE}1. Testing Page Accessibility${NC}"
echo "--------------------------------"
test_endpoint "Landing Page" "$BASE_URL/" "200"
test_endpoint "Admin Dashboard" "$BASE_URL/admin" "200"
test_endpoint "Advisor Dashboard" "$BASE_URL/advisor/dashboard" "200"
test_endpoint "Sign In Page" "$BASE_URL/auth/signin" "200"
test_endpoint "Sign Up Page" "$BASE_URL/auth/signup" "200"
echo ""

echo -e "${BLUE}2. Testing API Health${NC}"
echo "--------------------------------"
test_api "Health Check" "GET" "/api/health" "" "200"
echo ""

echo -e "${BLUE}3. Testing Authentication APIs${NC}"
echo "--------------------------------"
test_api "Email Verification" "POST" "/api/auth/verify-email" '{"email":"test@example.com"}' "200"
test_api "Mobile OTP Generation" "POST" "/api/auth/mobile-verify" '{"mobile":"+919876543210"}' "401"
echo ""

echo -e "${BLUE}4. Visual Check${NC}"
echo "--------------------------------"
echo "Please manually verify in browser:"
echo -e "${YELLOW}[ ]${NC} Landing page shows Jarvish branding"
echo -e "${YELLOW}[ ]${NC} Navy (#0B1F33) and Gold (#CEA200) colors visible"
echo -e "${YELLOW}[ ]${NC} Pricing tiers display correctly"
echo -e "${YELLOW}[ ]${NC} Mobile responsive design works"
echo -e "${YELLOW}[ ]${NC} Admin dashboard has dark sidebar"
echo -e "${YELLOW}[ ]${NC} Advisor dashboard shows content area"
echo ""

echo -e "${BLUE}5. Database Test${NC}"
echo "--------------------------------"
echo "To test database operations, run:"
echo -e "${YELLOW}npm run seed:test${NC} - Seed test data"
echo -e "${YELLOW}node${NC} - Open REPL for database queries"
echo ""
echo "In REPL, try:"
echo "  const { database } = require('./lib/utils/database')"
echo "  await database.advisors.findMany()"
echo ""

echo -e "${BLUE}6. Test Credentials${NC}"
echo "--------------------------------"
echo "Email: rajesh.kumar@wealthadvisors.in"
echo "Password: Test@123"
echo "OTP: 123456"
echo ""

echo -e "${BLUE}7. Performance Metrics${NC}"
echo "--------------------------------"
echo "Running quick performance check..."
time_start=$(date +%s%N)
curl -s "$BASE_URL/" > /dev/null
time_end=$(date +%s%N)
time_diff=$((($time_end - $time_start) / 1000000))
echo "Landing page load time: ${time_diff}ms"

if [ $time_diff -lt 1200 ]; then
    echo -e "${GREEN}✅ Performance GOOD${NC} (Target: <1200ms)"
else
    echo -e "${YELLOW}⚠️  Performance SLOW${NC} (Target: <1200ms)"
fi
echo ""

echo "===================================="
echo -e "${GREEN}✅ Quick Test Complete!${NC}"
echo "===================================="
echo ""
echo "For comprehensive testing:"
echo "1. Run unit tests: npm test"
echo "2. Run visual tests: npm run test:puppeteer"
echo "3. Run API tests: ./scripts/generate-api-tests.sh"
echo "4. Seed test data: npm run seed:test"
echo ""