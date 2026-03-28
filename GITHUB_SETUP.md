# GitHub Repository Setup for Deployment

## 📁 Required GitHub Setup

### 1. Initialize Git (If Not Already Done)

```bash
cd c:\Users\HP\heirsbizsuite

# Initialize git if not already
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: Heirs Business Suite"
```

### 2. Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `heirs-business-suite`
3. Description: `Complete business management platform with chat, inventory, and HR`
4. Choose: **Public** (easier for deployment) or Private
5. **DO NOT** check "Initialize with README"
6. Click **"Create repository"**

### 3. Push to GitHub

```bash
# Add remote
git remote add origin https://github.com/YOUR_USERNAME/heirs-business-suite.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## 🔐 Secrets Management

### Create `.env.example` Files (Commit These)

**File: `backend/.env.example`**
```
NODE_ENV=production
PORT=3000
DB_HOST=db.XXXXXXXXX.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=CHANGE_ME
DB_SSL=true
JWT_SECRET=CHANGE_ME
FRONTEND_URL=CHANGE_ME
REDIS_HOST=
REDIS_PORT=6379
REDIS_PASSWORD=
AWS_ACCESS_KEY=
AWS_SECRET_KEY=
S3_BUCKET=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

**File: `frontend/.env.example`**
```
VITE_API_URL=CHANGE_ME
VITE_SOCKET_URL=CHANGE_ME
VITE_APP_NAME=Heirs Business Suite
```

### Verify `.gitignore` Includes

Check `.gitignore` contains:
```
node_modules/
.env
.env.local
.env.*.local
dist/
build/
.DS_Store
*.log
```

---

## ✅ Pre-Deployment Checklist

Before pushing to GitHub, verify:

- [ ] `.env` files are NOT in `.gitignore`
- [ ] `node_modules/` is in `.gitignore`
- [ ] `dist/` is in `.gitignore`
- [ ] `.env.example` files exist and show all variables
- [ ] `package.json` scripts are correct
  - Backend: `"start": "node src/server.js"`
  - Frontend: `"build": "vite build"`

---

## 🚀 Deployment Configuration Files

Railway and Render auto-detect Node.js projects, but you can add config files:

### Option 1: Railway Configuration

**File: `railway.json`** (optional, root level)
```json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "numReplicas": 1,
    "startCommand": "npm start",
    "healthcheckPath": "/api/health"
  }
}
```

### Option 2: Render Configuration

**File: `render.yaml`** (optional, root level)
```yaml
services:
  - type: web
    name: heirs-business-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /api/health
```

---

## 🔄 GitHub Actions (Optional CI/CD)

For automated testing before deployment, create:

**File: `.github/workflows/deploy.yml`**
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      # Backend tests
      - name: Install Backend
        run: cd backend && npm install
      
      - name: Backend Lint
        run: cd backend && npm run lint
      
      # Frontend build
      - name: Install Frontend
        run: cd frontend && npm install
      
      - name: Frontend Build
        run: cd frontend && npm run build
```

---

## 📝 Git Workflow

### Daily Development

```bash
# Make changes locally
# Test: npm run dev

# When ready to commit
git add .
git commit -m "Add feature: [description]"
git push origin main

# Sits auto-deploys!
```

### Good Commit Messages

```
✅ Good:
- "Add user authentication"
- "Fix database connection pooling"
- "Update frontend environment variables"

❌ Avoid:
- "fix"
- "update"
- "changes"
```

---

## 🔀 Branch Strategy (Optional)

For better control:

```bash
# Development branch
git checkout -b develop

# Make changes
git add .
git commit -m "feature: add chat system"
git push origin develop

# When ready for production, create PR to main
# After testing, merge to main
git checkout main
git merge develop
git push origin main

# Auto-deploys to production!
```

---

## 📦 File Structure for Deployment

Your repo should look like:

```
heirs-business-suite/
├── backend/
│   ├── src/
│   ├── migrations/
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile (optional)
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── .env.example
│   ├── vite.config.js
│   └── Dockerfile (optional)
├── docs/
├── .github/          ← GitHub Actions (optional)
├── .gitignore
├── README.md
├── docker-compose.yml
└── DEPLOYMENT_GUIDE.md
```

---

## 💻 GitHub Commands Reference

```bash
# Check status
git status

# Stage files
git add .

# Commit
git commit -m "message"

# Push
git push origin main

# Pull latest
git pull origin main

# View log
git log --oneline

# Create branch
git checkout -b feature-name

# Switch branch
git checkout main

# Merge branch
git merge feature-name

# Delete branch
git branch -d feature-name
```

---

## 🔗 Railway/Render GitHub Integration

### Connect Railway

1. Go to https://railway.app/dashboard
2. New Project → "Deploy from GitHub repo"
3. Select your repository
4. Select `main` branch
5. Railway auto-detects Node.js
6. Add environment variables
7. Deploy starts automatically

### Connect Render

1. Go to https://render.com/dashboard
2. New "Web Service"
3. Connect GitHub account
4. Select repository
5. Configure build/start commands
6. Add environment variables
7. Deploy

---

## ✅ Post-Deployment Steps

After first deployment:

1. Enable "Auto-deploy" in both services
2. Every `git push` triggers:
   - Code pulled from GitHub
   - Dependencies installed
   - Build runs
   - Service restarts
   - **App is live!**

---

## 🆘 Troubleshooting GitHub Integration

| Issue | Solution |
|-------|----------|
| Can't see my repo | Grant GitHub permissions in Railway/Render |
| Build fails | Check build command in config |
| Deployment times out | Check logs in service dashboard |
| Environment vars not set | Verify they're added in service dashboard |
| .env file not found | Make sure it's in `.env.example` & added in dashboard |

---

## 📚 Additional Resources

- GitHub Docs: https://docs.github.com
- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
- Netlify Docs: https://docs.netlify.com
- Vercel Docs: https://vercel.com/docs

---

## 🎯 Next Steps

1. Create GitHub repository
2. Push code to main branch
3. Connect to Railway/Render
4. Add environment variables
5. Deploy!

Questions? See the deployment guides!
