const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const http = require('http');
const { Server } = require('socket.io');

// Mock data for demo (no database required)
const mockUsers = [];
const mockProjects = [];
const mockDeployments = [];

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

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
  limits: { fileSize: 50 * 1024 * 1024 }
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'ntando-computer-demo-secret';

// Mock user data
const demoUser = {
  id: 'demo-user-123',
  email: 'demo@ntandocomputer.com',
  name: 'Demo User'
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Demo login (no password required for demo)
app.post('/api/auth/login', async (req, res) => {
  const token = jwt.sign({ userId: demoUser.id, email: demoUser.email }, JWT_SECRET, { expiresIn: '24h' });
  
  res.json({ 
    message: 'Demo login successful', 
    token, 
    user: demoUser
  });
});

// File upload and deployment
app.post('/api/deploy', upload.array('files', 100), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { projectName, description } = req.body;
    const uploadDir = req.files[0].destination;
    const projectId = uuidv4();
    const deploymentId = uuidv4();

    // Create mock project
    const project = {
      id: projectId,
      name: projectName || `Project-${Date.now()}`,
      description: description || '',
      userId: demoUser.id,
      status: 'BUILDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockProjects.push(project);

    // Create mock deployment
    const deployment = {
      id: deploymentId,
      projectId: projectId,
      userId: demoUser.id,
      status: 'PROCESSING',
      files: JSON.stringify(req.files.map(f => ({ name: f.originalname, size: f.size }))),
      createdAt: new Date().toISOString()
    };
    mockDeployments.push(deployment);

    // Start simulated deployment
    simulateDeployment(projectId, deploymentId, uploadDir, projectName);

    res.json({
      message: 'Files uploaded successfully. Deployment started.',
      projectId,
      deploymentId,
      files: req.files.map(f => ({ name: f.originalname, size: f.size }))
    });

  } catch (error) {
    console.error('Deployment error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Get user projects
app.get('/api/projects', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    
    const userProjects = mockProjects.filter(p => p.userId === demoUser.id);
    res.json(userProjects);
  });
});

// Get project details
app.get('/api/projects/:id', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    
    const project = mockProjects.find(p => p.id === req.params.id && p.userId === demoUser.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const deployments = mockDeployments.filter(d => d.projectId === project.id);
    res.json({ ...project, deployments });
  });
});

// Get deployment status
app.get('/api/deployments/:id', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    
    const deployment = mockDeployments.find(d => d.id === req.params.id && d.userId === demoUser.id);
    
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    res.json(deployment);
  });
});

// Simulated deployment function
async function simulateDeployment(projectId, deploymentId, uploadDir, projectName) {
  try {
    // Update deployment status
    const deployment = mockDeployments.find(d => d.id === deploymentId);
    if (deployment) {
      deployment.status = 'BUILDING';
      
      io.emit('deployment-status', {
        projectId,
        deploymentId,
        status: 'BUILDING',
        message: 'Building deployment package...'
      });
    }

    // Simulate build process
    setTimeout(() => {
      if (deployment) {
        deployment.status = 'SUCCESS';
        deployment.url = `https://${projectId}.onrender.com`;
        deployment.completedAt = new Date().toISOString();
        
        // Update project status
        const project = mockProjects.find(p => p.id === projectId);
        if (project) {
          project.status = 'DEPLOYED';
          project.url = deployment.url;
          project.updatedAt = new Date().toISOString();
        }
        
        io.emit('deployment-status', {
          projectId,
          deploymentId,
          status: 'SUCCESS',
          message: 'Deployment completed successfully!',
          url: deployment.url
        });
      }
    }, 3000); // Simulate 3-second build time

  } catch (error) {
    console.error('Deployment simulation error:', error);
    
    if (deployment) {
      deployment.status = 'FAILED';
      deployment.error = error.message;
      deployment.completedAt = new Date().toISOString();
      
      io.emit('deployment-status', {
        projectId,
        deploymentId,
        status: 'FAILED',
        message: 'Deployment failed: ' + error.message
      });
    }
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

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Ntando Computer Demo Server running on port ${PORT}`);
  console.log(`📱 Access the demo at: http://localhost:${PORT}`);
  console.log(`🔧 Health check: http://localhost:${PORT}/api/health`);
  console.log(`👤 Demo login credentials:`);
  console.log(`   Email: demo@ntandocomputer.com`);
  console.log(`   Password: (any password works for demo)`);
});

console.log(`
🎉 Ntando Computer Demo Started! 🎉

This is a demonstration version of Ntando Computer with:
✅ Full frontend interface
✅ File upload functionality  
✅ Simulated deployment process
✅ Real-time status updates
✅ Project management

To test the deployment:
1. Open http://localhost:3000 in your browser
2. Click "Deploy New Website"
3. Upload files from the examples/sample-website/ folder
4. Watch the simulated deployment process!

🚀 Ready to deploy websites with one click! 🚀
`);