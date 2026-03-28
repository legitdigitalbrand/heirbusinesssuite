# Supabase Setup Checklists

## ✅ Supabase Migration Steps

### Step 1: Create Supabase Project
- [ ] Go to https://supabase.io
- [ ] Sign up / Login with GitHub
- [ ] Click "New Project"
- [ ] Database Password: Save securely
- [ ] Wait 2-3 minutes for project creation

### Step 2: Get Connection Details
- [ ] Go to **Project Settings**
- [ ] Click **Database**
- [ ] Copy **Hostname**
- [ ] Copy **Database name** (usually `postgres`)
- [ ] Copy **User** (usually `postgres`)
- [ ] Copy **Password** (temporary, set your own)
- [ ] Connection string appears at bottom

### Step 3: Create Production Database String
Connection string format:
```
postgresql://postgres:YOUR_PASSWORD@YOUR_HOSTNAME:5432/postgres
```

Example:
```
postgresql://postgres:abc123def456@db.abcdefg.supabase.co:5432/postgres
```

### Step 4: Run Migrations
1. Go to **SQL Editor** in Supabase
2. Click **New Query**
3. Copy contents of: `backend/migrations/001_create_tables.sql`
4. Paste into SQL Editor
5. Click **"Run"** (RUN icon or Ctrl+Enter)
6. ✅ Tables created!

### Step 5: Verify Tables
In SQL Editor, run:
```sql
SELECT * FROM information_schema.tables WHERE table_schema = 'public';
```

Should show all your tables (users, companies, employees, etc.)

---

## 📋 Environment Variables for Each Service

### BACKEND ENVIRONMENT (Railway/Render)

```env
# Server
NODE_ENV=production
PORT=3000

# Supabase/PostgreSQL (from connection details)
DB_HOST=db.XXXXXXXXX.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-secure-password
DB_SSL=true

# JWT (generate a new secure key)
JWT_SECRET=generate-a-long-random-string-here-min-32-characters
JWT_EXPIRY=900
REFRESH_TOKEN_EXPIRY=604800

# Frontend (where your frontend is deployed)
FRONTEND_URL=https://your-frontend.netlify.app

# Redis (if using managed Redis service)
REDIS_HOST=redis-host-if-used
REDIS_PORT=6379
REDIS_PASSWORD=

# AWS/Email (optional, leave blank if not using)
AWS_ACCESS_KEY=
AWS_SECRET_KEY=
S3_BUCKET=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

### FRONTEND ENVIRONMENT (Netlify/Vercel)

```env
# Backend API URL
VITE_API_URL=https://your-backend-railway.railway.app
VITE_SOCKET_URL=https://your-backend-railway.railway.app

# App name
VITE_APP_NAME=Heirs Business Suite
```

---

## 🔑 Generating Secure Keys

### Generate JWT_SECRET

Open terminal and run:
```bash
# Windows PowerShell
-join ((1..32) | ForEach-Object { [char](Get-Random -Minimum 33 -Maximum 126) })

# macOS/Linux
openssl rand -base64 32
```

Or use an online tool: https://generate-random.org/encryption-key-generator

---

## 🚀 Deployment URLs Mapping

After deployment, you'll have URLs like:

| Service | URL Pattern | Example |
|---------|------------|---------|
| Backend (Railway) | `https://backend-*.railway.app` | `https://backend-xyz123.railway.app` |
| Backend (Render) | `https://backend-*.onrender.com` | `https://backend-xyz123.onrender.com` |
| Frontend (Netlify) | `https://your-app.netlify.app` | `https://heirs-business.netlify.app` |
| Frontend (Vercel) | `https://your-app.vercel.app` | `https://heirs-business.vercel.app` |

**Cross-reference them:**
- Backend's `FRONTEND_URL` = Your Frontend URL
- Frontend's `VITE_API_URL` = Your Backend URL

---

## ✅ Verification Steps

After deployment, test each step:

### 1. Test Backend Health
```bash
curl https://your-backend-url/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

### 2. Test Frontend Loads
Visit `https://your-frontend-url` in browser
- Page should load
- No CORS errors in console

### 3. Test Registration
- Go to Register page
- Fill in details
- Should create account in Supabase database

### 4. Test Login
- Use registered credentials
- Should login successfully
- Should get JWT token

---

## 🆘 Troubleshooting Deployments

### Backend won't start
```
Check logs in Railway/Render dashboard:
- DB connection string correct?
- PORT env var set?
- JWT_SECRET set?
- Migrations ran on Supabase?
```

### Frontend can't reach backend
```
Check browser console for CORS errors:
- VITE_API_URL correct?
- Backend's FRONTEND_URL correct?
- Both using HTTPS?
```

### Database migrations failed
```
Supabase SQL Editor:
1. Check for errors in SQL
2. Run migrations manually step by step
3. Verify tables exist:
   SELECT * FROM information_schema.tables 
   WHERE table_schema = 'public';
```

---

## 📱 Access Your Live Application

After everything is deployed:

1. **Frontend (Dashboard)**: https://your-frontend-url
2. **Backend API**: https://your-backend-url/api
3. **Database (Supabase)**: https://supabase.io → Your Project
4. **Logs**:
   - Railway: Dashboard → Logs tab
   - Render: Dashboard → Logs tab
   - Netlify: Site Overview → Deploys

---

## 🔄 Continuous Deployment

Once set up, this is the workflow:

1. Make changes locally
2. Test with `npm run dev`
3. Push to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```
4. Services auto-deploy:
   - GitHub webhook triggers
   - Railway/Render rebuilds backend
   - Netlify/Vercel rebuilds frontend
   - Auto-deployed in 2-10 minutes
