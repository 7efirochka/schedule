<template>
  <div>
    <header class="topbar">
      <div class="topbar-inner">
        <div class="topbar-brand">📅 Табель</div>

        <nav class="topbar-nav">

          <NuxtLink to="/" class="nav-tab">Общий табель</NuxtLink>

            <ClientOnly>
              <NuxtLink
              :to="'/calendar/' + authStore.user?.email"
              class="nav-tab">Личный график
            </NuxtLink>
            </ClientOnly>
          
          <NuxtLink to="/summary" class="nav-tab">Итоговая таблица</NuxtLink>

          <div class="nav-spacer"></div>

          <div class="month-picker-wrap">

            <button class="month-btn" @click.stop="showPicker = !showPicker">
              Выборка по периоду: &nbsp; <span style="color: darkorange">{{ formatDate(scheduleStore.currentMonth) }}</span> ▾
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

          <div class="nav-spacer"></div>
        </nav>



        <div class="topbar-right">
          <div v-show="authStore.user" class="user">Вход выполнен: <b>{{ currentUser?.display_name }}</b></div>

          <ClientOnly>
            <button  v-if="authStore.user" class="btn-logout" @click="logout">Выйти</button>
            <button v-else class="btn-logout" @click="logout">Войти</button>
          </ClientOnly>
        </div>

      </div>
    </header>
    <main class="page-content" @click="showPicker = false">
      <slot />
    </main>
  </div>
</template>




<script setup lang="ts">


const scheduleStore = useScheduleStore()
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

const currentMonthNum = computed(() => Number(scheduleStore.currentMonth.split('-')[1]))
const currentYearNum = computed(() => Number(scheduleStore.currentMonth.split('-')[0]))

const currentUser = computed(() => scheduleStore.mergedUsers.find(u => u.email === authStore.user?.email))


function selectMonth(monthValue: number) {
  const m = String(monthValue).padStart(2, '0')
  scheduleStore.setMonth(`${selectedYear.value}-${m}`)
  showPicker.value = false
}


function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru", { month: 'long', year: 'numeric' })
}


function logout() {
  authStore.logout()
  navigateTo('/login')
}



onMounted(async () => {
  await scheduleStore.initialize()

  // Генерируем список месяцев
  scheduleStore.generateMonths()

  // Загружаем все данные
  console.log('🚀 Начало загрузки данных...')
  await scheduleStore.fetchAllData()
  console.log('📊 Данные успешно загружены.')
})
</script>


<style scoped>

.topbar {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  height: 62px;
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
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-right: 16px;
}
.topbar-nav {
  display: flex;
  align-items: center;
  height: 62px;
  gap: 7px;
  flex: 1;
}

.nav-spacer {
  flex: 1;
}

.page-content {
  /* padding: 20px 24px; */
  background: #ffffff;
  min-height: calc(100vh - 62px);
  padding-top: 54px;
}

.nav-tab {
  display: flex;
  align-items: center;
  padding: 0 16px;
  font-size: 16px;
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
  font-size: 16px;
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff9ef;
  color: #1a1a1a;
  cursor: pointer;
}
.month-btn:hover { background: #f3f4f6; }
.month-picker {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: #fff9ef;
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
  font-size: 16px;
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
  font-size: 16px;
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
  font-size: 16px;
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  color: #1a1a1a;
  cursor: pointer;
}
.btn-logout:hover { background: #f3f4f6; }

.user {
  padding: 7px;
  border: 1px solid lightblue;
  border-radius: 10px;
      box-shadow: 0 10px 10px -5px rgba(0, 0, 0, 0.1), 0 1px 10px -1px rgba(0, 0, 0, 0.08), 0 1px 20px -1px rgba(0, 0, 0, 0.06);
}


</style>