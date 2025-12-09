#!/bin/bash

# Ntando Computer - Local Setup Script
# This script sets up the development environment

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

# Check Node.js version
check_node() {
    print_status "Checking Node.js version..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        echo "Visit: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_status "Node.js version check passed: $(node -v)"
}

# Check npm
check_npm() {
    print_status "Checking npm..."
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed."
        exit 1
    fi
    
    print_status "npm version check passed: $(npm -v)"
}

# Install dependencies
install_dependencies() {
    print_status "Installing Node.js dependencies..."
    npm install
    
    if [ $? -eq 0 ]; then
        print_status "Dependencies installed successfully!"
    else
        print_error "Failed to install dependencies."
        exit 1
    fi
}

# Setup Prisma
setup_prisma() {
    print_status "Setting up Prisma..."
    
    # Generate Prisma client
    npx prisma generate
    
    if [ $? -eq 0 ]; then
        print_status "Prisma client generated successfully!"
    else
        print_error "Failed to generate Prisma client."
        exit 1
    fi
}

# Setup environment
setup_env() {
    print_status "Setting up environment..."
    
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from template..."
        cp .env.example .env
        print_warning "Please edit .env file with your configuration:"
        echo "- DATABASE_URL: Your PostgreSQL connection string"
        echo "- JWT_SECRET: A secure secret key for JWT tokens"
        echo "- Other optional configurations as needed"
    else
        print_status ".env file already exists."
    fi
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p uploads
    mkdir -p deployments
    mkdir -p temp
    mkdir -p logs
    
    print_status "Directories created successfully!"
}

# Setup database (optional)
setup_database() {
    if [ -f ".env" ]; then
        print_status "Attempting to setup database..."
        
        # Check if DATABASE_URL is set
        if grep -q "DATABASE_URL=" .env && ! grep -q "DATABASE_URL=.*username:password" .env; then
            print_status "Running database migrations..."
            npx prisma migrate dev --name init || true
            print_status "Database setup completed!"
        else
            print_warning "DATABASE_URL not configured. Skipping database setup."
        fi
    fi
}

# Start development server
start_dev_server() {
    print_status "Starting development server..."
    print_status "Server will be available at: http://localhost:3000"
    print_status "Press Ctrl+C to stop the server"
    echo ""
    
    npm run dev
}

# Show usage information
show_usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --dev     Start development server after setup"
    echo "  --help    Show this help message"
    echo ""
    echo "Default: Run setup only"
}

# Main setup function
main() {
    print_header "Ntando Computer Setup"
    
    # Parse command line arguments
    START_DEV=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dev)
                START_DEV=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    check_node
    check_npm
    install_dependencies
    setup_prisma
    setup_env
    create_directories
    setup_database
    
    print_header "Setup Complete!"
    print_status "Ntando Computer has been set up successfully!"
    print_status ""
    print_status "Next steps:"
    echo "1. Edit .env file with your configuration"
    echo "2. Run 'npm run dev' to start the development server"
    echo "3. Visit http://localhost:3000 to access the application"
    echo "4. Use './scripts/deploy.sh' to deploy to Render.com"
    
    if [ "$START_DEV" = true ]; then
        echo ""
        start_dev_server
    fi
}

# Run main function with all arguments
main "$@"