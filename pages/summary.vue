<script setup lang="ts">
import { productionCalendar } from '~/data/productionCalendar'
import { useAuthStore } from '~/stores/useAuthStore'
import { useScheduleStore } from '~/stores/useScheduleStore'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const scheduleStore = useScheduleStore()

// ✅ Используем storeToRefs для реактивности
const { mergedUsers, schedule, isLoading, error } = storeToRefs(scheduleStore)

// Состояния
const selectedYear = ref(new Date().getFullYear())
const searchQuery = ref('')
const filterDept = ref('')
const isAdmin = computed(() => authStore.user?.roles?.includes('admin'))

// ✅ Проверяем, загружены ли данные
const isDataLoaded = computed(() => mergedUsers.value && mergedUsers.value.length > 0)

// Загрузка данных при монтировании
onMounted(async () => {


  if (!isDataLoaded.value) {
    await scheduleStore.fetchAllData()
  }
})

// ✅ Функции для производственного календаря
function getCalendarDays(month: number) {
  return productionCalendar[selectedYear.value]?.calendar[month - 1] ?? '—'
}

function getWorkingDays(month: number) {
  return productionCalendar[selectedYear.value]?.working[month - 1] ?? '—'
}

function getPreHolidays(month: number) {
  return productionCalendar[selectedYear.value]?.preholiday[month - 1] ?? '—'
}

function getWorkingHours(month: number) {
  const days = productionCalendar[selectedYear.value]?.working[month - 1] ?? 0
  const pre = productionCalendar[selectedYear.value]?.preholiday[month - 1] ?? 0
  return days * 8 - pre
}

// ✅ Месяцы
const months = [
  { value: '01', label: 'Янв' },
  { value: '02', label: 'Фев' },
  { value: '03', label: 'Мар' },
  { value: '04', label: 'Апр' },
  { value: '05', label: 'Май' },
  { value: '06', label: 'Июн' },
  { value: '07', label: 'Июл' },
  { value: '08', label: 'Авг' },
  { value: '09', label: 'Сен' },
  { value: '10', label: 'Окт' },
  { value: '11', label: 'Ноя' },
  { value: '12', label: 'Дек' },
]

// ✅ Формируем данные для таблицы из mergedUsers
const summaryData = computed(() => {
  if (!mergedUsers.value || !Array.isArray(mergedUsers.value)) {
    return []
  }

  return mergedUsers.value.map((user: any) => {
    const email = user.email || ''
    const displayName = user.display_name || user.user_name || email
    const department = user.department || ''
    
    // ✅ Собираем статистику по месяцам
    const monthsData: Record<string, { vacation: number; sick: number; dayoff: number }> = {}
    
    // Инициализируем все месяцы нулями
    months.forEach(m => {
      const key = `${selectedYear.value}-${m.value}`
      monthsData[key] = { vacation: 0, sick: 0, dayoff: 0 }
    })
    
    // ✅ Считаем статусы из schedule
    if (user.schedule && Array.isArray(user.schedule)) {
      user.schedule.forEach((item: any) => {
        const key = `${item.year}-${String(item.month).padStart(2, '0')}`
        if (item.year === selectedYear.value && monthsData[key]) {
          if (item.status === 'vacation') monthsData[key].vacation++
          else if (item.status === 'sick') monthsData[key].sick++
          else if (item.status === 'day_off') monthsData[key].dayoff++
        }
      })
    }
    
    // ✅ Подсчёт итогов
    let totalVacation = 0
    let totalSick = 0
    let totalDayOff = 0
    
    Object.values(monthsData).forEach((m: any) => {
      totalVacation += m.vacation
      totalSick += m.sick
      totalDayOff += m.dayoff
    })
    
    // ✅ Остаток отпуска (из vacationBalance)
    const vacationBalance = user.vacationBalance || {}
    const carriedOver = vacationBalance[String(selectedYear.value - 1)] || 0
    const currentYearBalance = vacationBalance[String(selectedYear.value)] || 0
    const remaining = currentYearBalance - totalVacation
    
    return {
      email,
      displayName,
      department,
      months: monthsData,
      totalVacation,
      totalSick,
      totalDayOff,
      carriedOver,
      remaining
    }
  })
})

// ✅ Отделы
const departments = computed(() => {
  if (!summaryData.value) return []
  const depts = new Set(summaryData.value.map((e: any) => e.department))
  return Array.from(depts).filter(Boolean).sort()
})

// ✅ Фильтрация
const filtered = computed(() => {
  if (!summaryData.value) return []
  
  return summaryData.value.filter((emp: any) => {
    const matchSearch = (emp.displayName || emp.email || '')
      .toLowerCase()
      .includes(searchQuery.value.toLowerCase())
    const matchDept = filterDept.value === '' || emp.department === filterDept.value
    return matchSearch && matchDept
  })
})

// ✅ Получение данных по месяцу
function getMonthData(emp: any, month: string) {
  const key = `${selectedYear.value}-${month}`
  return emp.months[key] || { vacation: 0, sick: 0, dayoff: 0 }
}
// ✅ Годы для выбора
const years = computed(() => {
  const current = new Date().getFullYear()
  return [current - 1, current, current + 1]
})

// ✅ Перезагрузка при смене года
watch(selectedYear, async () => {
  // Обновляем данные при смене года
  if (!isDataLoaded.value) {
    await scheduleStore.fetchAllData()
  }
})

// ✅ Обновление при загрузке данных
watch(() => isDataLoaded.value, (loaded) => {
  if (loaded) {
    // Данные загружены, можно отображать
  }
})

// ✅ Прелоадер
const isLoadingData = computed(() => scheduleStore.isLoading)
</script>

<template>
  <div class="summary-page">
    <!-- Фильтры -->
    <div class="summary-filters">
      <input
        v-model="searchQuery"
        class="search-input"
        placeholder="Поиск по ФИО..."
      />
      <select v-model="filterDept" class="filter-select">
        <option value="">Все отделы</option>
        <option v-for="d in departments" :key="d" :value="d">{{ d }}</option>
      </select>
      <select v-model="selectedYear" class="filter-select">
        <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
      </select>
    </div>

    <!-- Таблица -->
    <div class="table-wrap">
      <!-- Прелоадер -->
      <div v-if="isLoadingData" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Загрузка...</span>
        </div>
        <p class="mt-2 text-muted">Загрузка данных...</p>
      </div>

      <!-- Ошибка -->
      <div v-else-if="error" class="alert alert-danger m-3">
        {{ error }}
      </div>

      <!-- Таблица -->
      <table v-else>
        <thead>
          <tr>
            <th class="col-name" rowspan="3">Ф.И.О.</th>
            <th class="col-dept" rowspan="3">Отдел</th>
            <th class="col-num col-carried" rowspan="3">С пр. года</th>
            <th class="col-num col-remaining" rowspan="3">Остаток</th>
            <th class="col-num col-used" rowspan="3">Исп.</th>
            <th class="col-num" rowspan="3">Б</th>
            <th class="col-num" rowspan="3">Уд</th>
            <th
              v-for="m in months"
              :key="m.value"
              colspan="3"
              class="col-month"
            >
              {{ m.label }}
            </th>
          </tr>
          <tr>
            <template v-for="m in months" :key="m.value">
              <td colspan="3" class="prod-info-cell">
                <div class="prod-info-row">
                  <span class="prod-info-item">📅 {{ getCalendarDays(Number(m.value)) }} кал.</span>
                  <span class="prod-info-item working">💼 {{ getWorkingDays(Number(m.value)) }} раб.</span>
                </div>
                <div class="prod-info-row">
                  <span class="prod-info-item preholiday">🎉 {{ getPreHolidays(Number(m.value)) }} пред.</span>
                  <span class="prod-info-item hours">⏱ {{ getWorkingHours(Number(m.value)) }} ч.</span>
                </div>
              </td>
            </template>
          </tr>
          <tr>
            <template v-for="m in months" :key="m.value">
              <th class="col-sub vacation">От</th>
              <th class="col-sub sick">Б</th>
              <th class="col-sub dayoff">Уд</th>
            </template>
          </tr>
        </thead>
        <tbody>
          <template v-if="filtered.length">
            <tr v-for="(emp, index) in filtered" :key="index">
              <td class="col-name">{{ emp.displayName || emp.email }}</td>
              <td class="col-dept">{{ emp.department || 'Без отдела' }}</td>
              <td class="col-num col-carried">{{ emp.carriedOver }}</td>
              <td class="col-num col-remaining" :class="{ negative: emp.remaining < 0 }">
                {{ emp.remaining }}
              </td>
              <td class="col-num col-used">{{ emp.totalVacation }}</td>
              <td class="col-num sick-total">{{ emp.totalSick }}</td>
              <td class="col-num dayoff-total">{{ emp.totalDayOff }}</td>
              <template v-for="m in months" :key="m.value">
                <td class="col-sub vacation">
                  {{ getMonthData(emp, m.value).vacation || '' }}
                </td>
                <td class="col-sub sick">
                  {{ getMonthData(emp, m.value).sick || '' }}
                </td>
                <td class="col-sub dayoff">
                  {{ getMonthData(emp, m.value).dayoff || '' }}
                </td>
              </template>
            </tr>
          </template>
          <tr v-else>
            <td :colspan="7 + months.length * 3" class="no-results">
              {{ searchQuery || filterDept ? 'Ничего не найдено' : 'Нет данных' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.summary-page {
  padding: 20px 24px;
}

.summary-filters {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.search-input {
  font-size: 13px;
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  width: 200px;
  outline: none;
}

.search-input:focus { border-color: #9ca3af; }

.filter-select {
  font-size: 13px;
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  outline: none;
}

.table-wrap {
  overflow-x: auto;
  overflow-y: auto;
  max-height: calc(100vh - 160px);
}

table {
  border-collapse: collapse;
  font-size: 13px;
  white-space: nowrap;
}

thead {
  position: sticky;
  top: 0;
  z-index: 10;
}

th {
  background: #f3f4f6;
  padding: 7px 10px;
  text-align: center;
  border: 1px solid #e5e7eb;
  font-weight: 500;
  font-size: 12px;
}

th.col-name {
  position: sticky;
  left: 0;
  z-index: 30;
  background: #f3f4f6;
  text-align: left;
  min-width: 150px;
  padding-left: 12px;
}

th.col-dept { 
  text-align: left; 
  min-width: 160px; 
  padding-left: 12px; 
}

th.col-num { min-width: 55px; }
th.col-month { min-width: 80px; }
th.col-sub { min-width: 30px; font-weight: 400; }

td.col-carried { background: #F5F0FF; color: #3B1F6B; }
td.col-remaining { background: #F1F8F1; color: #1B5E20; }
td.col-remaining.negative { color: #dc2626; background: #FEF2F2; }
td.col-used { background: #FAF5FF; color: #5B21B6; }

th.vacation { background: #E6F1FB; color: #0C447C; }
th.sick     { background: #FAECE7; color: #712B13; }
th.dayoff   { background: #FAEEDA; color: #633806; }

td {
  border: 1px solid #e5e7eb;
  text-align: center;
  padding: 6px 8px;
  height: 36px;
  font-size: 13px;
}

td.col-name {
  position: sticky;
  left: 0;
  z-index: 5;
  background: #ffffff;
  text-align: left;
  padding-left: 12px;
  font-size: 13px;
  box-shadow: 2px 0 4px rgba(0,0,0,0.06);
}

td.col-dept { 
  text-align: left; 
  padding-left: 12px; 
  color: #6b7280; 
}

td.col-sub.vacation { background: #F0F7FF; color: #0C447C; }
td.col-sub.sick     { background: #FFF4F0; color: #712B13; }
td.col-sub.dayoff   { background: #FFFAF0; color: #633806; }
td.negative         { color: #dc2626; font-weight: 500; }
td.sick-total       { background: #FFF4F0; color: #712B13; font-weight: 500; }
td.dayoff-total     { background: #FFFAF0; color: #633806; font-weight: 500; }

.no-results { text-align: center; color: #9ca3af; padding: 20px; }

.prod-info-cell {
  background: #f9fafb;
  padding: 4px 6px;
  border: 1px solid #e5e7eb;
  text-align: center;
}

.prod-info-row { 
  display: flex; 
  justify-content: center; 
  gap: 8px; 
  white-space: nowrap; 
}

.prod-info-item { 
  font-size: 11px; 
  color: #6b7280; 
}

.prod-info-item.working   { color: #27500A; }
.prod-info-item.preholiday { color: #993C1D; }
.prod-info-item.hours     { color: #185FA5; }
</style>