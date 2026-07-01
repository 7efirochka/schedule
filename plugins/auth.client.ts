// plugins/auth.client.ts
export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  
  // ✅ Инициализируем авторизацию при старте приложения
  await authStore.init()
  
  console.log('🔐 Auth initialized:', authStore.isAuthenticated)
})