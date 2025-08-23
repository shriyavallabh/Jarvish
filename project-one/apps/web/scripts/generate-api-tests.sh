#!/bin/bash

# API Testing Commands Generator for Jarvish
# This script generates cURL commands for testing all API endpoints

echo "========================================="
echo "🚀 JARVISH API Testing Commands"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3000"

# Test data
TEST_EMAIL="rajesh.kumar@wealthadvisors.in"
TEST_MOBILE="+919876543210"
TEST_OTP="123456"
TEST_TOKEN="test-token-123" # In production, get from Clerk

echo -e "${BLUE}=== Authentication & Onboarding APIs ===${NC}"
echo ""

echo -e "${GREEN}1. Email Verification - Send${NC}"
echo "curl -X POST $BASE_URL/api/auth/verify-email \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"email\": \"$TEST_EMAIL\"}'"
echo ""

echo -e "${GREEN}2. Email Verification - Verify Token${NC}"
echo "curl -X GET \"$BASE_URL/api/auth/verify-email?token=$TEST_TOKEN&email=$TEST_EMAIL\""
echo ""

echo -e "${GREEN}3. Mobile Verification - Generate OTP${NC}"
echo "curl -X POST $BASE_URL/api/auth/mobile-verify \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer $TEST_TOKEN\" \\"
echo "  -d '{\"mobile\": \"$TEST_MOBILE\"}'"
echo ""

echo -e "${GREEN}4. Mobile Verification - Verify OTP${NC}"
echo "curl -X PUT $BASE_URL/api/auth/mobile-verify \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer $TEST_TOKEN\" \\"
echo "  -d '{\"otp\": \"$TEST_OTP\"}'"
echo ""

echo -e "${GREEN}5. Mobile Verification - Resend OTP${NC}"
echo "curl -X PATCH $BASE_URL/api/auth/mobile-verify \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer $TEST_TOKEN\" \\"
echo "  -d '{\"mobile\": \"$TEST_MOBILE\"}'"
echo ""

echo -e "${BLUE}=== Profile Management APIs ===${NC}"
echo ""

echo -e "${GREEN}6. Create/Update Profile${NC}"
echo "curl -X POST $BASE_URL/api/profile \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer $TEST_TOKEN\" \\"
echo "  -d '{"
echo "    \"firmName\": \"Test Financial Advisors\","
echo "    \"firmRegistrationNumber\": \"E123456\","
echo "    \"experience\": 10,"
echo "    \"clientCount\": 150,"
echo "    \"aum\": 50000000,"
echo "    \"specializations\": [\"Mutual Funds\", \"Insurance\"],"
echo "    \"languages\": [\"English\", \"Hindi\"],"
echo "    \"location\": {"
echo "      \"city\": \"Mumbai\","
echo "      \"state\": \"Maharashtra\","
echo "      \"pincode\": \"400001\""
echo "    },"
echo "    \"contactInfo\": {"
echo "      \"businessPhone\": \"+919876543210\","
echo "      \"businessEmail\": \"test@advisors.in\","
echo "      \"website\": \"https://testadvisors.in\""
echo "    }"
echo "  }'"
echo ""

echo -e "${GREEN}7. Get Profile${NC}"
echo "curl -X GET $BASE_URL/api/profile \\"
echo "  -H \"Authorization: Bearer $TEST_TOKEN\""
echo ""

echo -e "${GREEN}8. Upload Profile Photo (multipart/form-data)${NC}"
echo "curl -X POST $BASE_URL/api/profile/photo \\"
echo "  -H \"Authorization: Bearer $TEST_TOKEN\" \\"
echo "  -F \"photo=@/path/to/photo.jpg\""
echo ""

echo -e "${GREEN}9. Upload Company Logo${NC}"
echo "curl -X POST $BASE_URL/api/profile/logo \\"
echo "  -H \"Authorization: Bearer $TEST_TOKEN\" \\"
echo "  -F \"logo=@/path/to/logo.png\""
echo ""

echo -e "${GREEN}10. Update Branding${NC}"
echo "curl -X PUT $BASE_URL/api/profile/branding \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer $TEST_TOKEN\" \\"
echo "  -d '{"
echo "    \"primaryColor\": \"#0B1F33\","
echo "    \"secondaryColor\": \"#CEA200\","
echo "    \"accentColor\": \"#0C310C\","
echo "    \"fontFamily\": \"Poppins\","
echo "    \"logoPosition\": \"top-left\","
echo "    \"contentStyle\": \"professional\""
echo "  }'"
echo ""

echo -e "${BLUE}=== Content Management APIs ===${NC}"
echo ""

echo -e "${GREEN}11. Generate Content with AI${NC}"
echo "curl -X POST $BASE_URL/api/content/generate \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer $TEST_TOKEN\" \\"
echo "  -d '{"
echo "    \"type\": \"market_update\","
echo "    \"language\": \"English\","
echo "    \"tone\": \"professional\","
echo "    \"topic\": \"Nifty performance today\""
echo "  }'"
echo ""

echo -e "${GREEN}12. Check Content Compliance${NC}"
echo "curl -X POST $BASE_URL/api/content/compliance-check \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer $TEST_TOKEN\" \\"
echo "  -d '{"
echo "    \"content\": \"Markets are performing well. Consider investing in mutual funds for long-term wealth creation.\","
echo "    \"language\": \"English\""
echo "  }'"
echo ""

echo -e "${GREEN}13. Schedule Content${NC}"
echo "curl -X POST $BASE_URL/api/content/schedule \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer $TEST_TOKEN\" \\"
echo "  -d '{"
echo "    \"contentId\": \"content-123\","
echo "    \"scheduledFor\": \"2024-12-21T00:30:00Z\","
echo "    \"channels\": [\"whatsapp\", \"status\"]"
echo "  }'"
echo ""

echo -e "${GREEN}14. Get Content History${NC}"
echo "curl -X GET \"$BASE_URL/api/content/history?limit=10&offset=0\" \\"
echo "  -H \"Authorization: Bearer $TEST_TOKEN\""
echo ""

echo -e "${BLUE}=== Analytics APIs ===${NC}"
echo ""

echo -e "${GREEN}15. Get Dashboard Stats${NC}"
echo "curl -X GET $BASE_URL/api/analytics/dashboard \\"
echo "  -H \"Authorization: Bearer $TEST_TOKEN\""
echo ""

echo -e "${GREEN}16. Get Content Performance${NC}"
echo "curl -X GET \"$BASE_URL/api/analytics/content?period=7days\" \\"
echo "  -H \"Authorization: Bearer $TEST_TOKEN\""
echo ""

echo -e "${GREEN}17. Get Engagement Metrics${NC}"
echo "curl -X GET $BASE_URL/api/analytics/engagement \\"
echo "  -H \"Authorization: Bearer $TEST_TOKEN\""
echo ""

echo -e "${BLUE}=== Admin APIs ===${NC}"
echo ""

echo -e "${GREEN}18. Get All Advisors (Admin)${NC}"
echo "curl -X GET \"$BASE_URL/api/admin/advisors?status=active&limit=20\" \\"
echo "  -H \"Authorization: Bearer $TEST_TOKEN\" \\"
echo "  -H \"X-Admin-Key: admin-secret-key\""
echo ""

echo -e "${GREEN}19. Review Content (Admin)${NC}"
echo "curl -X PUT $BASE_URL/api/admin/content/review \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer $TEST_TOKEN\" \\"
echo "  -H \"X-Admin-Key: admin-secret-key\" \\"
echo "  -d '{"
echo "    \"contentId\": \"content-123\","
echo "    \"action\": \"approve\","
echo "    \"feedback\": \"Content meets all SEBI guidelines\""
echo "  }'"
echo ""

echo -e "${GREEN}20. Get System Health (Admin)${NC}"
echo "curl -X GET $BASE_URL/api/admin/health \\"
echo "  -H \"Authorization: Bearer $TEST_TOKEN\" \\"
echo "  -H \"X-Admin-Key: admin-secret-key\""
echo ""

echo -e "${BLUE}=== Utility APIs ===${NC}"
echo ""

echo -e "${GREEN}21. Health Check${NC}"
echo "curl -X GET $BASE_URL/api/health"
echo ""

echo -e "${GREEN}22. Get Specializations List${NC}"
echo "curl -X GET $BASE_URL/api/utils/specializations"
echo ""

echo -e "${GREEN}23. Get Supported Languages${NC}"
echo "curl -X GET $BASE_URL/api/utils/languages"
echo ""

echo -e "${GREEN}24. Validate SEBI Registration${NC}"
echo "curl -X POST $BASE_URL/api/utils/validate-registration \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"registrationNumber\": \"E123456\", \"type\": \"EUIN\"}'"
echo ""

echo "========================================="
echo -e "${YELLOW}📝 Notes:${NC}"
echo "1. Replace $TEST_TOKEN with actual JWT token from Clerk"
echo "2. For file uploads, replace /path/to/file with actual file paths"
echo "3. Admin APIs require admin privileges"
echo "4. All timestamps are in UTC (IST = UTC + 5:30)"
echo "5. Use jq for pretty JSON output: curl ... | jq '.'"
echo "========================================="
echo ""
echo -e "${GREEN}✅ API testing commands generated!${NC}"
echo "Save these commands or pipe to a file:"
echo "  ./generate-api-tests.sh > api-tests.txt"
echo ""