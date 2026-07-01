// stores/useAuthStore.ts
import { defineStore } from 'pinia'

interface User {
  id: string
  email: string
  roles: string[]
}

interface AuthResponse {
  token: string
  user: User
}

interface VerifyResponse {
  valid: boolean
  user?: User
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    token: null as string | null,
    isAuthenticated: false,
    isLoading: false
  }),

  getters: {
    isAdmin: (state) => state.user?.roles?.includes('admin') || false,
    isManager: (state) => state.user?.roles?.includes('manager') || false,
    isServiceManager: (state) => state.user?.roles?.includes('serviceManager') || false,
    hasRole: (state) => (role: string) => state.user?.roles?.includes(role) || false
  },

  actions: {
    setUser(authResponse: AuthResponse) {
      this.user = authResponse.user
      this.token = authResponse.token
      this.isAuthenticated = true
      this.isLoading = false

      if (import.meta.client) {
        localStorage.setItem('auth_token', authResponse.token)
        localStorage.setItem('auth_user', JSON.stringify(authResponse.user))
      }
    },

    logout() {
      this.user = null
      this.token = null
      this.isAuthenticated = false
      this.isLoading = false

      if (import.meta.client) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
    },

    loadFromStorage() {
      if (import.meta.client) {
        const token = localStorage.getItem('auth_token')
        const userStr = localStorage.getItem('auth_user')

        if (token && userStr) {
          try {
            const user = JSON.parse(userStr)
            this.token = token
            this.user = user
            this.isAuthenticated = true
            return true
          } catch {
            this.logout()
            return false
          }
        }
      }
      return false
    },

    async verifyToken() {
      if (!this.token) {
        this.logout()
        return false
      }

      this.isLoading = true

      try {
        const response = await $fetch<VerifyResponse>('/api/auth/verify', {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        })

        if (response.valid && response.user) {
          this.user = response.user
          this.isAuthenticated = true
          
          // Обновляем данные в localStorage
          if (import.meta.client) {
            localStorage.setItem('auth_user', JSON.stringify(response.user))
          }
          
          return true
        } else {
          this.logout()
          return false
        }
      } catch {
        this.logout()
        return false
      } finally {
        this.isLoading = false
      }
    },

    // ✅ Добавляем метод для инициализации приложения
    async init() {
      if (import.meta.client) {
        // Сначала загружаем из localStorage
        const hasStorage = this.loadFromStorage()
        
        // Если есть токен, проверяем его
        if (hasStorage && this.token) {
          await this.verifyToken()
        }
        
        return this.isAuthenticated
      }
      return false
    }
  }
})