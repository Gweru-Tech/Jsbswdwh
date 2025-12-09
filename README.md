# Ntando Computer - One-Click Website Deployment System

![Ntando Computer Logo](https://via.placeholder.com/150x50/667eea/ffffff?text=Ntando+Computer)

Ntando Computer is a revolutionary web application that allows you to deploy HTML files and websites with just one click. Built with modern web technologies and optimized for Render.com deployment, it provides a seamless experience for developers and non-technical users alike.

## 🚀 Features

### Core Features
- **One-Click Deployment**: Deploy HTML, CSS, JavaScript files instantly
- **File Upload Support**: Drag-and-drop interface for easy file uploads
- **Real-time Deployment Status**: Live updates during deployment process
- **Project Management**: Organize and track all your deployments
- **User Authentication**: Secure login and registration system
- **Render.com Integration**: Automatic deployment to Render.com infrastructure

### Advanced Features
- **Custom Domain Support**: Connect your own domains
- **SSL Certificate Management**: Automatic HTTPS configuration
- **Deployment History**: Track all past deployments and versions
- **Analytics Dashboard**: Monitor website performance and traffic
- **GitHub Integration**: Optional repository creation and management
- **Responsive Design**: Works perfectly on desktop and mobile devices

## 🛠️ Technology Stack

### Frontend
- **React.js**: Modern, component-based UI framework
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Socket.IO**: Real-time communication for deployment updates
- **Axios**: HTTP client for API communication

### Backend
- **Node.js**: JavaScript runtime for server-side development
- **Express.js**: Fast, minimalist web framework
- **Prisma**: Modern database toolkit and ORM
- **PostgreSQL**: Reliable, scalable database
- **JWT**: Secure authentication tokens
- **Multer**: File upload handling

### Deployment
- **Render.com**: Cloud platform for web applications
- **Docker**: Containerization for consistent deployments
- **GitHub**: Version control and CI/CD integration

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+**: JavaScript runtime
- **npm 8+**: Package manager
- **PostgreSQL**: Database (can be provided by Render.com)
- **Git**: Version control
- **Render Account**: For cloud deployment (free tier available)

## 🚀 Quick Start

### Option 1: Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ntando-computer.git
   cd ntando-computer
   ```

2. **Run the setup script**
   ```bash
   ./scripts/setup.sh
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

### Option 2: One-Click Deploy to Render

1. **Fork this repository** on GitHub
2. **Connect your GitHub account** to Render.com
3. **Create a new web service** on Render.com
4. **Choose your forked repository**
5. **Render will automatically detect and deploy** the application

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/ntando_computer"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Render.com API Configuration
RENDER_API_KEY="your-render-api-key"

# GitHub Configuration (optional)
GITHUB_TOKEN="your-github-token"

# Application Configuration
NODE_ENV="development"
PORT=3000

# File Upload Configuration
MAX_FILE_SIZE="52428800" # 50MB in bytes
UPLOAD_DIR="uploads"
```

### Database Setup

1. **Install Prisma CLI**
   ```bash
   npm install -g prisma
   ```

2. **Generate Prisma client**
   ```bash
   npx prisma generate
   ```

3. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

## 📖 Usage Guide

### 1. Register/Login
- Open the application in your browser
- Create a new account or login with existing credentials
- Access the dashboard to manage your deployments

### 2. Deploy a Website
- Click "Deploy New Website" from the dashboard
- Enter project name and description
- Upload your HTML, CSS, and JavaScript files
- Click "Deploy Now" to start the deployment process
- Monitor real-time deployment progress

### 3. Manage Projects
- View all your projects from the Projects page
- Track deployment status and history
- Access live deployment URLs
- Monitor website performance

### 4. Advanced Features
- Configure custom domains from project settings
- Set up SSL certificates automatically
- Integrate with GitHub repositories
- Analyze website traffic and performance

## 🚀 Deployment to Render.com

### Automatic Deployment

The easiest way to deploy is using the automated Render.com integration:

1. **Push your code to GitHub**
2. **Connect Render.com to your GitHub account**
3. **Create a new web service**
4. **Render automatically detects and deploys your application**

### Manual Deployment

For more control over the deployment process:

1. **Install Render CLI**
   ```bash
   npm install -g render-cli
   ```

2. **Login to Render**
   ```bash
   render login
   ```

3. **Deploy using the script**
   ```bash
   ./scripts/deploy.sh
   ```

### Render.com Configuration

The application includes a `render.yaml` configuration file that automatically sets up:

- **Web Service**: Node.js application with automatic builds
- **Database**: PostgreSQL instance
- **Environment Variables**: Secure configuration management
- **Health Checks**: Automatic monitoring and restarts
- **SSL Certificates**: Free HTTPS certificates
- **Custom Domains**: Easy domain configuration

## 🔧 Development

### Project Structure

```
ntando-computer/
├── public/                 # Frontend static files
│   ├── index.html         # Main HTML file
│   ├── app.js            # Frontend JavaScript
│   └── styles/           # CSS files (if any)
├── prisma/               # Database schema and migrations
│   └── schema.prisma     # Prisma schema definition
├── scripts/              # Utility scripts
│   ├── setup.sh         # Local development setup
│   └── deploy.sh        # Deployment script
├── uploads/              # Temporary file uploads
├── deployments/          # Deployment packages
├── server.js            # Main server file
├── package.json         # Dependencies and scripts
├── Dockerfile           # Docker configuration
├── render.yaml          # Render.com configuration
└── README.md           # This file
```

### Available Scripts

- `npm start`: Start the production server
- `npm run dev`: Start the development server with hot reload
- `npm run build`: Build the application for production
- `npm run setup-db`: Set up the database with migrations
- `./scripts/setup.sh`: Full development environment setup
- `./scripts/deploy.sh`: Deploy to Render.com

### Adding New Features

1. **Backend Changes**:
   - Modify `server.js` for API endpoints
   - Update `prisma/schema.prisma` for database changes
   - Run `npx prisma migrate dev` for database updates

2. **Frontend Changes**:
   - Edit `public/app.js` for JavaScript functionality
   - Update `public/index.html` for UI changes
   - Add new pages by updating the view system

3. **Database Changes**:
   - Modify the Prisma schema
   - Generate migration: `npx prisma migrate dev --name your-migration`
   - Generate client: `npx prisma generate`

## 🔒 Security

### Authentication
- JWT-based authentication system
- Secure password hashing with bcrypt
- Session management with expiration
- Protected API endpoints

### File Security
- File type validation and restrictions
- File size limits to prevent abuse
- Secure file storage with access controls
- Automatic cleanup of temporary files

### Deployment Security
- Environment variable encryption
- HTTPS by default on Render.com
- CORS configuration for API security
- SQL injection prevention with Prisma

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify `DATABASE_URL` is correct
   - Check if PostgreSQL is running
   - Ensure database credentials are valid

2. **File Upload Failures**
   - Check file size limits (50MB default)
   - Verify file types are supported
   - Ensure upload directory permissions

3. **Deployment Issues**
   - Check Render.com service logs
   - Verify environment variables are set
   - Ensure build completes successfully

4. **Authentication Problems**
   - Clear browser cookies and localStorage
   - Verify JWT_SECRET is set correctly
   - Check API endpoint accessibility

### Getting Help

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs on GitHub Issues
- **Community**: Join our Discord server for support
- **Email**: Contact support@ntandocomputer.com

## 📝 API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "User Name"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Deployment Endpoints

#### POST /api/deploy
Upload files and start deployment.

**Headers:**
- `Authorization: Bearer <jwt-token>`

**Request:**
- `multipart/form-data` with files and project metadata

#### GET /api/projects
Get all user projects.

**Headers:**
- `Authorization: Bearer <jwt-token>`

#### GET /api/projects/:id
Get specific project details.

**Headers:**
- `Authorization: Bearer <jwt-token>`

## 🤝 Contributing

We welcome contributions to Ntando Computer! Here's how you can help:

### Development Setup

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests**
   ```bash
   npm test
   ```
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Contribution Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting
- Be descriptive in your pull requests

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Render.com**: For providing excellent deployment infrastructure
- **Prisma**: For the amazing database toolkit
- **React.js**: For the powerful frontend framework
- **Tailwind CSS**: For the beautiful utility-first CSS framework
- **Open Source Community**: For inspiration and collaboration

## 📞 Support

- **Email**: support@ntandocomputer.com
- **Discord**: [Join our Discord](https://discord.gg/ntando)
- **Twitter**: [@NtandoComputer](https://twitter.com/NtandoComputer)
- **Documentation**: [docs.ntandocomputer.com](https://docs.ntandocomputer.com)

---

**Made with ❤️ by the Ntando Computer Team**

Deploy your websites with confidence and style! 🚀