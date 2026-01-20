import React, { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '@/lib/auth-api'
import { setAuthToken, clearAuthToken, getAuthToken, setUserData, clearUserData, getUserData } from '@/lib/storage'
import type { AuthContextType, User, LoginCredentials, RegisterCredentials } from '@/types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  const checkAuth = async () => {
    try {
      const token = getAuthToken()
      const cachedUser = getUserData()

      // If we have both token and cached user data, use it immediately
      if (token && cachedUser) {
        setUser(cachedUser)

        // Validate token in background
        try {
          const currentUser = await authApi.getCurrentUser()
          setUser(currentUser) // Update with fresh data
          setUserData(currentUser) // Update cache
        } catch (error: any) {
          // If validation fails, check if it's a network error or invalid token
          if (error.response?.status === 401) {
            // Invalid token - logout
            logout()
          } else {
            // Network error - keep user logged in with cached data
            console.error('Failed to validate token, using cached data:', error)
          }
        }
      } else if (token) {
        // Token exists but no cached user - fetch from backend
        const currentUser = await authApi.getCurrentUser()
        setUser(currentUser)
        setUserData(currentUser)
      }
      // If neither exists, user is not logged in
    } catch (error) {
      console.error('Auth check failed:', error)
      // Don't auto-logout on network errors
      const errorObj = error as any
      if (errorObj.response?.status === 401) {
        logout()
      }
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (credentials: LoginCredentials) => {
    const response = await authApi.login(credentials)
    setAuthToken(response.token)
    setUserData(response.user)
    setUser(response.user)
  }

  const register = async (credentials: RegisterCredentials) => {
    const response = await authApi.register(credentials)
    setAuthToken(response.token)
    setUserData(response.user)
    setUser(response.user)
  }

  const logout = () => {
    authApi.logout()
    clearAuthToken()
    clearUserData()
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
