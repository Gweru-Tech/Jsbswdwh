# Quick Deploy Guide - Ntando Computer

## 🚀 Deploy to Render.com in 5 Minutes

### Method 1: One-Click Deploy (Recommended)

1. **Fork this repository** on GitHub
2. **Go to Render.com** and sign up/login
3. **Click "New +" → "Web Service"**
4. **Connect GitHub** and select your forked repository
5. **Render automatically detects** Node.js and sets up everything
6. **Add Environment Variables** in Render dashboard:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: A secure random string
7. **Click "Deploy"** - Your Ntando Computer will be live in minutes!

### Method 2: Manual Deploy with CLI

1. **Install Render CLI**:
   ```bash
   npm install -g render-cli
   ```

2. **Login to Render**:
   ```bash
   render login
   ```

3. **Run deployment script**:
   ```bash
   ./scripts/deploy.sh
   ```

### Method 3: Local Development

1. **Clone and setup**:
   ```bash
   git clone <your-fork>
   cd ntando-computer
   ./scripts/setup.sh
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Start locally**:
   ```bash
   npm run dev
   ```

## 📋 Required Environment Variables

```env
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
JWT_SECRET="your-super-secret-random-string"
NODE_ENV="production"
PORT=10000
```

## ✅ Test Your Deployment

1. **Run tests**:
   ```bash
   ./scripts/test-deployment.sh
   ```

2. **Test with sample website**:
   - Navigate to the web interface
   - Click "Deploy New Website"
   - Upload files from `examples/sample-website/`
   - Verify deployment completes successfully

## 🌐 Your Live Application

Once deployed, your Ntando Computer will be available at:
`https://your-app-name.onrender.com`

## 📞 Support

- **Documentation**: See `README.md`
- **User Guide**: See `docs/USER_GUIDE.md`
- **Issues**: Report on GitHub Issues
- **Email**: support@ntandocomputer.com

---

**🎉 Congratulations! Your Ntando Computer is ready to deploy websites with one click!**