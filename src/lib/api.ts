import axios from 'axios'

/**
 * Normalize API base URL by removing trailing slashes
 * Ensures consistent path concatenation
 */
function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL || 'http://localhost:3001')

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add auth token to requests
apiClient.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('auth-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
apiClient.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    // Only logout on 401 (invalid token), not on network errors
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-token')
      localStorage.removeItem('user-data')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export { apiClient }
