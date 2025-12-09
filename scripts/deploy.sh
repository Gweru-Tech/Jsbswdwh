#!/bin/bash

# Ntando Computer - Deployment Script
# This script automates the deployment process to Render.com

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if Render CLI is installed
check_render_cli() {
    if ! command -v render &> /dev/null; then
        print_error "Render CLI is not installed. Please install it first:"
        echo "npm install -g render-cli"
        exit 1
    fi
}

# Check if user is logged in to Render
check_render_auth() {
    if ! render whoami &> /dev/null; then
        print_error "You are not logged in to Render. Please run:"
        echo "render login"
        exit 1
    fi
}

# Validate environment variables
validate_env() {
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from template..."
        cp .env.example .env
        print_warning "Please edit .env file with your configuration before proceeding."
        exit 1
    fi

    # Check required environment variables
    source .env
    
    if [ -z "$DATABASE_URL" ] || [ -z "$JWT_SECRET" ]; then
        print_error "Please set DATABASE_URL and JWT_SECRET in .env file"
        exit 1
    fi
}

# Deploy to Render
deploy_to_render() {
    print_status "Starting deployment to Render.com..."
    
    # Deploy using render.yaml
    render deploy --confirm
    
    if [ $? -eq 0 ]; then
        print_status "Deployment successful!"
        print_status "Your Ntando Computer is now live on Render.com"
    else
        print_error "Deployment failed. Please check the logs above."
        exit 1
    fi
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    # Wait for database to be ready
    sleep 10
    
    # Run database migrations
    npx prisma migrate deploy
    
    if [ $? -eq 0 ]; then
        print_status "Database setup completed!"
    else
        print_error "Database setup failed."
        exit 1
    fi
}

# Main deployment flow
main() {
    print_status "Ntando Computer Deployment Script"
    print_status "=================================="
    
    check_render_cli
    check_render_auth
    validate_env
    
    print_status "All checks passed. Starting deployment..."
    
    deploy_to_render
    setup_database
    
    print_status "Deployment completed successfully!"
    print_status "Please visit your Render dashboard to see your deployed application."
}

# Run main function
main "$@"