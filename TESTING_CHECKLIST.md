# Manual Testing Checklist - Phase 2

## Pre-Test Setup
- [ ] All services running: `docker-compose up -d`
- [ ] Wait for services to start (~30 seconds)
- [ ] Frontend accessible: http://localhost:3001
- [ ] Backend accessible: http://localhost:3000
- [ ] Database populated with schema

---

## 1️⃣ Authentication Testing

### Company Registration
- [ ] Navigate to http://localhost:3001/register
- [ ] Fill in:
  - Company Name: "Test Company"
  - Email: "admin@testcompany.com"
  - First Name: "John"
  - Last Name: "Doe"
  - Password: "TestPass123"
- [ ] Click "Create Account"
- [ ] See success toast: "Company registered successfully!"
- [ ] Redirected to login page

**Database Check:**
```bash
docker-compose exec db psql -U postgres -d heirs_business -c "SELECT * FROM companies WHERE name = 'Test Company';"
```

### User Login
- [ ] On login page, enter:
  - Email: "admin@testcompany.com"
  - Password: "TestPass123"
- [ ] Click "Login"
- [ ] See success toast: "Logged in successfully"
- [ ] Redirected to dashboard
- [ ] Sidebar visible with user menu
- [ ] Token stored in localStorage

**Browser Check:**
```javascript
// In browser console
localStorage.getItem('auth-storage')
// Should show token and user data
```

### Invalid Login Attempts
- [ ] Try wrong password → See error toast
- [ ] Try non-existent email → See error toast
- [ ] Leave fields empty → See validation errors

---

## 2️⃣ Dashboard Testing

### Sign-In Functionality
- [ ] Click "Sign In" button on dashboard
- [ ] See success toast: "Signed in successfully"
- [ ] "Sign In" button changes to "Sign Out"
- [ ] Current time appears in "Signed in at"
- [ ] Status shows "Currently Signed In"

**Database Check:**
```bash
docker-compose exec db psql -U postgres -d heirs_business -c "SELECT * FROM attendance_logs ORDER BY created_at DESC LIMIT 1;"
```

### Sign-Out Functionality
- [ ] Click "Sign Out" button
- [ ] See success toast: "Signed out successfully"
- [ ] "Sign Out" button changes to "Sign In"
- [ ] Hours worked calculation appears
- [ ] Status shows "Signed Out"

**Database Check:**
```bash
docker-compose exec db psql -U postgres -d heirs_business -c "SELECT * FROM daily_attendance ORDER BY created_at DESC LIMIT 1;"
```

### Dashboard Statistics Cards
- [ ] 6 stat cards visible:
  - [ ] Total Employees (shows number)
  - [ ] Present Today (shows number)
  - [ ] New Hires (shows number)
  - [ ] Inventory Items (shows number)
  - [ ] Departments (shows number)
  - [ ] Notifications (shows number)
- [ ] All numbers are integers (not errors)

### Today's Attendance Log
- [ ] Table shows today's sign-in/out entries
- [ ] Each entry shows time and status
- [ ] After sign-in then sign-out: see both entries

---

## 3️⃣ Attendance History Testing

### Navigation
- [ ] Click "Attendance" in sidebar
- [ ] Page loads with table and filters

### Date Range Filtering
- [ ] Default view: Last 7 days
- [ ] Click "Last 30 Days" → Table updates
- [ ] Click "Last 90 Days" → Table updates
- [ ] Click "Last 180 Days" → Table updates
- [ ] Records shown match filter

### Attendance Data
- [ ] Table columns: Date, Hours Worked, Status
- [ ] Records show correctly formatted dates
- [ ] Hours show calculated duration
- [ ] Status shows "Present", "Absent", or "Late"

### Summary Statistics
- [ ] Total Days Present: correct count
- [ ] Average Hours/Day: calculated correctly
- [ ] Total Hours: sum of all hours
- [ ] Numbers match table data

**Formula Check:**
```
Total Days = count of non-empty dates
Average Hours = Total Hours / Total Days
Total Hours = sum of all "hours worked"
```

---

## 4️⃣ Employee Profile Testing

### View Profile
- [ ] Click "Profile" in sidebar
- [ ] Page loads with "Edit" button
- [ ] Shows fields:
  - Email (read-only, grayed out)
  - First Name
  - Last Name
  - Phone
  - Department
  - Designation
  - Bio/About
  - Hire Date (read-only)
- [ ] All fields populated with current data

### Edit Profile
- [ ] Click "Edit" button
- [ ] Form fields become editable
- [ ] Change First Name: "John" → "Johnny"
- [ ] Change Phone: add phone number
- [ ] Change Department: select from dropdown
- [ ] Click "Save"
- [ ] See success toast: "Profile updated successfully"
- [ ] Form returns to view mode
- [ ] Changes reflected in displayed data

**Database Check:**
```bash
docker-compose exec db psql -U postgres -d heirs_business -c "SELECT first_name, phone FROM employees WHERE user_id = (SELECT id FROM users WHERE email = 'admin@testcompany.com') LIMIT 1;"
```

### Edit Mode Validation
- [ ] Try saving with empty First Name → See error
- [ ] Try saving with invalid data → See validation error
- [ ] Cancel edit → Changes not saved

---

## 5️⃣ HR Management Testing (Admin Only)

### Access HR Page
- [ ] Click "HR Management" in sidebar
- [ ] Page loads with employee list

### Employee List
- [ ] Table columns: Name, Email, Department, Designation, Status, Join Date
- [ ] Current admin user shows in list
- [ ] All employees display correctly

### Invite New Employee
- [ ] Click "Invite Employee" button
- [ ] Modal opens with form fields:
  - Email
  - First Name
  - Last Name
  - Phone
  - Department
  - Designation

### Submit Invite
- [ ] Fill form with new employee data
- [ ] Click "Send Invite"
- [ ] See success toast: "Invite sent successfully"
- [ ] Modal closes
- [ ] New employee appears in list with status "Pending"

**Database Check:**
```bash
docker-compose exec db psql -U postgres -d heirs_business -c "SELECT * FROM employees WHERE status = 'Pending' ORDER BY created_at DESC LIMIT 1;"
```

### Validation
- [ ] Try inviting with empty email → Error
- [ ] Try inviting with invalid email → Error
- [ ] Try inviting with existing email → Error

---

## 6️⃣ Navigation Testing

### Sidebar Navigation
- [ ] Sidebar visible on left side
- [ ] Sidebar collapses/expands when clicked (if toggle present)
- [ ] All links highlighted when active
- [ ] Links work:
  - [ ] Dashboard
  - [ ] Attendance
  - [ ] Profile
  - [ ] HR Management
  - [ ] Chat (should show placeholder or disabled)
  - [ ] Documents (should show placeholder or disabled)
  - [ ] Inventory (should show placeholder or disabled)

### Top Navigation
- [ ] Logo/company name visible
- [ ] Search box present (placeholder)
- [ ] Notifications icon visible
- [ ] User profile menu visible
- [ ] Click user menu → See name, email, logout

### Routing
- [ ] Change URL directly: http://localhost:3001/dashboard → Works
- [ ] Change URL directly: http://localhost:3001/attendance → Works
- [ ] Change URL directly: http://localhost:3001/profile → Works
- [ ] Try to access protected route without login → Redirects to login

---

## 7️⃣ Authentication Flow Testing

### Session Persistence
- [ ] Login user
- [ ] Refresh page (F5)
- [ ] User still logged in (checked localStorage)
- [ ] Sidebar still visible

### Session Expiration
- [ ] Open browser DevTools
- [ ] Delete localStorage token
- [ ] Refresh page
- [ ] Redirected to login page

### Multiple Tabs
- [ ] Login in Tab 1
- [ ] Open Tab 2 to same URL
- [ ] Tab 2 should show logged in (shares localStorage)
- [ ] Logout in Tab 1
- [ ] Tab 2 should require login on any action

### Logout
- [ ] Click user menu → "Logout"
- [ ] See success message
- [ ] Redirected to landing page
- [ ] Cannot access protected routes
- [ ] localStorage cleared

---

## 8️⃣ Error Handling Testing

### Network Error
- [ ] Stop backend: `docker-compose stop backend`
- [ ] Try any action on dashboard
- [ ] See error toast: connection error
- [ ] Try to navigate to another page
- [ ] See error handling

### Invalid Data
- [ ] Try profile edit with very long name (1000+ chars)
- [ ] See validation error or truncation
- [ ] Try phone with non-numeric characters
- [ ] See validation error

### Permission Errors
- [ ] As non-admin, try accessing HR page
- [ ] Should see 403 Forbidden or no links (check implementation)

---

## 9️⃣ UI/UX Testing

### Responsive Design
- [ ] Desktop view (1920x1080) → All elements visible and aligned
- [ ] Tablet view (768x1024) → Sidebar collapses, content adjusts
- [ ] Mobile view (375x667) → Layout stacks vertically

### Color Scheme
- [ ] Emerald green buttons (#10B981)
- [ ] Emerald dark sidebar (#047857)
- [ ] Forms have green focus ring
- [ ] Success messages green, errors red

### Loading States
- [ ] Sign-in button shows "Signing in..." while loading
- [ ] Sign-out button shows "Signing out..." while loading
- [ ] Invite button shows "Sending..." while processing
- [ ] Submit buttons disabled while loading

### Accessibility
- [ ] Tab key navigates through form fields
- [ ] All buttons keyboard accessible
- [ ] Form labels associated with inputs
- [ ] Error messages announced to screen readers

---

## 🔟 API Integration Testing

### Health Check
```bash
curl http://localhost:3000/api/health
# Should return: { status: "OK" }
```

### Authentication Endpoints
```bash
# Register - should return tokens
curl -X POST http://localhost:3000/api/auth/register-company \
  -H "Content-Type: application/json" \
  -d '{"companyName":"Test","email":"test@test.com","password":"Test1234","adminFirstName":"Admin","adminLastName":"User"}'

# Login - should return tokens
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234"}'

# Refresh token - should return new access token
curl -X POST http://localhost:3000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

### Protected Endpoints (Requires Token)
```bash
# Set token variable
TOKEN="YOUR_ACCESS_TOKEN"

# Sign-in
curl -X POST http://localhost:3000/api/employee/attendance/sign-in \
  -H "Authorization: Bearer $TOKEN"

# Get dashboard
curl -X GET http://localhost:3000/api/employee/dashboard \
  -H "Authorization: Bearer $TOKEN"

# Get profile
curl -X GET http://localhost:3000/api/employee/profile \
  -H "Authorization: Bearer $TOKEN"
```

---

## 1️⃣1️⃣ Database Integrity Testing

### Data Relationships
```bash
# Check attendance logs for current user
docker-compose exec db psql -U postgres -d heirs_business -c "\
  SELECT a.*, e.first_name FROM attendance_logs a \
  JOIN employees e ON a.employee_id = e.id \
  ORDER BY a.created_at DESC LIMIT 5;"

# Check employee has correct company
docker-compose exec db psql -U postgres -d heirs_business -c "\
  SELECT e.id, e.first_name, c.name FROM employees e \
  JOIN companies c ON e.company_id = c.id \
  WHERE e.first_name = 'John' LIMIT 1;"

# Check user roles assigned
docker-compose exec db psql -U postgres -d heirs_business -c "\
  SELECT u.email, r.name FROM user_roles ur \
  JOIN users u ON ur.user_id = u.id \
  JOIN roles r ON ur.role_id = r.id;"
```

### Data Constraints
```bash
# Verify no orphaned records
docker-compose exec db psql -U postgres -d heirs_business -c "\
  SELECT * FROM employees WHERE company_id NOT IN (SELECT id FROM companies);"

# Verify all users have email
docker-compose exec db psql -U postgres -d heirs_business -c "\
  SELECT COUNT(*) FROM users WHERE email IS NULL;"
```

---

## 1️⃣2️⃣ Performance Testing

### Page Load Times
- [ ] Dashboard loads in < 2 seconds
- [ ] Attendance page loads in < 1 second
- [ ] HR page loads in < 1 second
- [ ] Profile page loads in < 1 second

### API Response Times
```bash
# Test response times
time curl http://localhost:3000/api/employee/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

### Database Query Performance
```bash
# Check slow queries
docker-compose exec db psql -U postgres -d heirs_business -c "\
  EXPLAIN ANALYZE SELECT * FROM attendance_logs \
  WHERE employee_id = 1 \
  ORDER BY created_at DESC LIMIT 10;"
```

---

## Test Results Summary

| Category | Status | Notes |
|----------|--------|-------|
| Authentication | ⏳ | |
| Dashboard | ⏳ | |
| Attendance History | ⏳ | |
| Employee Profile | ⏳ | |
| HR Management | ⏳ | |
| Navigation | ⏳ | |
| Auth Flow | ⏳ | |
| Error Handling | ⏳ | |
| UI/UX | ⏳ | |
| API Integration | ⏳ | |
| Database | ⏳ | |
| Performance | ⏳ | |

**Date Tested:** _______________
**Tester:** _______________
**Issues Found:** _______________

---

**Notes:**
- All tests assume default port configuration (3000 backend, 3001 frontend)
- Replace company/user data with your test data as needed
- Watch browser console (F12) for JavaScript errors
- Watch backend logs: `docker-compose logs -f backend`

---

**Phase 2 Comprehensive Testing Guide**
Version 1.0 | 2024

