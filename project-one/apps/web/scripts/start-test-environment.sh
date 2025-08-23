#!/bin/bash

# Start Complete Test Environment for Jarvish
# Opens multiple terminal tabs/windows for comprehensive testing

echo "🚀 Starting Jarvish Test Environment..."
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

# Function to open new terminal based on OS
open_terminal() {
    local title="$1"
    local command="$2"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS - Use Terminal app with AppleScript
        osascript <<EOF
tell application "Terminal"
    do script "cd $PROJECT_DIR && echo '🔷 $title' && echo '==================' && $command"
    set current settings of selected tab of window 1 to settings set "Basic"
end tell
EOF
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux - Use gnome-terminal or xterm
        if command -v gnome-terminal &> /dev/null; then
            gnome-terminal --tab --title="$title" -- bash -c "cd $PROJECT_DIR && echo '🔷 $title' && $command; exec bash"
        elif command -v xterm &> /dev/null; then
            xterm -title "$title" -e "cd $PROJECT_DIR && echo '🔷 $title' && $command; bash" &
        fi
    fi
}

echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"
echo "--------------------------------------"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi
echo "✅ Node.js: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi
echo "✅ npm: $(npm -v)"

# Check if dev server is already running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Dev server already running on port 3000"
    DEV_SERVER_RUNNING=true
else
    echo "⚠️  Dev server not running, will start it"
    DEV_SERVER_RUNNING=false
fi

echo ""
echo -e "${BLUE}Step 2: Opening test terminals...${NC}"
echo "--------------------------------------"

# Terminal 1: Dev Server (if not running)
if [ "$DEV_SERVER_RUNNING" = false ]; then
    echo "📱 Opening Terminal 1: Development Server"
    open_terminal "Dev Server" "npm run dev"
    sleep 3
else
    echo "📱 Skipping Terminal 1: Dev server already running"
fi

# Terminal 2: Test Runner
echo "🧪 Opening Terminal 2: Test Runner"
open_terminal "Test Runner" "npm test -- --watchAll"
sleep 1

# Terminal 3: Database Seeder
echo "🌱 Opening Terminal 3: Database Seeder & REPL"
open_terminal "Database Tools" "echo 'Run: npm run seed:test to seed test data' && echo 'Then: node to open REPL for database queries' && bash"
sleep 1

# Terminal 4: API Testing
echo "🔌 Opening Terminal 4: API Testing"
open_terminal "API Testing" "./scripts/generate-api-tests.sh && echo '' && echo 'API test commands generated above. Copy and run them!' && bash"
sleep 1

# Terminal 5: Visual Testing
echo "🎨 Opening Terminal 5: Visual Testing"
open_terminal "Visual Testing" "echo 'Run visual tests:' && echo '  npm run test:puppeteer' && echo '  npm run test:visual' && echo '  npm run test:a11y' && bash"
sleep 1

echo ""
echo -e "${BLUE}Step 3: Browser Setup...${NC}"
echo "--------------------------------------"

# Wait for dev server to be ready
if [ "$DEV_SERVER_RUNNING" = false ]; then
    echo "⏳ Waiting for dev server to start..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null; then
            echo "✅ Dev server is ready!"
            break
        fi
        sleep 1
        echo -n "."
    done
    echo ""
fi

# Open browser with key pages
echo "🌐 Opening browser with test pages..."
sleep 2

# Function to open URL in default browser
open_url() {
    local url="$1"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "$url"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open "$url"
    fi
}

# Open key pages in browser tabs
open_url "http://localhost:3000" # Landing page
sleep 0.5
open_url "http://localhost:3000/admin" # Admin dashboard
sleep 0.5
open_url "http://localhost:3000/advisor/dashboard" # Advisor dashboard
sleep 0.5
open_url "http://localhost:3000/auth/signin" # Sign in page

echo ""
echo "======================================"
echo -e "${GREEN}✅ Test Environment Setup Complete!${NC}"
echo "======================================"
echo ""
echo -e "${YELLOW}📋 Quick Reference:${NC}"
echo "--------------------------------------"
echo "Terminal 1: Dev Server (http://localhost:3000)"
echo "Terminal 2: Test Runner (Jest watch mode)"
echo "Terminal 3: Database Tools (Seeder & REPL)"
echo "Terminal 4: API Testing (cURL commands)"
echo "Terminal 5: Visual Testing (Puppeteer)"
echo ""
echo -e "${YELLOW}🔑 Test Credentials:${NC}"
echo "--------------------------------------"
echo "Email: rajesh.kumar@wealthadvisors.in"
echo "Password: Test@123"
echo "OTP: 123456 (for testing)"
echo ""
echo -e "${YELLOW}🎯 Testing Checklist:${NC}"
echo "--------------------------------------"
echo "[ ] Landing page loads correctly"
echo "[ ] Sign up flow works"
echo "[ ] Email verification works"
echo "[ ] Mobile OTP verification works"
echo "[ ] Profile completion works"
echo "[ ] Admin dashboard accessible"
echo "[ ] Advisor dashboard functional"
echo "[ ] Content generation works"
echo "[ ] Compliance checking works"
echo "[ ] API endpoints respond correctly"
echo ""
echo -e "${GREEN}Happy Testing! 🚀${NC}"
echo ""
echo "To stop all services, use: killall node"
echo ""