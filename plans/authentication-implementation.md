# Authentication Implementation Plan

## Overview

Implement full authentication flow for Grocerli app with required authentication before accessing the main application.

## Current State Analysis

### Backend (Already Implemented)

- **Authentication Routes**: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- **Security**: JWT tokens with bcrypt password hashing (10 salt rounds)
- **Middleware**: `authenticate` middleware for protected routes
- **Database**: User model with email, passwordHash, name, preferences, lists, recipes
- **Protected Routes**: Lists and recipes routes already use authentication middleware

### Frontend (Partially Implemented)

- **API Client**: Axios instance with auth token interceptors
- **Token Storage**: Uses `localStorage.getItem('voice-shopper-auth-token')`
- **Auth Interceptor**: Adds `Bearer ${token}` to requests
- **Error Handling**: Redirects to `/login` on 401 errors
- **Missing**: Auth UI components, protected routes, auth context

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         App.tsx                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  AuthProvider (Manages auth state)                      │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  BrowserRouter (React Router)                       │  │  │
│  │  │  ┌───────────────────────────────────────────────┐  │  │  │
│  │  │  │  Public Routes:                             │  │  │  │
│  │  │  │  - / → LandingPage                         │  │  │  │
│  │  │  │  - /login → LoginPage                      │  │  │  │
│  │  │  │  - /register → RegisterPage                 │  │  │  │
│  │  │  │                                           │  │  │  │
│  │  │  │  Protected Routes (ProtectedRoute):          │  │  │  │
│  │  │  │  - /app → GroceryApp (redirects if no auth)│  │  │  │
│  │  │  └───────────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Steps

### Step 1: Create Authentication Types

**File**: `src/types/auth.ts`

```typescript
export interface User {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}
```

### Step 2: Create Auth API Functions

**File**: `src/lib/auth-api.ts`

```typescript
import { apiClient } from "./api";
import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
} from "@/types/auth";

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      "/api/auth/login",
      credentials,
    );
    return response.data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      "/api/auth/register",
      credentials,
    );
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<{
      id: string;
      email: string;
      name: string | null;
    }>("/api/auth/me");
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("voice-shopper-auth-token");
  },
};
```

### Step 3: Create AuthProvider Context

**File**: `src/contexts/AuthContext.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '@/lib/auth-api'
import type { AuthContextType, User, LoginCredentials, RegisterCredentials } from '@/types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('voice-shopper-auth-token')
      if (token) {
        const currentUser = await authApi.getCurrentUser()
        setUser(currentUser)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      authApi.logout()
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (credentials: LoginCredentials) => {
    const response = await authApi.login(credentials)
    localStorage.setItem('voice-shopper-auth-token', response.token)
    setUser(response.user)
  }

  const register = async (credentials: RegisterCredentials) => {
    const response = await authApi.register(credentials)
    localStorage.setItem('voice-shopper-auth-token', response.token)
    setUser(response.user)
  }

  const logout = () => {
    authApi.logout()
    setUser(null)
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

### Step 4: Create ProtectedRoute Component

**File**: `src/components/ProtectedRoute.tsx`

```typescript
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
```

### Step 5: Create LoginPage Component

**File**: `src/pages/LoginPage.tsx`

```typescript
import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import type { LoginCredentials } from '@/types/auth'

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { login } = useAuth()

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/app'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login({ email, password })
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      })
      navigate(from, { replace: true })
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.response?.data?.error || 'Please check your credentials and try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Grocerli</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
```

### Step 6: Create RegisterPage Component

**File**: `src/pages/RegisterPage.tsx`

```typescript
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import type { RegisterCredentials } from '@/types/auth'

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match.',
        variant: 'destructive',
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      await register({ email, password, name: name || undefined })
      toast({
        title: 'Account created!',
        description: 'Welcome to Grocerli!',
      })
      navigate('/app', { replace: true })
    } catch (error: any) {
      toast({
        title: 'Registration failed',
        description: error.response?.data?.error || 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>Sign up to start using Grocerli</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
```

### Step 7: Update App.tsx with AuthProvider and Protected Routes

**File**: `src/App.tsx`

```typescript
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { GroceryApp } from "./components/GroceryApp";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { LandingPage } from "./pages/LandingPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <GroceryApp />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
```

### Step 8: Update LandingPage to Link to Login

**File**: `src/pages/LandingPage.tsx`

Change line 32 from:

```typescript
to = "/app";
```

to:

```typescript
to = "/login";
```

### Step 9: Add Logout Functionality to GroceryApp

**File**: `src/components/GroceryApp.tsx`

Add logout button in header:

```typescript
import { useAuth } from '@/contexts/AuthContext'
import { LogOut } from 'lucide-react'

// Inside GroceryApp component
const { user, logout } = useAuth()

// Add logout handler
const handleLogout = () => {
  logout()
  window.location.href = '/login'
}

// Add logout button in header section
<div className="flex items-center justify-between py-4 md:py-6">
  <div className="flex-1">
    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center">
      Grocerli
    </h1>
  </div>
  <Button
    variant="ghost"
    size="sm"
    onClick={handleLogout}
    className="text-muted-foreground hover:text-foreground"
  >
    <LogOut className="w-4 h-4 mr-2" />
    <span className="hidden sm:inline">Logout</span>
  </Button>
</div>
```

## File Structure After Implementation

```
src/
├── contexts/
│   └── AuthContext.tsx           # NEW: Auth state management
├── components/
│   ├── ProtectedRoute.tsx         # NEW: Route protection wrapper
│   ├── GroceryApp.tsx             # MODIFIED: Add logout button
│   └── ui/                       # (existing shadcn components)
├── pages/
│   ├── LoginPage.tsx               # NEW: Login form
│   ├── RegisterPage.tsx           # NEW: Register form
│   ├── LandingPage.tsx            # MODIFIED: Link to /login
│   └── (other pages)
├── types/
│   └── auth.ts                   # NEW: Authentication types
├── lib/
│   ├── auth-api.ts                # NEW: Auth API functions
│   ├── api.ts                    # EXISTING: API client with interceptors
│   └── (other lib files)
└── App.tsx                       # MODIFIED: Add AuthProvider and protected routes
```

## Testing Checklist

- [ ] User can register with valid credentials
- [ ] User cannot register with duplicate email
- [ ] User can login with correct credentials
- [ ] User cannot login with incorrect credentials
- [ ] Auth token is stored in localStorage
- [ ] Auth token is sent with API requests
- [ ] Protected routes redirect to login when not authenticated
- [ ] User stays logged in after page refresh
- [ ] Logout clears token and redirects to login
- [ ] 401 errors redirect to login page
- [ ] Loading state shows during auth check
- [ ] Form validation works (email format, password matching, etc.)

## Security Considerations

1. **JWT Secret**: Backend uses `process.env.JWT_SECRET` - ensure this is set in production
2. **Token Expiration**: JWT tokens expire after 7 days
3. **HTTPS Required**: Web Speech API requires HTTPS, auth also benefits from secure context
4. **Password Requirements**: Minimum 6 characters enforced on frontend
5. **Token Storage**: Using localStorage (consider httpOnly cookies for production)

## Notes

- Backend authentication is already fully implemented and tested
- Frontend API client already has auth interceptors configured
- This implementation focuses on adding the UI layer and state management
- The existing localStorage key `voice-shopper-auth-token` is maintained for consistency
