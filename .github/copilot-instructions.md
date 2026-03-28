<!--
Heirs Business Suite - Development Instructions
This file provides workspace-specific instructions for building the complete application.
-->

# Heirs Business Suite - Development Workspace

## Project Status  
- ✅ Project structure created
- ✅ Backend scaffold with Express.js
- ✅ Frontend scaffold with React + Vite
- ✅ Database schema designed
- ✅ Authentication system (register/login)
- ✅ Docker configuration
- ✅ Dashboard implementation complete
- ✅ Attendance tracking system
- ✅ Employee profile management
- ✅ HR management module
- ⏳ Phase 3: Real-time chat system (next)

## Development Guidelines

### Code Style
- Use ES6+ syntax
- Follow consistent naming conventions
- Add comments for complex logic
- Use environment variables for config

### Database
- Use parameterized queries (prevent SQL injection)
- Always include proper indexing
- Run migrations before starting development
- Test schema changes locally first

### Frontend
- Keep components small and reusable
- Use Zustand for state management
- Handle loading and error states
- Add input validation

### Backend
- Validate all inputs server-side
- Return consistent JSON responses
- Use proper HTTP status codes
- Log errors for debugging

### Security
- Never commit .env files
- Use bcrypt for passwords
- Validate and sanitize inputs
- Implement rate limiting
- Use HTTPS in production

## Running the Application

### Development Mode
```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev

# Terminal 3: Database (if needed)
docker-compose up postgres redis
```

### With Docker Compose
```bash
docker-compose up -d
# Access:
# Frontend: http://localhost:3001
# Backend: http://localhost:3000
# Database: localhost:5432
```

## Next Development Phases

### Phase 1: Foundation ✅ COMPLETE
- [x] Project structure
- [x] Backend API setup
- [x] Frontend framework
- [x] Authentication
- [x] Company registration
- [x] Database schema

### Phase 2: Core Modules ✅ COMPLETE
- [x] Employee dashboard with timesheet
- [x] Sign-in/sign-out system
- [x] Attendance history tracking
- [x] Employee profile management
- [x] HR employee invitations
- [x] User roles and permissions
- [x] Dashboard statistics and KPIs

### Phase 3: Chat System (NEXT)
- [ ] WebSocket setup and integration
- [ ] Channel creation and management
- [ ] Real-time messaging
- [ ] File sharing in channels
- [ ] Direct messaging

### Phase 4: Business Modules
- [ ] Inventory management
- [ ] HR employee management
- [ ] Sales order tracking
- [ ] Expense management

### Phase 5: Advanced Features
- [ ] Document management system
- [ ] Reporting engine
- [ ] Analytics dashboard
- [ ] Email notifications

### Phase 6: Production Ready
- [ ] Unit & integration tests
- [ ] Performance optimization
- [ ] Security audit
- [ ] Deployment pipeline

## Important Files

- `README.md` - Project overview and setup
- `backend/src/server.js` - Main Express app
- `frontend/src/App.jsx` - Main React component
- `docker-compose.yml` - Multi-service configuration
- `backend/migrations/001_create_tables.sql` - Database schema

## Debugging Tips

1. Check backend logs: `docker-compose logs backend`
2. Check frontend console: Browser DevTools
3. Database queries: Connect with psql or DBeaver
4. API testing: Use Postman or curl

## Resources

- Express.js: https://expressjs.com/
- React: https://react.dev/
- Tailwind CSS: https://tailwindcss.com/
- Zustand: https://zustand-demo.vercel.app/
- Socket.io: https://socket.io/

## Key Endpoints (Currently Available)

- `POST /api/auth/register-company` - Register new company
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh JWT
- `GET /api/health` - Health check

## Environment Variables Needed

Backend: `backend/.env`
- DB_HOST, DB_NAME, DB_USER, DB_PASSWORD
- JWT_SECRET, FRONTEND_URL
- REDIS_HOST, REDIS_PORT

Frontend: `frontend/.env`
- VITE_API_URL, VITE_SOCKET_URL

## Database Migration

To run migrations on PostgreSQL:
```bash
# Using Docker
docker-compose exec postgres psql -U postgres -d heirs_business -f /docker-entrypoint-initdb.d/001_create_tables.sql

# Or manually
psql -h localhost -U postgres -d heirs_business -f backend/migrations/001_create_tables.sql
```

## Testing

```bash
# Backend tests (to be added)
cd backend && npm test

# Frontend tests (to be added)
cd frontend && npm test
```

## Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Docker images built
- [ ] SSL certificate valid
- [ ] Monitoring enabled
- [ ] Error tracking (Sentry) configured
- [ ] Backup strategy in place

---

For detailed specifications, see: `Heirs_Business_Suite_LLM_Prompt.md`
