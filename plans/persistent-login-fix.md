# Persistent Login Fix

## Problem Analysis

Users are being logged out when they close and reopen the app, even though the authentication system is designed to keep them logged in.

### Current Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Login/Register Flow                     │
└─────────────────────────────────────────────────────────────┘
    │
    ├─ User enters credentials
    ├─ Backend validates and returns JWT token (expires in 7 days)
    ├─ Token stored in localStorage: 'voice-shopper-auth-token'
    └─ User state set in AuthContext

┌─────────────────────────────────────────────────────────────┐
│                  App Mount (on Reopen)                     │
└─────────────────────────────────────────────────────────────┘
    │
    ├─ AuthProvider mounts
    ├─ checkAuth() called in useEffect
    ├─ Retrieves token from localStorage
    ├─ Calls authApi.getCurrentUser() to validate token
    ├─ If successful: user state set
    └─ If fails: token removed, user logged out

┌─────────────────────────────────────────────────────────────┐
│                 API Request Interceptor                     │
└─────────────────────────────────────────────────────────────┘
    │
    ├─ Every request includes Bearer token from localStorage
    └─ On 401 error: token removed, redirect to login
```

### Root Causes Identified

1. **No User Data Persistence**
   - Only JWT token is stored in localStorage
   - User data (name, email, id) must be re-fetched from backend on every app load
   - If `/api/auth/me` endpoint fails (network error, server down), user is logged out even with valid token

2. **Inconsistent Token Storage**
   - `login()` uses `setAuthToken()` helper (uses STORAGE_KEYS.AUTH_TOKEN)
   - `register()` uses direct `localStorage.setItem('voice-shopper-auth-token')`
   - Both use same key, but inconsistent approach

3. **Error Handling in checkAuth**
   - If `authApi.getCurrentUser()` fails for any reason, user is logged out
   - No fallback to restore user from localStorage
   - No distinction between "invalid token" vs "network error"

4. **Loading State Management**
   - `isLoading` starts as `true` and only set to `false` in `checkAuth()`
   - If checkAuth fails, loading state is set to false but user is logged out
   - No graceful degradation for offline scenarios

## Solution Design

### Architecture Changes

```
┌─────────────────────────────────────────────────────────────┐
│              Enhanced Authentication Flow                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Login/Register                           │
└─────────────────────────────────────────────────────────────┘
    │
    ├─ Backend validates credentials
    ├─ Returns JWT token + user data
    ├─ Store BOTH token and user data in localStorage
    │   - 'voice-shopper-auth-token': JWT token
    │   - 'voice-shopper-user-data': User object
    └─ Set user state in AuthContext

┌─────────────────────────────────────────────────────────────┐
│                  App Mount (on Reopen)                     │
└─────────────────────────────────────────────────────────────┘
    │
    ├─ AuthProvider mounts
    ├─ checkAuth() called in useEffect
    ├─ Retrieve BOTH token and user data from localStorage
    │
    ├─ If BOTH exist:
    │   ├─ Set user state from localStorage (immediate)
    │   ├─ Try to validate token with backend (background)
    │   ├─ If validation succeeds: keep user logged in
    │   └─ If validation fails (invalid token): logout
    │
    ├─ If only token exists (no user data):
    │   ├─ Fetch user data from backend
    │   ├─ If successful: save user data to localStorage
    │   └─ If fails: logout
    │
    └─ If neither exists: user is not logged in

┌─────────────────────────────────────────────────────────────┐
│                 Error Handling                            │
└─────────────────────────────────────────────────────────────┘
    │
    ├─ Network error during validation:
    │   └─ Keep user logged in (use cached data)
    │
    ├─ 401 Unauthorized (invalid token):
    │   └─ Clear localStorage and logout
    │
    └─ Other errors:
        └─ Log error, keep user logged in
```

### Implementation Plan

#### Step 1: Update Storage Helpers

**File: `src/lib/storage.ts`**

Add user data persistence functions:

```typescript
// Add to STORAGE_KEYS object
const STORAGE_KEYS = {
  CURRENT_LIST: "grocerli-current-list",
  HISTORY: "grocerli-history",
  SAVED_RECIPES: "grocerli-saved-recipes",
  AUTH_TOKEN: "voice-shopper-auth-token",
  USER_DATA: "voice-shopper-user-data", // NEW
} as const;

// Add user data storage functions
export const setUserData = (user: User): void => {
  localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
};

export const getUserData = (): User | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (stored) {
      return JSON.parse(stored) as User;
    }
  } catch (error) {
    console.error("Failed to load user data from localStorage:", error);
  }
  return null;
};

export const clearUserData = (): void => {
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
};
```

#### Step 2: Update AuthContext

**File: `src/contexts/AuthContext.tsx`**

Key changes:

1. **Import new storage helpers**
2. **Update login function** to save user data
3. **Update register function** to use consistent token storage and save user data
4. **Update logout function** to clear user data
5. **Enhance checkAuth function** with fallback to localStorage

```typescript
// Enhanced checkAuth function
const checkAuth = async () => {
  try {
    const token = getAuthToken();
    const cachedUser = getUserData();

    // If we have both token and cached user data, use it immediately
    if (token && cachedUser) {
      setUser(cachedUser);

      // Validate token in background
      try {
        const currentUser = await authApi.getCurrentUser();
        setUser(currentUser); // Update with fresh data
        setUserData(currentUser); // Update cache
      } catch (error) {
        // If validation fails, check if it's a network error or invalid token
        if (error.response?.status === 401) {
          // Invalid token - logout
          logout();
        } else {
          // Network error - keep user logged in with cached data
          console.error("Failed to validate token, using cached data:", error);
        }
      }
    } else if (token) {
      // Token exists but no cached user - fetch from backend
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
      setUserData(currentUser);
    }
    // If neither exists, user is not logged in
  } catch (error) {
    console.error("Auth check failed:", error);
    // Don't auto-logout on network errors
    if (error.response?.status === 401) {
      logout();
    }
  } finally {
    setIsLoading(false);
  }
};
```

#### Step 3: Update API Interceptor

**File: `src/lib/api.ts`**

Enhance error handling to distinguish between network errors and auth errors:

```typescript
// Handle auth errors
apiClient.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    // Only logout on 401 (invalid token), not on network errors
    if (error.response?.status === 401) {
      localStorage.removeItem("voice-shopper-auth-token");
      localStorage.removeItem("voice-shopper-user-data");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
```

#### Step 4: Update Logout Flow

**File: `src/contexts/AuthContext.tsx`**

Ensure logout clears all auth-related data:

```typescript
const logout = () => {
  authApi.logout();
  clearAuthToken();
  clearUserData(); // NEW
  setUser(null);
};
```

### Benefits of This Approach

1. **Immediate App Load**
   - User data loaded from localStorage instantly
   - No waiting for backend validation
   - Better UX for returning users

2. **Offline Support**
   - Users can access app even when backend is down
   - Cached user data provides basic functionality
   - Graceful degradation for network issues

3. **Security Maintained**
   - Token still validated in background
   - Invalid tokens still result in logout
   - User data is just cached, not used for auth decisions

4. **Consistent Storage**
   - All auth data uses helper functions
   - Single source of truth for storage keys
   - Easier to maintain and debug

### Testing Checklist

- [ ] Login with valid credentials
- [ ] Close app and reopen - user stays logged in
- [ ] Refresh page - user stays logged in
- [ ] Logout works correctly and clears all data
- [ ] Network error during validation - user stays logged in
- [ ] Invalid/expired token - user is logged out
- [ ] Register new user - user stays logged in after registration
- [ ] Multiple browser tabs - auth state synced

### Migration Path

1. Existing users with only token stored will fetch user data on next load
2. New users will have both token and user data stored
3. No breaking changes to existing authentication flow
4. Backward compatible with current implementation

### Security Considerations

1. **Token Expiration**
   - JWT tokens expire after 7 days
   - Background validation will catch expired tokens
   - Users will be logged out when token expires

2. **User Data Freshness**
   - User data is cached but validated on each app load
   - Fresh data fetched from backend on successful validation
   - Stale data only used temporarily during network errors

3. **XSS Protection**
   - localStorage is accessible to JavaScript
   - Consider using httpOnly cookies for production
   - Sanitize user data before storage

### Future Enhancements

1. **Refresh Token Implementation**
   - Add refresh tokens for longer sessions
   - Automatically refresh access tokens before expiration
   - Reduce need for re-authentication

2. **Cookie-Based Auth**
   - Use httpOnly cookies for token storage
   - More secure than localStorage
   - Prevents XSS attacks

3. **Biometric Auth**
   - Add Touch ID/Face ID support
   - Quick re-authentication
   - Enhanced security

## Files to Modify

1. `src/lib/storage.ts` - Add user data storage functions
2. `src/contexts/AuthContext.tsx` - Update auth flow with user data caching
3. `src/lib/api.ts` - Enhance error handling
4. `src/types/auth.ts` - Ensure User type is exported for storage

## Implementation Order

1. Update storage helpers (add user data functions)
2. Update AuthContext (implement new auth flow)
3. Update API interceptor (enhance error handling)
4. Test all authentication flows
5. Deploy and monitor for issues
