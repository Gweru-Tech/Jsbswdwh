# Ntando Computer - System Architecture

## Overview
Ntando Computer is a one-click website deployment platform that simplifies the process of deploying HTML files and websites to production. The system integrates with Render.com for seamless deployment management.

## Core Components

### 1. Frontend (React.js)
- **Dashboard**: Main interface for managing deployments
- **File Upload Component**: Drag-and-drop file upload system
- **Deployment Manager**: Interface for monitoring and controlling deployments
- **Settings Panel**: Configuration for custom domains, SSL, etc.

### 2. Backend (Node.js/Express)
- **File Management API**: Handle file uploads, processing, and storage
- **Deployment API**: Interface with Render.com API for deployments
- **Authentication System**: User management and security
- **Database Integration**: Store deployment history and user data

### 3. Database (PostgreSQL)
- **Users Table**: User authentication and preferences
- **Deployments Table**: Track all deployment activities
- **Projects Table**: Project metadata and configurations
- **Files Table**: File management and versioning

### 4. External Integrations
- **Render.com API**: Automated deployment and service management
- **GitHub API**: Repository creation and management
- **DNS Providers**: Custom domain configuration

## Technical Stack
- **Frontend**: React.js, Tailwind CSS, Axios
- **Backend**: Node.js, Express.js, Multer (file uploads)
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Docker, Render.com
- **Authentication**: JWT tokens
- **File Storage**: Local storage with backup to cloud

## Deployment Workflow
1. User uploads HTML/CSS/JS files
2. System processes and validates files
3. Creates/updates GitHub repository
4. Triggers Render.com deployment
5. Provides deployment URL and status
6. Monitors deployment health and provides analytics

## Render.com Configuration
- **Web Service**: Main application
- **Database**: PostgreSQL instance
- **Environment Variables**: API keys and configurations
- **Build Command**: npm run build
- **Start Command**: npm start