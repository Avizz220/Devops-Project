# Authentication Flow Documentation

## Overview
The application now has a complete authentication system with protected routes. Users must log in before accessing the dashboard.

## Authentication Flow

### 1. **Initial App Load**
- When the app starts, it checks `localStorage` for saved user data
- If **NO user data found**: Redirects to `/login` page
- If **user data EXISTS**: Shows the dashboard at `/`
- While checking, displays a loading screen

### 2. **Login Process**
**Route**: `/login`

1. User enters email and password
2. Form submits to backend API: `POST http://localhost:4000/api/auth/login`
3. If successful:
   - User data saved to `localStorage` and auth context
   - Success message displayed (SweetAlert2)
   - **Automatically redirects to Dashboard** (`/`)
4. If failed:
   - Error message displayed
   - User stays on login page

### 3. **Signup Process**
**Route**: `/signup`

1. User enters name, email, password, and role
2. Form submits to backend API: `POST http://localhost:4000/api/auth/signup`
3. If successful:
   - Success message displayed
   - **Redirects to Login page** (`/login`)
   - User must log in with new credentials
4. If failed:
   - Error message displayed
   - User stays on signup page

### 4. **Protected Dashboard Access**
**Route**: `/` (root)

- **Protected Route**: Requires authentication
- If user is NOT logged in: Redirects to `/login`
- If user IS logged in: Shows the dashboard with:
  - Fixed sidebar with navigation
  - User profile section
  - Stats cards
  - Charts and analytics
  - Browse events functionality
  - Logout button

### 5. **Logout Process**
1. User clicks "Logout" button in dashboard sidebar
2. User data removed from `localStorage` and auth context
3. **Redirects to Login page** (`/login`)

## Route Protection Summary

| Route | Access | Redirect If Not Logged In |
|-------|--------|---------------------------|
| `/` (Dashboard) | Protected | → `/login` |
| `/home` | Protected | → `/login` |
| `/login` | Public | If logged in → `/` |
| `/signup` | Public | If logged in → `/` |

## Technical Implementation

### Auth Context (`App.jsx`)
```javascript
const AuthContext = createContext(null);

// Provides:
- isLoggedIn: boolean
- login(userData): saves user and updates state
- logout(): removes user and updates state
```

### Components Using Auth

1. **App.jsx**
   - Creates `AuthContext.Provider`
   - Manages global `isLoggedIn` state
   - Protects routes with conditional rendering

2. **Login.jsx**
   - Uses `useAuth()` hook
   - Calls `login(userData)` on success
   - Navigates to dashboard

3. **Dashboard.jsx**
   - Uses `useAuth()` hook
   - Calls `logout()` when user clicks logout
   - Navigates back to login

## Testing the Flow

### Test Scenario 1: First-time User
1. ✅ Open http://localhost:3000 → Should show login page
2. ✅ Click "Sign up now" → Goes to signup page
3. ✅ Fill form and submit → Success message, redirects to login
4. ✅ Enter credentials → Success message, redirects to dashboard
5. ✅ Dashboard loads with user name displayed

### Test Scenario 2: Returning User
1. ✅ Open http://localhost:3000 → Shows dashboard (if still logged in)
2. ✅ Try accessing `/login` → Redirects to dashboard
3. ✅ Click logout → Returns to login page

### Test Scenario 3: Unauthorized Access
1. ✅ Clear localStorage (browser DevTools)
2. ✅ Try to access http://localhost:3000 → Redirects to login
3. ✅ Try to access http://localhost:3000/home → Redirects to login

## Security Notes

- User credentials stored in `localStorage` (cleared on logout)
- All protected routes check authentication before rendering
- Backend validates credentials with MySQL database
- Passwords stored with bcrypt hashing in database

## Current Test User
You can test with existing users in the database or create a new account via signup.

---

**Last Updated**: November 7, 2025
**Servers**: Frontend (port 3000) | Backend (port 4000) | MySQL (port 3306)
