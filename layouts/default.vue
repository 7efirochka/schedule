<script setup lang="ts">
import { productionCalendar } from '~/data/productionCalendar'

const store = useScheduleStore()
const authStore = useAuthStore()

const showPicker = ref(false)
const selectedYear = ref(new Date().getFullYear())

const years = [
  new Date().getFullYear() - 1,
  new Date().getFullYear(),
  new Date().getFullYear() + 1,
]

const months = [
  { value: 1,  label: 'Янв' },
  { value: 2,  label: 'Фев' },
  { value: 3,  label: 'Мар' },
  { value: 4,  label: 'Апр' },
  { value: 5,  label: 'Май' },
  { value: 6,  label: 'Июн' },
  { value: 7,  label: 'Июл' },
  { value: 8,  label: 'Авг' },
  { value: 9,  label: 'Сен' },
  { value: 10, label: 'Окт' },
  { value: 11, label: 'Ноя' },
  { value: 12, label: 'Дек' },
]

const currentMonthNum = computed(() => Number(store.currentMonth.split('-')[1]))
const currentYearNum = computed(() => Number(store.currentMonth.split('-')[0]))

function selectMonth(monthValue: number) {
  const m = String(monthValue).padStart(2, '0')
  store.setMonth(`${selectedYear.value}-${m}`)
  showPicker.value = false
}

const showCalendar = ref(false)
const calendarYear = computed(() => Number(store.currentMonth.split('-')[0]))

const calendarData = computed(() => productionCalendar[calendarYear.value])

const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']

function logout() {
  authStore.logout()
  navigateTo('/login')
}
</script>

<template>
  <div>
    <header class="topbar">
      <div class="topbar-inner">
        <div class="topbar-brand">📅 Табель</div>
        <nav class="topbar-nav">
          <NuxtLink to="/" class="nav-tab">Общий табель</NuxtLink>
          <NuxtLink :to="`/calendar/${authStore.user?.id}`" class="nav-tab">Личный график</NuxtLink>
          <NuxtLink to="/summary" class="nav-tab">Итоговая таблица</NuxtLink>
          <!-- Для производственного календаря -->
          <div class="nav-spacer"></div>
          <div
            class="nav-tab cal-trigger"
            @mouseenter="showCalendar = true"
            @mouseleave="showCalendar = false"
          >
            📅 Производственный календарь

            <div v-if="showCalendar" class="prod-calendar" @mouseenter="showCalendar = true">
              <table class="prod-table">
                <thead>
                  <tr>
                    <th class="prod-label">Показатель</th>
                    <th v-for="(m, i) in monthNames" :key="i" class="prod-month">{{ m }}</th>
                  </tr>
                </thead>
                <tbody v-if="calendarData">
                  <tr>
                    <td class="prod-label">Календарных дней</td>
                    <td v-for="(d, i) in calendarData.calendar" :key="i">{{ d }}</td>
                  </tr>
                  <tr>
                    <td class="prod-label">Рабочих дней</td>
                    <td v-for="(d, i) in calendarData.working" :key="i" class="working">{{ d }}</td>
                  </tr>
                  <tr>
                    <td class="prod-label">Предпраздничных дней</td>
                    <td v-for="(d, i) in calendarData.preholiday" :key="i" :class="{ highlight: d > 0 }">{{ d }}</td>
                  </tr>
                </tbody>
                <tbody v-else>
                  <tr><td colspan="13" class="no-data">Нет данных за {{ calendarYear }}</td></tr>
                </tbody>
              </table>
            </div>
            </div>
        </nav>
        <div class="topbar-right">
          <div class="month-picker-wrap">
            <button class="month-btn" @click.stop="showPicker = !showPicker">
              {{ store.currentMonth }} ▾
            </button>
            <div v-if="showPicker" class="month-picker" @click.stop>
              <div class="year-row">
                <button
                  v-for="y in years"
                  :key="y"
                  class="year-btn"
                  :class="{ active: selectedYear === y }"
                  @click="selectedYear = y"
                >
                  {{ y }}
                </button>
              </div>
              <div class="months-grid">
                <div
                  v-for="m in months"
                  :key="m.value"
                  class="month-card"
                  :class="{
                    active: m.value === currentMonthNum && selectedYear === currentYearNum,
                    current: m.value === new Date().getMonth() + 1 && selectedYear === new Date().getFullYear()
                  }"
                  @click="selectMonth(m.value)"
                >
                  {{ m.label }}
                </div>
              </div>
            </div>
          </div>
          <span v-if="authStore.user">{{ authStore.user.name }}</span>
          <button  v-if="authStore.user" class="btn-logout" @click="logout">Выйти</button>
          <button v-else class="btn-logout" @click="logout">Войти</button>
        </div>
      </div>
    </header>
    <main class="page-content" @click="showPicker = false">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.topbar {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  height: 52px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
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
  gap: 7px;
  flex: 1;
}

.nav-spacer {
  flex: 1;
}

.page-content {
  padding: 20px 24px;
  background: #ffffff;
  min-height: calc(100vh - 52px);
  margin-top: 52px;
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
  display: flex;
  align-items: center;
  gap: 12px;
}
.month-picker-wrap {
  position: relative;
}
.month-btn {
  font-size: 13px;
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  color: #1a1a1a;
  cursor: pointer;
}
.month-btn:hover { background: #f3f4f6; }
.month-picker {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px;
  width: 240px;
  z-index: 300;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.year-row {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
  justify-content: center;
}
.year-btn {
  padding: 4px 14px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #ffffff;
  color: #1a1a1a;
  cursor: pointer;
}
.year-btn:hover { background: #f3f4f6; }
.year-btn.active {
  background: #1a1a1a;
  color: #ffffff;
  border-color: #1a1a1a;
}
.months-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}
.month-card {
  padding: 8px 4px;
  text-align: center;
  font-size: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.15s;
}
.month-card:hover { background: #f3f4f6; }
.month-card.active {
  background: #1a1a1a;
  color: #ffffff;
  border-color: #1a1a1a;
}
.month-card.current {
  border-color: #1a1a1a;
  font-weight: 500;
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
.btn-logout:hover { background: #f3f4f6; }

/* для производственного календаря */
.cal-trigger {
  position: relative;
  cursor: default;
}
.prod-calendar {
  position: absolute;
  top: 52px;
  right: 0;
  left: auto;
  z-index: 500;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  padding: 12px;
  white-space: nowrap;
}
.prod-table {
  border-collapse: collapse;
  font-size: 12px;
}
.prod-table th,
.prod-table td {
  border: 1px solid #e5e7eb;
  padding: 5px 10px;
  text-align: center;
}
.prod-table th {
  background: #f3f4f6;
  font-weight: 500;
}
th.prod-label,
td.prod-label {
  text-align: left;
  min-width: 160px;
  background: #f3f4f6;
}
td.working {
  color: #27500A;
  background: #EAF3DE;
}
td.highlight {
  color: #993C1D;
  font-weight: 500;
}
.no-data {
  color: #9ca3af;
  padding: 12px;
}
</style>