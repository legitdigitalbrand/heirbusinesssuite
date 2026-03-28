# REST API Documentation - Heirs Business Suite

## Base URL
`http://localhost:3000/api`

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer {accessToken}
```

## Error Responses
```json
{
  "error": "Error message",
  "status": 400,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Auth Endpoints

### Register Company
**POST** `/auth/register-company`

Request:
```json
{
  "companyName": "Acme Corp",
  "email": "admin@acme.com",
  "password": "SecurePassword123",
  "adminFirstName": "John",
  "adminLastName": "Doe",
  "phone": "+1234567890"
}
```

Response:
```json
{
  "message": "Company and admin user created successfully",
  "data": {
    "company": {
      "id": "uuid",
      "name": "Acme Corp",
      "email": "admin@acme.com"
    },
    "user": {
      "id": "uuid",
      "email": "admin@acme.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

### Login
**POST** `/auth/login`

Request:
```json
{
  "email": "admin@acme.com",
  "password": "SecurePassword123"
}
```

Response:
```json
{
  "message": "Login successful",
  "data": {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token",
    "user": {
      "id": "uuid",
      "email": "admin@acme.com",
      "firstName": "John",
      "lastName": "Doe",
      "companyId": "uuid"
    }
  }
}
```

### Refresh Token
**POST** `/auth/refresh-token`

Request:
```json
{
  "refreshToken": "refresh-token"
}
```

Response:
```json
{
  "data": {
    "accessToken": "new-jwt-token"
  }
}
```

### Logout
**POST** `/auth/logout`

Headers:
```
Authorization: Bearer {accessToken}
```

Response:
```json
{
  "message": "Logout successful"
}
```

## Common Status Codes
- `200 OK` - Request successful
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Rate Limiting
- 100 requests per 15 minutes per IP address
- Returns `429 Too Many Requests` when exceeded

## WebSocket Events (Chat)
```javascript
// Connect
io.connect('http://localhost:3000', {
  auth: { token: accessToken }
})

// Listen for new messages
socket.on('message:new', (data) => {
  console.log(data)
})

// Send message
socket.emit('message:send', {
  channelId: 'uuid',
  content: 'Hello!'
})
```

## Additional Endpoints (To Be Implemented)

### Inventory
- `GET /inventory/products`
- `POST /inventory/products`
- `GET /inventory/stock`
- `POST /inventory/transactions`

### HR
- `GET /hr/employees`
- `POST /hr/employees/invite`
- `GET /hr/attendance`
- `POST /hr/attendance/sign-in`

### Chat
- `GET /chat/channels`
- `POST /chat/channels`
- `GET /chat/channels/:id/messages`
- `POST /chat/channels/:id/messages`

### Documents
- `POST /documents/upload`
- `GET /documents`
- `GET /documents/:id/download`

## Integration Example

```javascript
import api from './services/api'

// Register company
const registerResponse = await api.post('/api/auth/register-company', {
  companyName: 'My Company',
  email: 'admin@mycompany.com',
  password: 'Password123',
  adminFirstName: 'Admin',
  adminLastName: 'User'
})

// Login
const loginResponse = await api.post('/api/auth/login', {
  email: 'admin@mycompany.com',
  password: 'Password123'
})

const { accessToken } = loginResponse.data.data
// Use accessToken for authenticated requests
```
