<script setup lang="ts">

definePageMeta({
  middleware: 'auth'
})

const store = useScheduleStore()
const authStore = useAuthStore()

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

const daysInMonth = new Date(currentDate.value.year, currentDate.value.month, 0).getDate()

const selectedDays = ref<Set<number>>(new Set())
const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']


const calendarCells = computed(() => {
  const cells: (number | null)[] = []
  const firstDay = new Date(currentDate.value.year, currentDate.value.month-1, 1).getDay()
  const start = firstDay === 0 ? 6 : firstDay - 1
  for (let i = 0; i < start; i++) cells.push(null)
  for (let i = 1; i <= daysInMonth; i++) cells.push(i)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
})

const statusConfig = {
  work:     { label: 'Работа',           bg: '#EAF3DE', color: '#27500A', dot: '#639922' },
  day_off:  { label: 'Удалённая работа', bg: '#FAEEDA', color: '#633806', dot: '#854F0B' },
  vacation: { label: 'Отпуск',           bg: '#E6F1FB', color: '#0C447C', dot: '#185FA5' },
  sick:     { label: 'Больничный',       bg: '#FAECE7', color: '#712B13', dot: '#993C1D' },
}

type StatusKey = 'work' | 'vacation' | 'sick' | 'day_off'

function getDateString(day: number) {
  return `${store.currentMonth}-${String(day).padStart(2, '0')}`
}

function getCellStatus(day: number): StatusKey {
  return store.getStatus(authStore.user.id, getDateString(day)) as StatusKey
}

onMounted(async () => {
  await store.fetchSchedule()
})

function isWeekend(day: number) {
  const date = new Date(currentDate.value.year, currentDate.value.month - 1, day)
  return date.getDay() === 0 || date.getDay() === 6
}

const activeDropdown = ref<number | null>(null)

function onClick(day: number) {
  if (isWeekend(day)) return
  if (activeDropdown.value === day) {
    activeDropdown.value = null
  } else {
    activeDropdown.value = day
  }
}

async function selectStatus(status: string) {
  if (activeDropdown.value === null) return
  await store.updateStatus(authStore.user.id, getDateString(activeDropdown.value), status)
  activeDropdown.value = null
}

function closeDropdown() {
  activeDropdown.value = null
}

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

</script>



<template>
  <div @click="closeDropdown" class="calendar-page">
    <div class="cal-header">
      <button @click.stop="prevMonth" class="arrow-btn">‹</button>
      <div class="cal-title">
        <span class="cal-month">{{  monthName }}</span>
        <span class="cal-year">2026</span>
      </div>
      <button @click.stop="nextMonth" class="arrow-btn">›</button>
    </div>

    <div class="cal-grid">
      <div v-for="d in weekDays" :key="d" class="cal-weekday">{{ d }}</div>

      <div
        v-for="(day, i) in calendarCells"
        :key="i"
        class="cal-cell"
        :class="{
          empty: day === null,
          weekend: day && isWeekend(day),
          selected: day && selectedDays.has(day),
        }"
        @click.stop="day && onClick(day)"
        :style="[
        day && !isWeekend(day) ? { background: statusConfig[getCellStatus(day)].bg } : {},
        { zIndex: activeDropdown === day ? 50 : 1, position: 'relative' }
      ]"
      >
        <span v-if="day" class="cal-day-num">{{ day }}</span>
        <span v-if="day && !isWeekend(day)"
         class="cal-status-dot"
         :style="{ background: statusConfig[getCellStatus(day)].dot }"
         ></span>
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
      {{ cfg.label }}
      </div>
      </div>
    </div>
    </div>

    <!-- панель для множественного выделения -->
    <div v-if="false" class="bulk-bar">
      <span class="bulk-count">Выбрано дней: 5</span>
      <div class="bulk-actions">
        <div class="bulk-btn" style="background:#EAF3DE;color:#27500A">Работа</div>
        <div class="bulk-btn" style="background:#FAEEDA;color:#633806">Удалённая работа</div>
        <div class="bulk-btn" style="background:#E6F1FB;color:#0C447C">Отпуск</div>
        <div class="bulk-btn" style="background:#FAECE7;color:#712B13">Больничный</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  user-select: none;
}
.cal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-bottom: 20px;
}
.arrow-btn {
  font-size: 28px;
  background: none;
  border: none;
  cursor: pointer;
  color: #1a1a1a;
  padding: 0 8px;
}
.arrow-btn:hover { color: #6b7280; }
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
.cal-cell:hover:not(.empty):not(.weekend) {
  filter: brightness(0.95);
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
.cal-day-num {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}
.cal-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #639922;
  margin-top: auto;
  align-self: flex-end;
}
.cal-dropdown {
  position: absolute;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  min-width: 160px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  z-index: 100;
}
.cal-dropdown-item {
  padding: 8px 14px;
  font-size: 13px;
  cursor: pointer;
}
.cal-dropdown-item:hover { filter: brightness(0.95); }
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
.bulk-btn:hover { filter: brightness(0.95); }
</style>