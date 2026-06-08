export default defineNuxtRouteMiddleware(() => {
    const authStore = useAuthStore

    if (!authStore) {
        return navigateTo("/login")
    }
})