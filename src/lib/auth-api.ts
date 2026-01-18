import { apiClient } from './api'
import type { AuthResponse, LoginCredentials, RegisterCredentials, User } from '@/types/auth'

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', credentials)
    return response.data
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/api/auth/register', credentials)
    return response.data
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<{ id: string; email: string; name: string | null }>('/api/auth/me')
    return response.data
  },

  logout: () => {
    localStorage.removeItem('voice-shopper-auth-token')
  }
}
