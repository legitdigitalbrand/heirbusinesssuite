# Local Development Setup Guide (WITHOUT Docker)

## ✅ Current Status
- ✅ Node.js installed (v24.14.0)
- ✅ npm installed
- ✅ Backend dependencies installed
- ✅ Frontend dependencies installed
- ❌ PostgreSQL NOT installed
- ❌ Docker NOT installed

## 📋 Next Steps - Choose Your Option

### **Option 1: Easy Setup (Recommended for Development)**
Install PostgreSQL locally on Windows

#### Step 1: Download PostgreSQL
- Go to: https://www.postgresql.org/download/windows/
- Download PostgreSQL 15 or 16 (latest)
- Run installer and follow wizard
- **Default username**: postgres
- **Default password**: postgres
- **Port**: 5432

#### Step 2: Create Database
After PostgreSQL installation, open PowerShell and run:
```powershell
# Connect to PostgreSQL
psql -U postgres

# Inside psql console, create database:
CREATE DATABASE heirs_business;

# Verify (list databases):
\l

# Exit:
\q
```

#### Step 3: Run Database Migrations
```powershell
cd C:\Users\HP\heirsbizsuite\backend
psql -U postgres -d heirs_business -f ../backend/migrations/001_create_tables.sql
```

#### Step 4: Run the Application

**In VS Code Terminal 1 - Start Backend:**
```powershell
cd C:\Users\HP\heirsbizsuite\backend
npm run dev
```
Should show: `Server running on port 3000`

**In VS Code Terminal 2 - Start Frontend:**
```powershell
cd C:\Users\HP\heirsbizsuite\frontend
npm run dev
```
Should show: `Local: http://localhost:3001`

#### Step 5: Access the App
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000/api

---

### **Option 2: Use Windows Subsystem for Linux (WSL) + Docker**
If you want to use Docker in future, first enable WSL:
- Open PowerShell as Admin and run:
  ```powershell
  wsl --install
  wsl --install -d Ubuntu
  ```
- Install Docker Desktop with WSL backend support
- Then use `docker-compose up -d`

---

### **Option 3: Skip Database (Demo Mode)**
If you don't want to install PostgreSQL, I can modify the backend to run without DB connection for demoing the UI. Let me know if you want this!

---

## 🎯 VS Code Integration

### Run Tasks from VS Code

I've created VS Code tasks. You can run them:

1. Press `Ctrl+Shift+B` (or `Cmd+Shift+B` on Mac)
2. Select from dropdown:
   - **Backend: Start Dev Server** → runs backend only
   - **Frontend: Start Dev Server** → runs frontend only  
   - **Run All** → runs both together

### View Logs

- Select terminal tab and see real-time logs
- Backend logs appear in bottom panel
- Frontend (Vite) shows compilation status

---

## 🔧 Common Commands

```powershell
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

---

## 📦 Environment Variables

Both `.env` files are already created:
- `backend/.env` - Backend configuration
- `frontend/.env` - Frontend configuration

To change API URL or ports, edit these files.

---

## ✅ Quick Checklist to Launch

- [ ] PostgreSQL installed and running
- [ ] Database `heirs_business` created
- [ ] Migrations applied to database
- [ ] Terminal 1: Backend running on port 3000
- [ ] Terminal 2: Frontend running on port 3001
- [ ] Can access http://localhost:3001

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| `psql: command not found` | PostgreSQL not installed or not in PATH |
| `Error: connect ECONNREFUSED 127.0.0.1:5432` | PostgreSQL not running |
| `Error: database "heirs_business" does not exist` | Run migrations script |
| `Port 3000/3001 already in use` | Kill process or change ports in `.env` |
| `Module not found` | Run `npm install` in that directory |

---

## 🚀 Ready? Pick an option above and let me know!
