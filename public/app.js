// Ntando Computer - Frontend Application
class NtandoComputer {
    constructor() {
        this.apiBase = window.location.origin + '/api';
        this.token = localStorage.getItem('ntando_token');
        this.user = JSON.parse(localStorage.getItem('ntando_user') || '{}');
        this.socket = null;
        this.currentView = 'dashboard';
        this.uploadedFiles = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupSocketIO();
        
        if (this.token) {
            this.showDashboard();
            this.loadUserData();
        } else {
            this.showLogin();
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.target.getAttribute('href').substring(1);
                this.showView(view);
            });
        });

        // User menu
        document.getElementById('user-menu').addEventListener('click', () => {
            document.getElementById('user-dropdown').classList.toggle('hidden');
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // File upload
        const uploadZone = document.getElementById('upload-zone');
        const fileInput = document.getElementById('file-input');

        uploadZone.addEventListener('click', () => fileInput.click());
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });
        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            this.handleFileSelect(e.dataTransfer.files);
        });

        fileInput.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files);
        });

        // Deploy form
        document.getElementById('deploy-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.deployWebsite();
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#user-menu')) {
                document.getElementById('user-dropdown').classList.add('hidden');
            }
        });
    }

    setupSocketIO() {
        if (this.token) {
            this.socket = io(window.location.origin);
            
            this.socket.on('deployment-status', (data) => {
                this.updateDeploymentStatus(data);
            });
        }
    }

    handleFileSelect(files) {
        const fileList = document.getElementById('file-list');
        this.uploadedFiles = Array.from(files);
        
        if (this.uploadedFiles.length === 0) {
            fileList.innerHTML = '';
            return;
        }

        let html = '<div class="space-y-2">';
        this.uploadedFiles.forEach((file, index) => {
            const size = this.formatFileSize(file.size);
            html += `
                <div class="flex items-center justify-between bg-gray-50 p-3 rounded">
                    <div class="flex items-center">
                        <i class="fas fa-file-${this.getFileIcon(file.name)} text-gray-400 mr-2"></i>
                        <span class="text-sm text-gray-700">${file.name}</span>
                        <span class="text-xs text-gray-500 ml-2">(${size})</span>
                    </div>
                    <button type="button" onclick="app.removeFile(${index})" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        });
        html += '</div>';
        
        fileList.innerHTML = html;
    }

    removeFile(index) {
        this.uploadedFiles.splice(index, 1);
        const fileInput = document.getElementById('file-input');
        fileInput.value = '';
        this.handleFileSelect([]);
    }

    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const icons = {
            html: 'code',
            css: 'code',
            js: 'code',
            json: 'code',
            png: 'image',
            jpg: 'image',
            jpeg: 'image',
            gif: 'image',
            svg: 'image',
            ico: 'image'
        };
        return icons[ext] || 'alt';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async deployWebsite() {
        if (this.uploadedFiles.length === 0) {
            this.showToast('Please select files to upload', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('projectName', document.getElementById('project-name').value);
        formData.append('description', document.getElementById('project-description').value);
        
        this.uploadedFiles.forEach(file => {
            formData.append('files', file);
        });

        const deployBtn = document.getElementById('deploy-btn');
        deployBtn.disabled = true;
        deployBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Deploying...';

        try {
            const response = await axios.post(`${this.apiBase}/deploy`, formData, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            this.showToast('Deployment started successfully!', 'success');
            this.showDeploymentProgress(response.data.deploymentId);
            
            // Join deployment room for real-time updates
            if (this.socket) {
                this.socket.emit('join-deployment', response.data.deploymentId);
            }

        } catch (error) {
            console.error('Deployment error:', error);
            this.showToast(error.response?.data?.error || 'Deployment failed', 'error');
        } finally {
            deployBtn.disabled = false;
            deployBtn.innerHTML = '<i class="fas fa-rocket mr-2"></i>Deploy Now';
        }
    }

    showDeploymentProgress(deploymentId) {
        document.getElementById('deployment-progress').classList.remove('hidden');
        document.getElementById('deployment-progress').classList.add('slide-in');
        
        this.currentDeploymentId = deploymentId;
        this.updateProgressBar(10);
        this.addDeploymentLog('Initializing deployment...');
    }

    updateDeploymentStatus(data) {
        if (data.deploymentId !== this.currentDeploymentId) return;

        const statusElement = document.getElementById('deployment-status');
        const status = data.status;
        
        let statusText = data.message;
        let statusColor = 'text-blue-600';
        
        switch (status) {
            case 'BUILDING':
                statusColor = 'text-yellow-600';
                this.updateProgressBar(50);
                break;
            case 'SUCCESS':
                statusColor = 'text-green-600';
                this.updateProgressBar(100);
                statusText = `Deployment complete! Website: <a href="${data.url}" target="_blank" class="underline">${data.url}</a>`;
                this.addDeploymentLog('✅ ' + data.message);
                break;
            case 'FAILED':
                statusColor = 'text-red-600';
                statusText = '❌ ' + data.message;
                this.addDeploymentLog('❌ Deployment failed: ' + data.message);
                break;
        }
        
        statusElement.innerHTML = statusText;
        statusElement.className = `status-badge text-sm font-medium ${statusColor}`;
        this.addDeploymentLog(data.message);
    }

    updateProgressBar(percentage) {
        document.getElementById('progress-bar').style.width = percentage + '%';
    }

    addDeploymentLog(message) {
        const logElement = document.getElementById('deployment-log');
        const timestamp = new Date().toLocaleTimeString();
        logElement.innerHTML += `[${timestamp}] ${message}<br>`;
        logElement.scrollTop = logElement.scrollHeight;
    }

    async loadUserData() {
        try {
            await this.loadProjects();
            await this.loadDashboardStats();
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    async loadProjects() {
        try {
            const response = await axios.get(`${this.apiBase}/projects`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            this.projects = response.data;
            this.renderProjects();
            this.renderRecentProjects();
        } catch (error) {
            console.error('Error loading projects:', error);
            this.showToast('Failed to load projects', 'error');
        }
    }

    async loadDashboardStats() {
        try {
            const response = await axios.get(`${this.apiBase}/projects`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            const projects = response.data;
            const totalProjects = projects.length;
            const deployedProjects = projects.filter(p => p.status === 'DEPLOYED').length;
            const pendingProjects = projects.filter(p => ['UPLOADING', 'BUILDING'].includes(p.status)).length;
            
            document.getElementById('total-projects').textContent = totalProjects;
            document.getElementById('deployed-projects').textContent = deployedProjects;
            document.getElementById('pending-projects').textContent = pendingProjects;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    renderProjects() {
        const grid = document.getElementById('projects-grid');
        
        if (this.projects.length === 0) {
            grid.innerHTML = '<p class="col-span-full text-center text-gray-500">No projects yet. Deploy your first website!</p>';
            return;
        }

        grid.innerHTML = this.projects.map(project => `
            <div class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">${project.name}</h3>
                    <span class="status-badge px-2 py-1 text-xs font-medium rounded-full ${this.getStatusClass(project.status)}">
                        ${project.status}
                    </span>
                </div>
                <p class="text-gray-600 text-sm mb-4">${project.description || 'No description'}</p>
                <div class="flex items-center justify-between">
                    <span class="text-xs text-gray-500">${new Date(project.createdAt).toLocaleDateString()}</span>
                    ${project.url ? `
                        <a href="${project.url}" target="_blank" class="text-indigo-600 hover:text-indigo-500 text-sm">
                            <i class="fas fa-external-link-alt mr-1"></i>Visit
                        </a>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    renderRecentProjects() {
        const container = document.getElementById('recent-projects');
        const recentProjects = this.projects.slice(0, 3);
        
        if (recentProjects.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center">No projects yet. Deploy your first website!</p>';
            return;
        }

        container.innerHTML = `
            <div class="space-y-4">
                ${recentProjects.map(project => `
                    <div class="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div>
                            <h4 class="font-medium text-gray-900">${project.name}</h4>
                            <p class="text-sm text-gray-500">${new Date(project.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="px-2 py-1 text-xs font-medium rounded-full ${this.getStatusClass(project.status)}">
                                ${project.status}
                            </span>
                            ${project.url ? `
                                <a href="${project.url}" target="_blank" class="text-indigo-600 hover:text-indigo-500">
                                    <i class="fas fa-external-link-alt"></i>
                                </a>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
            ${this.projects.length > 3 ? `
                <div class="mt-4 text-center">
                    <button onclick="app.showView('projects')" class="text-indigo-600 hover:text-indigo-500 text-sm">
                        View all projects →
                    </button>
                </div>
            ` : ''}
        `;
    }

    getStatusClass(status) {
        const classes = {
            'DEPLOYED': 'bg-green-100 text-green-800',
            'BUILDING': 'bg-yellow-100 text-yellow-800',
            'UPLOADING': 'bg-blue-100 text-blue-800',
            'FAILED': 'bg-red-100 text-red-800',
            'CREATED': 'bg-gray-100 text-gray-800'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    }

    showView(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.add('hidden');
        });
        
        // Show selected view
        document.getElementById(`${viewName}-view`).classList.remove('hidden');
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('border-indigo-500', 'text-gray-900');
            link.classList.add('border-transparent', 'text-gray-500');
        });
        
        const activeLink = document.querySelector(`[href="#${viewName}"]`);
        if (activeLink) {
            activeLink.classList.remove('border-transparent', 'text-gray-500');
            activeLink.classList.add('border-indigo-500', 'text-gray-900');
        }
        
        this.currentView = viewName;
    }

    showDashboard() {
        this.showView('dashboard');
        if (this.token) {
            this.loadUserData();
        }
    }

    showDeployView() {
        this.showView('deploy');
        // Reset form
        document.getElementById('deploy-form').reset();
        document.getElementById('file-list').innerHTML = '';
        document.getElementById('deployment-progress').classList.add('hidden');
        this.uploadedFiles = [];
    }

    showProjectsView() {
        this.showView('projects');
    }

    showLogin() {
        document.getElementById('main-content').classList.add('hidden');
        document.getElementById('login-modal').classList.remove('hidden');
    }

    showRegister() {
        // Switch to register form (for simplicity, we'll use login for both)
        const loginForm = document.getElementById('login-form');
        loginForm.innerHTML = `
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input type="text" id="register-name" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Your Name">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input type="email" id="register-email" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="your@email.com">
            </div>
            <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input type="password" id="register-password" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="••••••••">
            </div>
            <button onclick="app.register()" class="w-full gradient-bg text-white font-medium py-2 px-4 rounded-md hover:opacity-90 transition">
                Sign Up
            </button>
        `;
        
        document.querySelector('.mt-4 text-center button').onclick = () => this.showLogin();
        document.querySelector('.mt-4 text-center button').textContent = 'Already have an account? Login';
    }

    async login() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        try {
            const response = await axios.post(`${this.apiBase}/auth/login`, {
                email,
                password
            });

            this.token = response.data.token;
            this.user = response.data.user;
            
            localStorage.setItem('ntando_token', this.token);
            localStorage.setItem('ntando_user', JSON.stringify(this.user));
            
            document.getElementById('user-initial').textContent = this.user.name.charAt(0).toUpperCase();
            
            this.showToast('Login successful!', 'success');
            this.hideLoginModal();
            this.showDashboard();
            this.setupSocketIO();
            
        } catch (error) {
            console.error('Login error:', error);
            this.showToast(error.response?.data?.error || 'Login failed', 'error');
        }
    }

    async register() {
        const name = document.getElementById('register-name')?.value || '';
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        
        if (!email || !password) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        try {
            const response = await axios.post(`${this.apiBase}/auth/register`, {
                name,
                email,
                password
            });

            this.token = response.data.token;
            this.user = response.data.user;
            
            localStorage.setItem('ntando_token', this.token);
            localStorage.setItem('ntando_user', JSON.stringify(this.user));
            
            document.getElementById('user-initial').textContent = this.user.name.charAt(0).toUpperCase();
            
            this.showToast('Registration successful!', 'success');
            this.hideLoginModal();
            this.showDashboard();
            this.setupSocketIO();
            
        } catch (error) {
            console.error('Registration error:', error);
            this.showToast(error.response?.data?.error || 'Registration failed', 'error');
        }
    }

    hideLoginModal() {
        document.getElementById('main-content').classList.remove('hidden');
        document.getElementById('login-modal').classList.add('hidden');
    }

    logout() {
        localStorage.removeItem('ntando_token');
        localStorage.removeItem('ntando_user');
        this.token = null;
        this.user = {};
        
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        
        this.showToast('Logged out successfully', 'success');
        this.showLogin();
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        
        const bgColors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            info: 'bg-blue-500',
            warning: 'bg-yellow-500'
        };
        
        toast.className = `${bgColors[type]} text-white px-6 py-3 rounded-lg shadow-lg mb-2 slide-in`;
        toast.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Global functions for inline event handlers
let app;
window.addEventListener('DOMContentLoaded', () => {
    app = new NtandoComputer();
    
    // Make functions globally available
    window.showDashboard = () => app.showDashboard();
    window.showDeployView = () => app.showDeployView();
    window.showProjectsView = () => app.showProjectsView();
    window.showView = (view) => app.showView(view);
    window.login = () => app.login();
    window.register = () => app.register();
    window.app = app;
});