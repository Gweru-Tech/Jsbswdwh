const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const archiver = require('archiver');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Create necessary directories
fs.ensureDirSync('uploads');
fs.ensureDirSync('deployments');
fs.ensureDirSync('temp');

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = `uploads/${uuidv4()}`;
    fs.ensureDirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.html', '.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only HTML, CSS, JS, images and JSON files are allowed.'));
    }
  }
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'ntando-computer-secret-key';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// User registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email
      }
    });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ 
      message: 'User created successfully', 
      token, 
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ 
      message: 'Login successful', 
      token, 
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// File upload and deployment
app.post('/api/deploy', authenticateToken, upload.array('files', 100), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { projectName, description } = req.body;
    const uploadDir = req.files[0].destination;
    const projectId = uuidv4();

    // Create project record
    const project = await prisma.project.create({
      data: {
        id: projectId,
        name: projectName || `Project-${Date.now()}`,
        description: description || '',
        userId: req.user.userId,
        status: 'UPLOADING'
      }
    });

    // Process uploaded files
    const files = [];
    for (const file of req.files) {
      files.push({
        name: file.originalname,
        path: file.path,
        size: file.size,
        type: file.mimetype
      });
    }

    // Create deployment record
    const deployment = await prisma.deployment.create({
      data: {
        id: uuidv4(),
        projectId: projectId,
        userId: req.user.userId,
        status: 'PROCESSING',
        files: JSON.stringify(files)
      }
    });

    // Start deployment process in background
    processDeployment(projectId, deployment.id, uploadDir, projectName);

    res.json({
      message: 'Files uploaded successfully. Deployment started.',
      projectId,
      deploymentId: deployment.id,
      files: files.map(f => ({ name: f.name, size: f.size }))
    });

  } catch (error) {
    console.error('Deployment error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Get user projects
app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user.userId },
      include: {
        deployments: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get project details
app.get('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: { 
        id: req.params.id, 
        userId: req.user.userId 
      },
      include: {
        deployments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get deployment status
app.get('/api/deployments/:id', authenticateToken, async (req, res) => {
  try {
    const deployment = await prisma.deployment.findFirst({
      where: { 
        id: req.params.id, 
        userId: req.user.userId 
      }
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    res.json(deployment);
  } catch (error) {
    console.error('Get deployment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Deployment processing function
async function processDeployment(projectId, deploymentId, uploadDir, projectName) {
  try {
    // Update deployment status
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: { status: 'BUILDING' }
    });

    // Notify clients
    io.emit('deployment-status', {
      projectId,
      deploymentId,
      status: 'BUILDING',
      message: 'Building deployment package...'
    });

    // Create deployment package
    const packagePath = `deployments/${projectId}`;
    await fs.ensureDir(packagePath);
    
    // Copy files to deployment directory
    await fs.copy(uploadDir, path.join(packagePath, 'public'));

    // Create a simple index.html if not present
    const publicDir = path.join(packagePath, 'public');
    const indexPath = path.join(publicDir, 'index.html');
    
    if (!await fs.pathExists(indexPath)) {
      const files = await fs.readdir(publicDir);
      const htmlFiles = files.filter(f => f.endsWith('.html'));
      
      if (htmlFiles.length > 0) {
        await fs.copy(path.join(publicDir, htmlFiles[0]), indexPath);
      } else {
        // Create default index.html
        const defaultHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName || 'My Website'}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>Welcome to ${projectName || 'Your Website'}</h1>
    <p>Your website has been successfully deployed!</p>
</body>
</html>`;
        await fs.writeFile(indexPath, defaultHtml);
      }
    }

    // Update deployment status to success
    const deploymentUrl = `https://${projectId}.onrender.com`;
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: { 
        status: 'SUCCESS',
        url: deploymentUrl,
        completedAt: new Date()
      }
    });

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: { 
        status: 'DEPLOYED',
        url: deploymentUrl
      }
    });

    // Notify clients of success
    io.emit('deployment-status', {
      projectId,
      deploymentId,
      status: 'SUCCESS',
      message: 'Deployment completed successfully!',
      url: deploymentUrl
    });

  } catch (error) {
    console.error('Deployment processing error:', error);
    
    // Update deployment status to failed
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: { 
        status: 'FAILED',
        error: error.message,
        completedAt: new Date()
      }
    });

    // Notify clients of failure
    io.emit('deployment-status', {
      projectId,
      deploymentId,
      status: 'FAILED',
      message: 'Deployment failed: ' + error.message
    });
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-deployment', (deploymentId) => {
    socket.join(`deployment-${deploymentId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
    
    server.listen(PORT, () => {
      console.log(`Ntando Computer server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});