// middleware/auth.global.ts
export default defineNuxtRouteMiddleware(async (to) => {
  // ✅ Игнорируем на сервере
  if (import.meta.server) {
    return
  }
  
  const authStore = useAuthStore()
  
  // ✅ Убеждаемся, что авторизация инициализирована
  if (!authStore.isLoading) {
    await authStore.init()
  }
  
  // ✅ Если это страница логина - пропускаем
  if (to.path === '/login') {
    // Если уже авторизован - редирект на главную
    if (authStore.isAuthenticated) {
      return navigateTo('/')
    }
    return
  }
  
  // ✅ Если не авторизован - редирект на логин
  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
})