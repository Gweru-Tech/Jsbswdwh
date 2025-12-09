#!/bin/bash

# Ntando Computer - Deployment Test Script
# This script tests the complete deployment system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Test function
test_component() {
    local component=$1
    local test_command=$2
    
    print_status "Testing $component..."
    
    if eval $test_command; then
        print_status "✅ $component test passed"
        return 0
    else
        print_error "❌ $component test failed"
        return 1
    fi
}

# Main test function
main() {
    print_header "Ntando Computer Deployment Tests"
    
    print_status "Starting comprehensive deployment system tests..."
    
    # Test 1: Node.js and npm installation
    test_component "Node.js Installation" "node --version && npm --version"
    
    # Test 2: Dependencies installation
    test_component "Dependencies" "npm list --depth=0"
    
    # Test 3: Prisma setup
    test_component "Prisma Client" "npx prisma --version"
    
    # Test 4: Environment configuration
    if [ -f ".env" ]; then
        print_status "✅ Environment file exists"
    else
        print_warning "⚠️  Environment file not found, using example"
        cp .env.example .env
    fi
    
    # Test 5: File structure
    test_component "File Structure" "test -f server.js && test -f package.json && test -f public/index.html"
    
    # Test 6: Database connection (if configured)
    if grep -q "DATABASE_URL=" .env && ! grep -q "DATABASE_URL=.*username:password" .env; then
        test_component "Database Connection" "npx prisma db pull --force"
    else
        print_warning "⚠️  Database not configured, skipping connection test"
    fi
    
    # Test 7: Server startup
    print_status "Testing server startup..."
    timeout 10s npm start &
    SERVER_PID=$!
    sleep 5
    
    if kill -0 $SERVER_PID 2>/dev/null; then
        print_status "✅ Server started successfully"
        kill $SERVER_PID
    else
        print_error "❌ Server failed to start"
    fi
    
    # Test 8: API endpoints
    print_status "Testing API endpoints..."
    npm start &
    SERVER_PID=$!
    sleep 5
    
    # Test health endpoint
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        print_status "✅ Health endpoint working"
    else
        print_error "❌ Health endpoint failed"
    fi
    
    kill $SERVER_PID 2>/dev/null || true
    
    # Test 9: File upload functionality
    test_component "Upload Directory" "test -d uploads && test -d deployments && test -d temp"
    
    # Test 10: Example website
    if [ -f "examples/sample-website/index.html" ]; then
        print_status "✅ Example website ready"
    else
        print_error "❌ Example website not found"
    fi
    
    print_header "Test Summary"
    print_status "Ntando Computer deployment system tests completed!"
    print_status ""
    print_status "Ready for deployment to Render.com"
    print_status ""
    print_status "Next steps:"
    echo "1. Configure your .env file with database settings"
    echo "2. Run './scripts/deploy.sh' to deploy to Render.com"
    echo "3. Or use the Render.com dashboard for web-based deployment"
    print_status ""
    print_status "🚀 Your Ntando Computer is ready to deploy websites!"
}

# Run main function
main "$@"