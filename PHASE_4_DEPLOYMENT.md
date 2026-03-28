# Phase 4 Deployment Guide

## Prerequisites

Before deploying Phase 4, ensure you have:
- [x] Docker Desktop installed
- [x] Node.js v18+ installed
- [x] npm v9+ installed
- [x] PostgreSQL running (via Docker)
- [x] Backend .env file configured
- [x] Frontend .env file configured

## Quick Start (Docker Compose)

### 1. Start All Services

```bash
# From project root directory
cd /path/to/heirsbizsuite

# Start all services with Docker Compose
docker-compose up -d

# Verify all services are running
docker-compose ps
```

**Expected output:**
```
NAME                COMMAND                  STATUS
heirs-backend       "node src/server.js"     Up 2 minutes
heirs-frontend      "vite"                   Up 2 minutes  
postgres            "docker-entrypoint"      Up 2 minutes
redis               "redis-server"           Up 2 minutes
```

### 2. Access the Application

**Frontend (Dashboard & Analytics):**
```
http://localhost:3001
```

**Backend API (Endpoints):**
```
http://localhost:3000/api
```

**Health Check:**
```bash
curl http://localhost:3000/api/health
# Response: {"status":"ok","timestamp":"2024-02-15T..."}
```

## Manual Setup (Without Docker)

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file (if not exists)
cat > .env << EOF
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=heirs_business
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your-super-secret-key-change-in-production

# Environment
NODE_ENV=development
FRONTEND_URL=http://localhost:3001

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
EOF

# Start PostgreSQL (requires separate installation)
# Windows (Admin PowerShell):
$env:PGUSER="postgres"
$env:PGPASSWORD="postgres"
postgres -D "C:\Program Files\PostgreSQL\15\data"

# macOS (homebrew):
brew services start postgresql

# Linux (systemd):
sudo systemctl start postgresql

# Create database and run migrations
psql -U postgres -c "CREATE DATABASE heirs_business;"
psql -U postgres -d heirs_business -f migrations/001_create_tables.sql

# Start backend server
npm run dev
```

**Expected output:**
```
🚀 Server running on http://localhost:3000
Connected to PostgreSQL
Redis connection established
```

### 2. Frontend Setup

```bash
# In new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env file (if not exists)
cat > .env << EOF
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
EOF

# Start development server
npm run dev
```

**Expected output:**
```
  VITE v5.0.0  ready in 234 ms

  ➜  Local:   http://localhost:3001/
  ➜  press h to show help
```

## First-Time Setup

### 1. Create Company

1. Navigate to `http://localhost:3001/register`
2. Fill in company details:
   - Company Name: "My Company"
   - Email: "admin@company.com"
   - Password: "SecurePassword123!"
3. Click "Register"
4. You'll be automatically logged in

### 2. Login to Dashboard

1. You should see the main dashboard
2. Populate some data:
   - Go to Chat section and send messages
   - Go to Inventory and add products
   - Go to Attendance and mark attendance

### 3. Access Analytics

1. Navigate to `http://localhost:3001/analytics`
2. You should see the Dashboard with KPIs
3. Click "Last 30 Days" to load data
4. Go to Charts tab to see visualizations

## Verification

### Check Backend Services

```bash
# 1. Verify database connection
curl http://localhost:3000/api/health

# 2. Verify authentication works
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"SecurePassword123!"}'

# 3. Test analytics endpoint (replace TOKEN with actual token)
curl -X GET http://localhost:3000/api/analytics/dashboard-kpis \
  -H "Authorization: Bearer TOKEN"
```

### Check Frontend

1. Open browser DevTools (F12)
2. Go to Console tab
3. You should see no red errors
4. Check Network tab - all requests should be 200 or 304

### Verify Database

```bash
# Connect to PostgreSQL
psql -U postgres -d heirs_business

# Check tables
\dt

# Count records
SELECT COUNT(*) as users FROM users;
SELECT COUNT(*) as messages FROM messages;
SELECT COUNT(*) as products FROM products;
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
Windows:
netstat -ano | findstr :3000

macOS/Linux:
lsof -i :3000

# Kill process
Windows (PowerShell):
Stop-Process -Id <PID> -Force

macOS/Linux:
kill -9 <PID>
```

### Database Connection Failed

```bash
# Verify PostgreSQL is running
Windows:
pg_isready

macOS/Linux:
sudo systemctl status postgresql

# Verify credentials
psql -U postgres -h localhost
```

### Analytics Page Shows Empty

1. Check backend logs:
   ```bash
   docker-compose logs backend | tail -50
   ```

2. Ensure you have:
   - Logged in as manager or admin
   - Data exists (messages, products, etc.)
   - Date range contains data

3. Check browser console for errors:
   ```
   F12 → Console tab
   ```

### Export Not Working

```bash
# Verify export endpoint
curl -X GET http://localhost:3000/api/analytics/export?format=json \
  -H "Authorization: Bearer TOKEN" \
  -v
```

## Production Deployment

### Environment Variables (Production)

```bash
# Backend .env
NODE_ENV=production
JWT_SECRET=<generate-secure-key>
FRONTEND_URL=https://your-domain.com
DB_HOST=prod-db-host
DB_USER=prod_user
DB_PASSWORD=<secure-password>
REDIS_HOST=prod-redis-host
```

### Recommended Setup

1. **Database**: AWS RDS PostgreSQL
2. **Backend**: AWS ECS or Heroku
3. **Frontend**: AWS S3 + CloudFront or Vercel
4. **Redis**: AWS ElastiCache or Heroku Redis

### SSL/HTTPS

```bash
# Install SSL certificate
# Using Let's Encrypt (certbot)
sudo certbot certonly --standalone -d yourdomain.com

# Update backend to use HTTPS
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('/path/to/privkey.pem'),
  cert: fs.readFileSync('/path/to/fullchain.pem')
};

https.createServer(options, app).listen(443);
```

## Performance Optimization

### Enable Caching

```bash
# Redis is automatically used for caching
# No additional configuration needed
```

### Database Optimization

```bash
# Create indexes (already done in migration)
CREATE INDEX idx_messages_channel_id ON messages(channel_id);
CREATE INDEX idx_products_company_id ON products(company_id);
CREATE INDEX idx_attendances_employee_id ON attendances(employee_id);
```

### Frontend Build

```bash
# Build optimized frontend
cd frontend
npm run build

# Output: dist/ folder with minified files
```

## Updating Phase 4

### Pull Latest Changes

```bash
cd /path/to/heirsbizsuite
git pull origin main
```

### Restart Services

```bash
# With Docker
docker-compose restart

# Or manually
# Terminal 1: Stop backend (Ctrl+C)
# Terminal 2: Stop frontend (Ctrl+C)
# Restart both with npm run dev
```

## Monitoring

### Check Logs

```bash
# Backend logs
docker-compose logs backend -f

# Frontend logs
docker-compose logs frontend -f

# Database logs
docker-compose logs postgres -f
```

### Performance Metrics

```bash
# Monitor database queries
docker-compose exec postgres psql -U postgres -d heirs_business

# Query active connections
SELECT pid, usename, query FROM pg_stat_activity;
```

## Rollback

If issues occur:

```bash
# Revert to previous version
git reset --hard HEAD~1
docker-compose restart
```

## Health Check Script

```bash
#!/bin/bash
# save as check_health.sh

echo "Checking Phase 4 health..."

# Check backend
echo -n "Backend: "
curl -s http://localhost:3000/api/health || echo "DOWN"

# Check frontend
echo -n "Frontend: "
curl -s http://localhost:3001 > /dev/null && echo "UP" || echo "DOWN"

# Check database
echo -n "Database: "
docker-compose exec postgres pg_isready -q && echo "UP" || echo "DOWN"

# Check Redis
echo -n "Redis: "
docker-compose exec redis redis-cli ping > /dev/null 2>&1 && echo "UP" || echo "DOWN"

echo "Done!"
```

Run with:
```bash
chmod +x check_health.sh
./check_health.sh
```

## Next Steps

After successful deployment:

1. ✅ Test analytics dashboard
2. ✅ Verify all data displays correctly
3. ✅ Test export functionality
4. ✅ Check performance metrics
5. ✅ Plan Phase 5 implementation

## Support Resources

- **Documentation**: See PHASE_4_COMPLETE.md
- **Testing Guide**: See PHASE_4_TESTING.md
- **API Reference**: See PHASE_4_COMPLETE.md
- **Troubleshooting**: See this file

## Quick Commands Reference

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f backend

# Restart specific service
docker-compose restart backend

# Run migrations
docker-compose exec postgres psql -U postgres -d heirs_business -f /migrations/001_create_tables.sql

# Scale backend (production)
docker-compose up -d --scale backend=3

# Health check
curl http://localhost:3000/api/health
```

---

**Phase 4 Deployment Guide - Complete**

Ready to go live! 🚀

For issues: Check troubleshooting section above.  
For API help: See PHASE_4_COMPLETE.md  
For testing: See PHASE_4_TESTING.md
