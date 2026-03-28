# Heirs Business Suite - Complete Setup Guide

## Project Overview

Heirs Business Suite is a comprehensive, production-ready Zoho-inspired business management platform with:
- Multi-company support
- Employee management & time tracking
- Inventory management
- HR module
- Real-time chat
- Cloud document storage
- Sales & expense tracking
- Role-based access control

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Installation

#### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run migrate
npm run dev
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

#### 3. Database Setup (With Docker)
```bash
docker-compose up -d
```

## Project Structure

```
heirs-business-suite/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, Redis config
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth, error handling
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── validators/      # Input validation
│   │   ├── utils/           # Helper functions
│   │   └── server.js        # Express app
│   ├── migrations/          # Database migrations
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API calls
│   │   ├── store/           # State management
│   │   ├── styles/          # CSS files
│   │   ├── utils/           # Helper functions
│   │   ├── App.jsx          # Main component
│   │   └── main.jsx         # Entry point
│   ├── public/              # Static files
│   └── package.json
│
├── docker-compose.yml
├── .github/
└── docs/
```

## API Endpoints

### Authentication
- `POST /api/auth/register-company` - Register new company
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - User logout

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_NAME=heirs_business
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3001
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

## Running with Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down
```

## Deployment

### With Docker
```bash
docker build -t heirs-business-backend ./backend
docker push your-registry/heirs-business-backend

docker build -t heirs-business-frontend ./frontend
docker push your-registry/heirs-business-frontend
```

### Environment Variables for Production
Update `.env` files for production:
- Use strong JWT_SECRET
- Enable SSL on database
- Set NODE_ENV=production
- Configure S3 for document storage
- Setup SMTP for emails

## Database Schema

The database includes tables for:
- Companies (multi-tenant)
- Users & Authentication
- Roles & Permissions
- Departments
- Employees
- Attendance
- Chat Channels & Messages
- Inventory & Products
- Sales Orders
- Documents

## Features Implementation Status

- [x] Project structure
- [x] Backend setup
- [x] Frontend setup
- [x] Authentication system
- [x] Company registration
- [x] Database schema
- [x] Docker configuration
- [ ] Employee dashboard
- [ ] Chat system
- [ ] Inventory module
- [ ] HR module
- [ ] Document management
- [ ] Reports & Analytics

## Next Steps

1. **Dashboard Implementation** - Create employee dashboard with time tracking
2. **Chat System** - Implement WebSocket-based real-time messaging
3. **Inventory Module** - Add product management and inventory tracking
4. **HR Module** - Implement employee management and payroll
5. **Testing** - Add unit and integration tests
6. **Deployment** - Deploy to production environment

## Troubleshooting

### Database Connection Error
- Check PostgreSQL is running
- Verify credentials in .env
- Check DB_HOST is correct

### Port Already in Use
- Backend: Change PORT in .env
- Frontend: Change server.port in vite.config.js
- Redis: Change REDIS_PORT

### Module Not Found
- Run `npm install` in the respective directory
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

## Support

For issues and questions, refer to the complete specification in `Heirs_Business_Suite_LLM_Prompt.md`.

## License

All rights reserved.
