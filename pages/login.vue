<script setup lang="ts">
definePageMeta({
  layout: false
})

const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

async function login() {
  if (!email.value || !password.value) {
    error.value = 'Заполните все поля'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    const response: any = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value
      }
    })

    if (response.token) {
      authStore.setUser(response)
      navigateTo('/')
    }
  } catch (err: any) {
    error.value = err.statusMessage || 'Неверный email или пароль'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-wrapper">
    <div class="auth-card">
      <h2 class="auth-title">Вход в систему</h2>
      <p class="auth-sub">Введите ваши данные для входа</p>

      <div class="form-group">
        <label class="form-label">Email</label>
        <input
          type="email"
          class="form-input"
          placeholder="vas@atlas-pro24.ru"
          v-model="email"
          @keydown.enter="login"
        />
      </div>

      <div class="form-group">
        <label class="form-label">Пароль</label>
        <input
          type="password"
          class="form-input"
          placeholder="Введите пароль"
          v-model="password"
          @keydown.enter="login"
        />
      </div>

      <button class="btn-submit" @click="login" :disabled="isLoading">
        {{ isLoading ? 'Вход...' : 'Войти' }}
      </button>

      <p class="auth-error" v-if="error">{{ error }}</p>
    </div>
  </div>
</template>

<style scoped>
.auth-wrapper {
  min-height: calc(100vh - 62px);
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
  position: relative;
  top: -60px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
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
.btn-submit:hover:not(:disabled) {
  background: #333333;
}
.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.auth-error {
  font-size: 13px;
  color: #dc2626;
  margin-top: 12px;
  text-align: center;
}
</style>