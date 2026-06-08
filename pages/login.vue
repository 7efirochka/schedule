<script setup lang="ts">
const authStore = useAuthStore()

    const email = ref('')
    const error = ref('')

    async function login(){
        try {
        const data = await $fetch('/api/auth', {
            method: "POST",
            body: { email: email.value }
        })
        console.log("Пользователь найден")
        authStore.setUser(data)
        navigateTo("/")
        } catch (e) {
            error.value = "Пользователь не найден"
        }
    }
</script>


<template>
  <div class="auth-wrapper">
    <div class="auth-card">
      <h2 class="auth-title">Вход в систему</h2>
      <p class="auth-sub">Введите ваш email чтобы войти</p>

      <div class="form-group">
        <label class="form-label">Email</label>
        <input
          type="email"
          class="form-input"
          placeholder="ivanov@company.ru"
          v-model="email"
        />
      </div>

      <button class="btn-submit" @click="login">Войти</button>

      <p class="auth-error" v-if="error">{{ error }}</p>
    </div>
  </div>
</template>

<style scoped>
.auth-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}
.auth-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
}
.auth-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 6px;
}
.auth-sub {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 28px;
}
.form-group {
  margin-bottom: 16px;
}
.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
  margin-bottom: 6px;
}
.form-input {
  width: 100%;
  padding: 9px 12px;
  font-size: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  outline: none;
  color: #1a1a1a;
  background: #ffffff;
  box-sizing: border-box;
  transition: border-color 0.15s;
}
.form-input:focus {
  border-color: #9ca3af;
}
.btn-submit {
  width: 100%;
  padding: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  background: #1a1a1a;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.15s;
}
.btn-submit:hover {
  background: #333333;
}
.auth-error {
  font-size: 13px;
  color: #dc2626;
  margin-top: 12px;
  text-align: center;
}
</style>