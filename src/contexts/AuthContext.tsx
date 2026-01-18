import React, { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '@/lib/auth-api'
import { setAuthToken, clearAuthToken, getAuthToken } from '@/lib/storage'
import type { AuthContextType, User, LoginCredentials, RegisterCredentials } from '@/types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  const checkAuth = async () => {
    try {
      const token = getAuthToken()
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
    setAuthToken(response.token)
    setUser(response.user)
  }

  const register = async (credentials: RegisterCredentials) => {
    const response = await authApi.register(credentials)
    localStorage.setItem('voice-shopper-auth-token', response.token)
    setUser(response.user)
  }

  const logout = () => {
    authApi.logout()
    clearAuthToken()
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
