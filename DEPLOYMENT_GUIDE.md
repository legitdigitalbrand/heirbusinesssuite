# Deploy to Netlify/Vercel + Supabase - Complete Guide

## 🎯 Overview
- **Frontend**: Deploy to Netlify or Vercel (free tier available)
- **Backend**: Deploy to Railway or Render (free tier available)
- **Database**: Migrate to Supabase (PostgreSQL hosted, free tier available)

---

## 📚 Table of Contents
1. [Step 1: Set Up Supabase](#step-1-set-up-supabase)
2. [Step 2: Deploy Backend](#step-2-deploy-backend)
3. [Step 3: Deploy Frontend](#step-3-deploy-frontend)
4. [Step 4: Connect Everything](#step-4-connect-everything)

---

## Step 1: Set Up Supabase

### 1.1 Create Supabase Project

1. Go to: https://supabase.io
2. Click **"Start Your Project"**
3. Sign up with GitHub or email
4. Create new project:
   - **Project Name**: `heirs-business`
   - **Database Password**: Create strong password
   - **Region**: Choose closest to you
5. Wait 2-3 minutes for project creation

### 1.2 Get Database Connection String

1. Go to **Project Settings** → **Database**
2. Copy **Connection String** (URI format)
3. It looks like:
   ```
   postgresql://user:password@host:5432/database
   ```

### 1.3 Run Migrations

1. In Supabase, go to **SQL Editor**
2. Open the migration file: `backend/migrations/001_create_tables.sql`
3. Copy all the SQL
4. Paste into Supabase SQL Editor
5. Click **"Run"**
6. ✅ All tables created!

---

## Step 2: Deploy Backend

### Option A: Deploy to Railway (Easiest)

#### 2A.1 Create Railway Account
1. Go to: https://railway.app
2. Sign up with GitHub
3. Click **"New Project"**
4. Click **"Deploy from GitHub repo"**

#### 2A.2 Connect Your GitHub Repo

1. Select your GitHub repository
2. Choose branch: `main`
3. Railway auto-detects it's a Node.js project

#### 2A.3 Add Environment Variables

In Railway dashboard:
1. Click **"Variables"**
2. Add these environment variables:

```
NODE_ENV=production
PORT=3000
DB_HOST=your-supabase-host
DB_PORT=5432
DB_NAME=your-supabase-db-name
DB_USER=postgres
DB_PASSWORD=your-supabase-password
DB_SSL=true
JWT_SECRET=your-super-secret-key-generate-new-one
FRONTEND_URL=https://your-frontend-domain.com
REDIS_HOST=localhost
REDIS_PORT=6379
```

**How to get Supabase connection details:**
- Go to Supabase → Project Settings → Database
- Connection string has all the info you need

#### 2A.4 Deploy

1. Click **"Deploy"**
2. Wait 3-5 minutes
3. Copy the generated URL (e.g., `https://backend-xyz.railway.app`)
4. This is your **BACKEND_URL** - save it!

✅ Backend is now live!

---

### Option B: Deploy to Render

#### 2B.1 Create Render Account
1. Go to: https://render.com
2. Sign up with GitHub
3. Click **"New +"** → **"Web Service"**

#### 2B.2 Connect Repository

1. Select your GitHub repository
2. Set **Build Command**: `npm install`
3. Set **Start Command**: `npm start`
4. Choose **Free** plan

#### 2B.3 Add Environment Variables

Add same variables as Railway above

#### 2B.4 Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Copy the generated URL
4. Save as **BACKEND_URL**

✅ Backend is now live!

---

## Step 3: Deploy Frontend

### Option A: Deploy to Netlify (Easiest)

#### 3A.1 Create Netlify Account
1. Go to: https://netlify.com
2. Sign up with GitHub
3. Click **"Add new site"** → **"Import an existing project"**

#### 3A.2 Connect GitHub Repo

1. Select your GitHub repository
2. Choose branch: `main`

#### 3A.3 Configure Build Settings

**Build Command**: `npm run build`
**Publish Directory**: `dist`

#### 3A.4 Add Environment Variables

1. Go to **Site Settings** → **Build & Deploy** → **Environment**
2. Add environment variables:

```
VITE_API_URL=https://your-backend-url.com
VITE_SOCKET_URL=https://your-backend-url.com
VITE_APP_NAME=Heirs Business Suite
```

Replace with your actual backend URL from Step 2!

#### 3A.5 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. Get your frontend URL (e.g., `https://heirs-business.netlify.app`)

✅ Frontend is now live!

---

### Option B: Deploy to Vercel

#### 3B.1 Create Vercel Account
1. Go to: https://vercel.com
2. Sign up with GitHub
3. Click **"Add New"** → **"Project"**

#### 3B.2 Import Repository

1. Select your GitHub repository
2. Click **"Import"**

#### 3B.3 Configure

1. **Root Directory**: Set to `frontend`
2. **Framework**: Select **"Vite"**
3. **Build Output Directory**: `dist`

#### 3B.4 Environment Variables

Click **"Environment Variables"** and add:

```
VITE_API_URL=https://your-backend-url.com
VITE_SOCKET_URL=https://your-backend-url.com
```

#### 3B.5 Deploy

1. Click **"Deploy"**
2. Wait for deployment
3. Get your frontend URL

✅ Frontend is now live!

---

## Step 4: Connect Everything

### 4.1 Update Frontend Environment

After backend is deployed:

1. Update `frontend/.env.production`:
   ```
   VITE_API_URL=https://your-backend-railway-url.railway.app
   VITE_SOCKET_URL=https://your-backend-railway-url.railway.app
   ```

2. Push to GitHub:
   ```bash
   git add .
   git commit -m "Update production API URLs"
   git push
   ```

3. Netlify/Vercel auto-redeploys

### 4.2 Update Backend Environment

Update backend environment variables with:
```
FRONTEND_URL=https://your-frontend-domain.netlify.app
```

### 4.3 Test Connection

1. Open your frontend URL
2. Try logging in or registering
3. Should connect to backend
4. Check browser DevTools → Network tab
5. API calls should go to your backend URL

---

## ⚙️ Update Your `.env` Files (Local Development)

Even though you're deploying, keep local dev working:

**backend/.env** (for local):
```
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=heirs_business
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
JWT_SECRET=dev-secret-key
FRONTEND_URL=http://localhost:3001
REDIS_HOST=localhost
REDIS_PORT=6379
```

**frontend/.env** (for local):
```
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

---

## 🔄 Deployment Workflow (From Now On)

1. Make changes locally
2. Test with `npm run dev`
3. Commit and push to GitHub
4. Services auto-deploy:
   - Frontend: 2-3 min
   - Backend: 5-10 min

```bash
# Simple workflow:
git add .
git commit -m "Your changes"
git push origin main
# Everything auto-deploys!
```

---

## 🆘 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **Frontend can't reach backend** | Check `VITE_API_URL` in production env vars |
| **CORS errors** | Verify `FRONTEND_URL` in backend env vars |
| **Database connection fails** | Check `DB_HOST`, `DB_USER`, `DB_PASSWORD` are correct |
| **500 errors on deployment** | Check backend logs in Railway/Render dashboard |
| **Migrations didn't run** | Run SQL manually in Supabase SQL Editor |

---

## 📊 Cost Breakdown (Free Tier)

- **Supabase**: Free tier - $0 (up to 1GB)
- **Railway**: Free tier - $5/month free credits
- **Netlify**: Free tier - $0 (unlimited)
- **Total**: ~$0-5/month

---

## 🚀 Full Deployment Checklist

### Setup Phase
- [ ] Create Supabase account
- [ ] Create Supabase project
- [ ] Run migrations on Supabase
- [ ] Get Supabase connection string

### Backend Deployment
- [ ] Create Railway/Render account
- [ ] Connect GitHub repository
- [ ] Add all environment variables
- [ ] Deploy backend
- [ ] Note the backend URL

### Frontend Deployment
- [ ] Create Netlify/Vercel account
- [ ] Connect GitHub repository
- [ ] Configure build settings (`npm run build`, dist folder)
- [ ] Add environment variables with backend URL
- [ ] Deploy frontend
- [ ] Note the frontend URL

### Integration
- [ ] Update backend env: `FRONTEND_URL`
- [ ] Update frontend env: `VITE_API_URL`
- [ ] Push to GitHub
- [ ] Auto-redeploy
- [ ] Test full workflow

### Final Verification
- [ ] Frontend loads at public URL
- [ ] Can register/login
- [ ] API calls go to backend
- [ ] Data persists in Supabase
- [ ] Browser console has no errors

---

## 💡 Pro Tips

1. **Keep secrets safe**: Never commit `.env` to GitHub
2. **Use production URLs**: Always test with real deployment URLs
3. **Monitor logs**: Check Railway/Render logs for errors
4. **Database backups**: Enable backups in Supabase dashboard
5. **SSL certificates**: Both platforms provide free HTTPS

---

## 🎯 Next Steps

Choose one:

1. **Ready to deploy?** Start with Step 1 (Supabase setup)
2. **Questions first?** Ask me anything!
3. **Need help?** I can automate the GitHub setup for you

Let me know which platform you prefer (Railway/Render for backend, Netlify/Vercel for frontend) and I can guide you through each step! 🚀
