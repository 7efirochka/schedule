

<template>
  <div
    v-if="store.mergedUsers.length"
    @click="closeDropdown"
    class="calendar-page">
    
    <!-- Шапка с информацией о сотруднике -->
    <div class="cal-owner">
      <div class="cal-owner-left">

        <div class="d-flex">
          <div class="card">
            <div class="cal-owner-dept">Календарь сотрудника: </div>
            <div class="cal-owner-name">
              {{ currentEmployee?.display_name || currentEmployee?.user_name || currentEmployee?.email || 'Сотрудник не найден' }}
            </div>
        </div>
        <div class="card">
          <div class="cal-owner-dept">Подразделение:</div>
          <div class="cal-owner-name">
            {{ currentEmployee?.department || 'нет' }}
          </div>
        </div>
        </div>

      </div>

      <div v-if="isAdmin" class="emp-search-wrap" @click.stop>
        <input
          v-model="searchQuery"
          class="emp-search"
          placeholder="Сменить сотрудника..."
          @focus="showSearch = true"
        />
        <div v-if="showSearch && searchQuery" class="emp-search-list">
          <div
            v-for="emp in filteredEmployees"
            :key="emp.email || emp.id"
            class="emp-search-item"
            @click="navigateTo(`/calendar/${emp.email || emp.id}`); showSearch = false; searchQuery = ''"
          >
            <span class="emp-search-name">{{ emp.display_name || emp.user_name || emp.email }}</span>
            <span class="emp-search-dept">{{ emp.department || '' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Заголовок с навигацией -->
    <div class="cal-header">
      <button @click.stop="prevMonth" class="arrow-btn">‹</button>
      <div class="cal-title">
        <span class="cal-month">{{ monthName }}</span>
        <span class="cal-year">{{ currentDate.year }}</span>
      </div>
      <button @click.stop="nextMonth" class="arrow-btn">›</button>
    </div>

    <!-- Календарь -->
    <div :key="refreshKey" class="cal-grid">
      <div v-for="d in weekDays" :key="d" class="cal-weekday">{{ d }}</div>

      <div
        v-for="(day, i) in calendarCells"
        :key="i"
        class="cal-cell"
        :class="{
          empty: day === null,
          weekend: day && isWeekend(day),
          selected: day && selectedDays.has(day),
          today: day && isToday(day),
        }"
        @click.stop="day && onClick(day)"
        :style="[
          day && !isWeekend(day) ? { background: statusConfig[getCellStatus(day)].bg } : {},
          { zIndex: activeDropdown === day ? 50 : 1, position: 'relative' }
        ]"
      >
        <span v-if="day" class="cal-day-num">{{ day }}</span>

        <span v-if="day && !isWeekend(day)" class="cal-status-dot">
          {{ statusConfig[getCellStatus(day)].icon }}
        </span>

        <!-- Выпадающий список для выбора статуса -->
        <div
          v-if="activeDropdown !== null && activeDropdown === day"
          class="cal-dropdown"
          @click.stop
        >
          <div
            v-for="(cfg, key) in statusConfig"
            :key="key"
            class="cal-dropdown-item"
            :style="{ background: cfg.bg, color: cfg.color }"
            @click.stop="selectStatus(key)"
          >
            {{ cfg.icon }} {{ cfg.label }}
          </div>
        </div>
      </div>
    </div>

    <!-- Панель для множественного выделения -->
    <div v-if="selectedDays.size > 1" class="bulk-bar" @click.stop>
      <span class="bulk-count">Выбрано дней: {{ selectedDays.size }}</span>
      <div class="bulk-actions">
        <div
          v-for="(cfg, key) in statusConfig"
          :key="key"
          class="bulk-btn"
          :style="{ background: cfg.bg, color: cfg.color }"
          @click="applyBulkStatus(key)"
        >
          {{ cfg.icon }} {{ cfg.label }}
        </div>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { useAuthStore } from '~/stores/useAuthStore'
import { useScheduleStore } from '~/stores/useScheduleStore'


const route = useRoute()
const store = useScheduleStore()
const authStore = useAuthStore()

// Получаем ID сотрудника из URL
const empEmail = route.params.id as string

// Состояния
const refreshKey = ref(0)
const searchQuery = ref('')
const showSearch = ref(false)
const activeDropdown = ref<number | null>(null)
const rangeStart = ref<number | null>(null)
const selectedDays = ref<Set<number>>(new Set())

// Текущий сотрудник из mergedUsers (а не из employees)
const currentEmployee = computed(() => {
  
  return store.mergedUsers.find((e: any) => {
    return String(e?.email) === String(empEmail)
  })
})



// Фильтр сотрудников для поиска
const filteredEmployees = computed(() => {
  if (!searchQuery.value) return store.mergedUsers
  return store.mergedUsers.filter((e: any) => {
    const name = e.display_name || e.user_name || e.email
    return name.toLowerCase().includes(searchQuery.value.toLowerCase())
  })
})

// Права администратора
const isAdmin = computed(() => authStore.user?.roles.includes('admin'))

// Текущая дата и месяц
const today = new Date()
const currentDate = computed(() => {
  const [year, month] = store.currentMonth.split('-').map(Number)
  return { year, month }
})

const monthName = computed(() => {
  const date = new Date(currentDate.value.year, currentDate.value.month - 1, 1)
  return date.toLocaleString('ru', { month: 'long' }).toUpperCase()
})

const firstDayOfMonth = computed(() => {
  const day = new Date(currentDate.value.year, currentDate.value.month - 1, 1).getDay()
  return day === 0 ? 6 : day - 1
})

const daysInMonth = computed(() => 
  new Date(currentDate.value.year, currentDate.value.month, 0).getDate()
)

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

// Календарная сетка
const calendarCells = computed(() => {
  const cells: (number | null)[] = []
  const firstDay = new Date(currentDate.value.year, currentDate.value.month - 1, 1).getDay()
  const start = firstDay === 0 ? 6 : firstDay - 1
  for (let i = 0; i < start; i++) cells.push(null)
  for (let i = 1; i <= daysInMonth.value; i++) cells.push(i)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
})

// Конфигурация статусов
const statusConfig = {
  work: { label: 'Работа', bg: '#EAF3DE', color: '#27500A', dot: '#639922', icon: '💼' },
  day_off: { label: 'Удалёнка', bg: '#FAEEDA', color: '#633806', dot: '#854F0B', icon: '🏠' },
  vacation: { label: 'Отпуск', bg: '#E6F1FB', color: '#0C447C', dot: '#185FA5', icon: '✈️' },
  sick: { label: 'Больничный', bg: '#FAECE7', color: '#712B13', dot: '#993C1D', icon: '🌡️' },
}

type StatusKey = 'work' | 'vacation' | 'sick' | 'day_off'

// Вспомогательные функции
function getDateString(day: number) {
  return `${store.currentMonth}-${String(day).padStart(2, '0')}`
}

function getCellStatus(day: number): StatusKey {
  return store.getStatus(currentEmployee.value.email, getDateString(day)) as StatusKey
}

function isWeekend(day: number) {
  const date = new Date(currentDate.value.year, currentDate.value.month - 1, day)
  return date.getDay() === 0 || date.getDay() === 6
}

function isToday(day: number) {
  return day === today.getDate() &&
    currentDate.value.month === today.getMonth() + 1 &&
    currentDate.value.year === today.getFullYear()
}

// Навигация по месяцам
function prevMonth() {
  const [year, month] = store.currentMonth.split('-').map(Number)
  const date = new Date(year, month - 2, 1)
  store.setMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
}

function nextMonth() {
  const [year, month] = store.currentMonth.split('-').map(Number)
  const date = new Date(year, month, 1)
  store.setMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
}

// Работа с выделением и статусами
function onClick(day: number) {
  if (!isAdmin.value) return
  if (isWeekend(day)) return

  if (rangeStart.value === null) {
    rangeStart.value = day
    selectedDays.value = new Set([day])
    activeDropdown.value = null
  } else if (rangeStart.value === day) {
    rangeStart.value = null
    selectedDays.value = new Set()
    activeDropdown.value = day
  } else {
    const start = Math.min(rangeStart.value, day)
    const end = Math.max(rangeStart.value, day)
    const newSet = new Set<number>()
    for (let d = start; d <= end; d++) {
      if (!isWeekend(d)) newSet.add(d)
    }
    selectedDays.value = newSet
    rangeStart.value = null
    activeDropdown.value = null
  }
}



function closeDropdown() {
  activeDropdown.value = null
  rangeStart.value = null
  selectedDays.value = new Set()
}



async function selectStatus(status: string) {
  if (activeDropdown.value === null) return
  await store.updateStatus(currentEmployee.value.email, getDateString(activeDropdown.value), status)
  activeDropdown.value = null
  refreshKey.value++
}



async function applyBulkStatus(status: string) {
  for (const day of selectedDays.value) {
    await store.updateStatus(currentEmployee.value.email, getDateString(day), status)
  }
  await store.fetchSchedule()
  selectedDays.value = new Set()
  refreshKey.value++
}



// Загрузка данных при монтировании
onMounted(async () => {
  await store.fetchMergedUsers()
  await store.fetchSchedule()
})
</script>


<style scoped>
.calendar-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  user-select: none;
}

.cal-owner {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 24px;
}

.cal-owner-left {
  display: flex;
  flex-direction: column;
}

.cal-owner-name {
  font-size: 18px;
  font-weight: 500;
  color: #1a1a1a;
}

.cal-owner-dept {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

.emp-search-wrap {
  position: relative;
  width: 220px;
}

.emp-search {
  width: 100%;
  font-size: 13px;
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  outline: none;
}

.emp-search:focus {
  border-color: #9ca3af;
}

.emp-search-list {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 100%;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  z-index: 100;
  max-height: 200px;
  overflow-y: auto;
}

.emp-search-item {
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;
}

.emp-search-item:hover {
  background: #f3f4f6;
}

.emp-search-name {
  font-weight: 500;
  color: #1a1a1a;
}

.emp-search-dept {
  font-size: 11px;
  color: #6b7280;
}

.cal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 70px;
  margin-bottom: 20px;
  position: relative;
}

.arrow-btn {
  font-size: 28px;
  background: none;
  border: none;
  cursor: pointer;
  color: #1a1a1a;
  padding: 0 8px;
  position: absolute;
}

.arrow-btn:first-child {
  left: calc(50% - 190px);
}

.arrow-btn:last-child {
  right: calc(50% - 190px);
}

.arrow-btn:hover {
  color: #6b7280;
}

.cal-title {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cal-month {
  font-size: 36px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: 0.04em;
}

.cal-year {
  font-size: 14px;
  color: #6b7280;
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.cal-weekday {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  padding: 6px 0;
}

.cal-cell {
  position: relative;
  aspect-ratio: 1;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 8px;
  background: #ffffff;
  transition: filter 0.1s;
}

/* Псевдоэлемент для затемнения при наведении */
.cal-cell:hover:not(.empty):not(.weekend)::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.05); /* или 0.08 для более заметного эффекта */
  border-radius: 8px;
  pointer-events: none; /* 🔥 КЛИКИ ПРОХОДЯТ СКВОЗЬ ПСЕВДОЭЛЕМЕНТ */
  z-index: 1;
}

.cal-cell:hover:not(.empty):not(.weekend) {
  filter: none; /* brightness(0.95); */
}

.cal-cell.empty {
  border: none;
  background: transparent;
  cursor: default;
}

.cal-cell.weekend {
  background: #f3f4f6;
  cursor: default;
}

.cal-cell.selected {
  outline: 2px solid #1a1a1a;
  outline-offset: -2px;
}

.cal-cell.today {
  outline: 2px solid #1a1a1a;
  outline-offset: -2px;
}

.cal-cell.today .cal-day-num {
  color: #ffffff;
  background: #1a1a1a;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.cal-day-num {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.cal-status-dot {
  font-size: 12px;
  margin-top: auto;
  align-self: flex-end;
  line-height: 1;
}

.cal-dropdown {
  position: absolute;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  min-width: 160px;
  padding: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  z-index: 100;
  filter: brightness(1) !important;
}

.cal-dropdown-item {
  padding: 8px 14px;
  font-size: 13px;
  cursor: pointer;
}

.cal-dropdown-item:hover {
  filter: brightness(0.95);
}

.bulk-bar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #1a1a1a;
  color: #ffffff;
  border-radius: 12px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  z-index: 200;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
}

.bulk-actions {
  display: flex;
  gap: 8px;
}

.bulk-btn {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 500;
}

.bulk-btn:hover {
  filter: brightness(0.95);
}
</style>