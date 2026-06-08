<script setup lang = "ts">
  const authStore = useAuthStore()

  function logout() {
    authStore.logout()
    navigateTo('/login')
  }
</script  >

<template>
  <div>
    <header class="topbar">
      <div class="topbar-inner">
        <div class="topbar-brand">
          📅 Табель
        </div>
        <nav class="topbar-nav">
          <NuxtLink to="/" class="nav-tab">Общий табель</NuxtLink>
          <NuxtLink to="/employees" class="nav-tab">Сотрудники</NuxtLink>
        </nav>
        <div class="topbar-right">
          <button class="btn-logout" @click='logout'>Выйти</button>
          <select class="month-select">
            <option>Июль 2026</option>
            <option>Август 2026</option>
          </select>
        </div>
      </div>
    </header>
    <main class="page-content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.topbar {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  height: 52px;
}
.topbar-inner {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 24px;
  gap: 16px;
}
.topbar-brand {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  margin-right: 16px;
}
.topbar-nav {
  display: flex;
  height: 52px;
  gap: 4px;
}
.nav-tab {
  display: flex;
  align-items: center;
  padding: 0 16px;
  font-size: 13px;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  text-decoration: none;
  transition: color 0.15s;
}
.nav-tab:hover { color: #1a1a1a; }
.nav-tab.router-link-active {
  color: #1a1a1a;
  font-weight: 500;
  border-bottom-color: #1a1a1a;
}
.topbar-right {
  margin-left: auto;
}
.month-select {
  font-size: 13px;
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  color: #1a1a1a;
  cursor: pointer;
}
.page-content {
  padding: 20px 24px;
  background: #f5f5f5;
  min-height: calc(100vh - 52px);
}

.btn-logout {
  font-size: 13px;
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  color: #1a1a1a;
  cursor: pointer;
}
.btn-logout:hover {
  background: #f3f4f6;
}
</style>