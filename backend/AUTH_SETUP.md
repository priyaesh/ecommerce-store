# Authentication System Setup

The e-commerce website now includes a complete user authentication system with JWT tokens.

## Backend Setup

### Environment Variables

Create a `.env` file in the `backend` folder with:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/ecommerce-store
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d
```

**Important:** Change `JWT_SECRET` to a strong, random string in production!

### API Endpoints

#### Public Endpoints:
- `POST /api/auth/register` - Register a new user
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```

- `POST /api/auth/login` - Login user
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

#### Protected Endpoints (require Bearer token):
- `GET /api/auth/me` - Get current user
  Headers: `Authorization: Bearer <token>`

- `PUT /api/auth/updateprofile` - Update user profile
  Headers: `Authorization: Bearer <token>`
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "123-456-7890",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    }
  }
  ```

## Frontend Pages

- `/login` - Login page
- `/register` - Registration page
- `/profile` - User profile (protected, requires login)

## Features

1. **User Registration** - Users can create accounts with name, email, and password
2. **User Login** - Secure login with JWT token generation
3. **Protected Routes** - Profile page requires authentication
4. **User Profile** - Users can update their profile and shipping address
5. **Checkout Integration** - Checkout automatically uses authenticated user's email
6. **Password Hashing** - Passwords are hashed with bcrypt before storage
7. **Token Storage** - JWT tokens stored in localStorage
8. **Auto-logout** - Invalid tokens automatically log users out

## User Model

Users are stored in MongoDB with:
- Name, email, password (hashed)
- Role (user/admin)
- Address information
- Phone number
- Timestamps

## Security Features

- Passwords are hashed with bcrypt (10 salt rounds)
- JWT tokens expire after 30 days (configurable)
- Protected routes verify tokens on each request
- Passwords are never returned in API responses
- Email validation on registration

## Testing the Auth System

1. **Register a new user:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Test User","email":"test@example.com","password":"test123"}'
   ```

2. **Login:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'
   ```

3. **Get user profile (with token):**
   ```bash
   curl http://localhost:5000/api/auth/me \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

## Frontend Usage

The authentication context is available throughout the app:

```typescript
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { user, isAuthenticated, login, logout, token } = useAuth();
  
  // Use auth state
}
```

## Next Steps

- Add password reset functionality
- Add email verification
- Add order history for users
- Add admin dashboard
- Add social login (Google, Facebook)

