# Project File Index - Quick Reference

## 📁 Core Application Structure

### Backend Files
```
backend/
├── src/
│   ├── server.js                      ← Express app initialization + Socket.io
│   ├── config/
│   │   ├── database.js                ← PostgreSQL connection pool
│   │   └── redis.js                   ← Redis client setup
│   ├── middleware/
│   │   ├── auth.js                    ← JWT & RBAC middleware
│   │   ├── errorHandler.js            ← Global error catching
│   │   └── requestLogger.js           ← Request logging
│   ├── services/
│   │   ├── authService.js             ← Login, registration, token refresh
│   │   ├── attendanceService.js       ← Sign-in/out, time tracking
│   │   └── employeeService.js         ← Profile, invitations, dashboard stats
│   ├── controllers/
│   │   ├── authController.js          ← Auth request handlers
│   │   ├── employeeController.js      ← Attendance & dashboard handlers
│   │   └── hrController.js            ← HR management handlers
│   ├── routes/
│   │   ├── authRoutes.js              ← /api/auth/* endpoints
│   │   └── employeeRoutes.js          ← /api/employee/* endpoints (with RBAC)
│   └── migrations/
│       └── 001_create_tables.sql      ← Database schema (30+ tables)
├── package.json
├── .env.example
└── Dockerfile
```

### Frontend Files
```
frontend/
├── src/
│   ├── main.jsx                       ← React entry point
│   ├── App.jsx                        ← Main router with protected routes
│   ├── components/
│   │   └── layouts/
│   │       └── MainLayout.jsx         ← Sidebar + top nav layout
│   ├── pages/
│   │   ├── LandingPage.jsx            ← Public homepage
│   │   ├── RegisterPage.jsx           ← Company registration
│   │   ├── LoginPage.jsx              ← User login
│   │   ├── DashboardPage.jsx          ← Main dashboard + time tracking
│   │   ├── AttendancePage.jsx         ← Attendance history
│   │   ├── ProfilePage.jsx            ← Employee profile view/edit
│   │   └── HRManagementPage.jsx       ← HR admin panel
│   ├── store/
│   │   └── authStore.js               ← Zustand auth state + localStorage
│   ├── services/
│   │   └── api.js                     ← Axios client with JWT interceptors
│   ├── styles/
│   │   └── globals.css                ← Global CSS + scrollbar styling
│   └── index.html
├── vite.config.js                     ← Vite config with API proxy
├── tailwind.config.js                 ← Emerald color palette
├── postcss.config.js                  ← PostCSS plugins
├── package.json
├── .env.example
└── Dockerfile
```

### Configuration Files
```
docker-compose.yml                    ← 4 services: PostgreSQL, Redis, Backend, Frontend
README.md                             ← Project overview
SETUP_GUIDE.md                        ← Complete setup & running instructions
PHASE_2_COMPLETION.md                 ← Detailed Phase 2 report
.github/
└── copilot-instructions.md          ← Development guidelines & roadmap
docs/
└── API_DOCUMENTATION.md             ← Full API endpoint specs with examples
```

---

## 🔗 Key Connections

### API Endpoint Map
```
/api/auth/register-company    ← authController.registerCompany()
/api/auth/login               ← authController.login()
/api/auth/refresh-token       ← authController.refreshToken()
/api/auth/logout              ← authController.logout()

/api/employee/attendance/sign-in        ← employeeController.signIn()
/api/employee/attendance/sign-out       ← employeeController.signOut()
/api/employee/attendance/status         ← employeeController.getStatus()
/api/employee/attendance/history        ← employeeController.getHistory()
/api/employee/dashboard                 ← employeeController.getDashboard()
/api/employee/profile                   ← employeeController.getProfile()
/api/employee/profile (PUT)             ← employeeController.updateProfile()

/api/employee/employees                 ← hrController.listEmployees()
/api/employee/employees/invite          ← hrController.inviteEmployee()
```

### Component Hierarchy
```
App.jsx
├── Public Routes
│   ├── LandingPage
│   ├── RegisterPage
│   └── LoginPage
└── Protected Routes (ProtectedRoute wrapper)
    ├── DashboardPage (uses MainLayout)
    ├── AttendancePage (uses MainLayout)
    ├── ProfilePage (uses MainLayout)
    ├── HRManagementPage (uses MainLayout)
    └── ChatPage (placeholder, uses MainLayout)

MainLayout.jsx
├── Sidebar (navigation)
├── TopNav (logo, search, notifications, user menu)
└── Page Content (children)
```

### State Management Flow
```
authStore (Zustand)
├── user (current user object)
├── token (JWT access token)
├── isAuthenticated (boolean)
└── Actions: setUser(), setToken(), logout()

API.js (Axios)
├── Request Interceptor
│   └── Adds JWT token to headers
└── Response Interceptor
    ├── On 401 → logout + redirect to "/"
    └── On other errors → pass to caller
```

---

## 🚀 How to Navigate the Code

### To Add New Employee Feature:
1. Create service in `backend/src/services/employeeService.js`
2. Create controller in `backend/src/controllers/employeeController.js`
3. Add route in `backend/src/routes/employeeRoutes.js` with RBAC
4. Create React page in `frontend/src/pages/YourFeaturePage.jsx`
5. Add route in `frontend/src/App.jsx` with ProtectedRoute
6. Add navigation link in `frontend/src/components/layouts/MainLayout.jsx`

### To Modify API Response:
1. Update query in service `backend/src/services/*.js`
2. Update controller `backend/src/controllers/*.js` if needed
3. Frontend automatically uses new data via `api.get()` call
4. Update component state if needed

### To Debug Frontend:
- Browser DevTools → Network tab → see all API calls
- Browser DevTools → Console → check for errors/logs
- Check localStorage for token in DevTools → Application tab

### To Debug Backend:
- Terminal logs from `npm run dev` show all requests
- Check database: `psql -U postgres -d heirs_business -c "SELECT * FROM employees;"`
- Test APIs directly: `curl http://localhost:3000/api/health`

---

## 📊 Database Relationships

```
companies
├── has many users
├── has many employees
├── has many departments
├── has many roles
└── has many permissions

users
├── belongs to company
├── has many user_roles
└── has many attendance_logs

employees
├── belongs to company
├── belongs to user
├── belongs to department
└── has many attendance_logs

roles
├── has many role_permissions
└── has many user_roles

attendance_logs
├── belongs to employee
└── daily_attendance (aggregated)

departments
├── belongs to company
└── has many employees
```

---

## 🔐 Authentication Flow

```
1. User registers: POST /api/auth/register-company
   → Creates company + user + admin role
   → Returns accessToken + refreshToken

2. User logs in: POST /api/auth/login
   → Validates credentials
   → Returns accessToken (15 min) + refreshToken (7 day)

3. Frontend stores tokens:
   → accessToken in Zustand + localStorage
   → refreshToken in localStorage

4. API calls:
   → Axios adds "Authorization: Bearer {token}" header
   → Backend middleware verifies JWT
   → If 401 → axios interceptor calls refresh-token
   → If 403 → user lacks permissions (RBAC)

5. Logout: POST /api/auth/logout
   → Clears localStorage
   → Redirects to login
```

---

## 📈 Data Flow Example: Sign-In

```
User clicks "Sign In" button
↓
DashboardPage.handleSignIn()
↓
api.post('/api/employee/attendance/sign-in')
↓
Backend: POST /api/employee/attendance/sign-in
  ├── Middleware: authenticate() - verify JWT
  ├── Controller: signIn()
  │   └── Service: attendanceService.signIn()
  │       ├── INSERT into attendance_logs (sign_in_time)
  │       └── Return result
  └── Response: { success: true, signInTime }
↓
Frontend receives response
↓
DashboardPage re-fetches dashboard data
↓
UI updates to show "Signed In" status
```

---

## 🛠️ Common Tasks

### Add a new column to employees
1. Create migration: `backend/migrations/002_add_column.sql`
2. Run: `docker-compose exec db psql -U postgres -d heirs_business -f migration.sql`
3. Update service queries to include new column
4. Update React form to show new field

### Create new role with permissions
1. Insert role: `INSERT INTO roles (company_id, name) VALUES (?, ?);`
2. Insert permissions: `INSERT INTO permissions (name) VALUES (?);`
3. Map permissions: `INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?);`
4. Check in middleware: `authorize(['role_name'])`

### Add new sidebar menu item
1. Edit `frontend/src/components/layouts/MainLayout.jsx`
2. Add NavLink component
3. Create new page in `frontend/src/pages/`
4. Add route in `frontend/src/App.jsx`
5. Make sure it's wrapped with ProtectedRoute

---

## 📝 Important Variables

### Environment Variables
- `VITE_API_URL` → Frontend knows where backend is
- `JWT_SECRET` → Server signs tokens (must match on server)
- `DB_` variables → PostgreSQL connection
- `REDIS_` variables → Redis connection

### Component Props
- `isAuthenticated` → From Zustand authStore
- `user` → Current user from authStore
- `setUser()`, `setToken()` → Zustand actions

### API Response Format
```javascript
{
  success: true,
  data: {...} or [...],
  error: "Error message if failed",
  message: "Human readable message"
}
```

---

## 🔍 Quick Debugging Checks

✅ **API not responding?**
- Check backend is running: `docker-compose logs backend`
- Check CORS: browser console for CORS errors

✅ **Login not working?**
- Verify email/password correct
- Check JWT_SECRET in both backend and frontend
- Check database has user with email

✅ **Dashboard not showing stats?**
- Check database has employees for company
- Verify API returns data: `curl http://localhost:3000/api/employee/dashboard`
- Check employee dashboard service query

✅ **Attendance not recording?**
- Check database attendance_logs table: `SELECT * FROM attendance_logs;`
- Check backend logs for errors
- Verify user is signed in (token valid)

---

**Last Updated:** 2024
**Version:** Phase 2 Complete
**Maintained By:** Copilot Agent

