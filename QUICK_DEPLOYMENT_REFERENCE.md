# 🚀 Quick Deployment Reference Card

## Step-by-Step (15 minutes)

### 1️⃣ SETUP SUPABASE (3 min)
```
1. Go to supabase.io → Sign up
2. Create project: "heirs-business"
3. Copy connection string
4. Go to SQL Editor
5. Run: backend/migrations/001_create_tables.sql
✅ Done: You have a live database
```

### 2️⃣ DEPLOY BACKEND (5 min)
```
Option A: Railway
- Go to railway.app → Sign up with GitHub
- Connect repo → select main branch
- Add env vars (see SUPABASE_DEPLOYMENT_CHECKLIST.md)
- Deploy
- Copy backend URL ← SAVE THIS

Option B: Render
- Go to render.com → Sign up
- New Web Service → Connect GitHub
- Same env vars as Railway
- Deploy
- Copy backend URL ← SAVE THIS
```

### 3️⃣ DEPLOY FRONTEND (5 min)
```
Option A: Netlify
- Go to netlify.com → Sign up with GitHub
- Import project → select main branch
- Build: npm run build
- Publish: dist
- Add env vars with BACKEND URL
- Deploy
- Get frontend URL ← SAVE THIS

Option B: Vercel
- Go to vercel.com → Sign up with GitHub
- Import project → select frontend folder
- Same env vars
- Deploy
- Get frontend URL ← SAVE THIS
```

---

## 🔑 Critical Information

### Supabase Connection String Format
```
postgresql://postgres:PASSWORD@HOSTNAME:5432/postgres
```

### Environment Variables Needed

**Backend Server:**
```
DB_HOST=db.xxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=true
JWT_SECRET=long-random-string-32-chars
FRONTEND_URL=https://your-frontend-url.com
```

**Frontend App:**
```
VITE_API_URL=https://your-backend-url.com
VITE_SOCKET_URL=https://your-backend-url.com
```

---

## 📊 Services Used & Costs

| Service | Plan | Cost | Purpose |
|---------|------|------|---------|
| Supabase | Hobby | Free | Database (1GB included) |
| Railway | Basic | Free* | Backend hosting |
| Netlify | Starter | Free | Frontend hosting |
| **TOTAL** | - | **~$0/month** | Full production app |

*Railway gives $5/month free credits (usually covers small apps)

---

## ✅ Final Checklist

- [ ] Supabase project created
- [ ] Migrations ran successfully
- [ ] Backend deployed & URL copied
- [ ] Frontend deployed & URL copied
- [ ] Backend env vars updated with frontend URL
- [ ] Frontend env vars updated with backend URL
- [ ] Can access frontend URL
- [ ] Can register/login
- [ ] API calls work (check DevTools → Network)

---

## 🧪 Quick Tests

After deployment:

```bash
# Test backend health
curl https://your-backend-url/api/health

# Test in browser console
fetch('https://your-backend-url/api/health')
  .then(r => r.json())
  .then(console.log)
```

---

## 🔄 Update Workflow (From Now On)

```bash
# Make changes locally
# Test locally: npm run dev

# When ready to deploy
git add .
git commit -m "describe your changes"
git push origin main

# Services auto-deploy:
# - Backend: 5-10 min
# - Frontend: 2-3 min
```

---

## 🆘 Need Help?

Common issues:

| Error | Fix |
|-------|-----|
| `Cannot GET /api/health` | Backend not running, check logs |
| CORS Error | `FRONTEND_URL` env var in backend incorrect |
| Blank frontend | Check `VITE_API_URL` env var |
| Database error | Check `DB_HOST`, `DB_PASSWORD` |
| Tables not found | Run migrations in Supabase SQL Editor |

---

## 📞 Where to Check Logs

- **Backend logs**: Railway Dashboard → Logs or Render Dashboard → Logs
- **Frontend logs**: Browser DevTools → Console
- **Database**: Supabase Dashboard → Logs
- **Deployment**: Check platform (Railway/Render/Netlify/Vercel) → Deployments tab

---

## 💾 Keep These URLs

After deployment, save:

```
Supabase Project: https://supabase.io/dashboard/project/[YOUR-PROJECT-ID]
Supabase DB Connection: postgresql://postgres:PASSWORD@HOST:5432/postgres

Backend URL: https://your-backend-url.railway.app
Backend Dashboard: https://railway.app

Frontend URL: https://your-frontend-url.netlify.app
Frontend Dashboard: https://app.netlify.com

Git Repo: https://github.com/your-repo
```

---

## 🎓 Next Steps

1. **Start with Supabase setup** (easiest)
2. **Deploy backend next** (takes longest)
3. **Deploy frontend last** (fastest)
4. **Test everything together**

Questions? Check:
- DEPLOYMENT_GUIDE.md (detailed)
- SUPABASE_DEPLOYMENT_CHECKLIST.md (technical)
- This file (quick reference)
