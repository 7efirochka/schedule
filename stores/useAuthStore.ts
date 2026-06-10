import { defineStore } from "pinia"

export const useAuthStore = defineStore("auth", {
    state: () => ({
    user: null as any
}), 

    actions: {
        setUser(user: any) {
            this.user = user
        },
        logout() {
            this.user = null
        }
    }
})

