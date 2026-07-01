<template>
  <div @click="closeDropdown">
    <div class="filters">
      <div class="d-flex">

        <select v-model="filterDept" class="filter-select">
          <option value="">Все отделы</option>
          <option v-for="dept in departments" :key="dept" :value="dept">
            {{ dept }}
          </option>
        </select>

        <button v-if="filterDept" class="icon-toggle" @click="filterDept = ''">
          Сбросить
        </button>

        <input
          v-model="searchQuery"
          class="search-input"
          placeholder="Поиск по ФИО..."
        />

      </div>

      <div
        class="calendar cal-trigger"
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

    </div>

    

    <div class="legend-row">
      <div class="toggle-buttons">
        <button class="icon-toggle" @click="iconMode = iconMode === 'text' ? 'icon' : 'text'">
          {{ iconMode === 'text' ? '✈️ Иконки' : 'Аб Буквы' }}
        </button>
        <button class="icon-toggle" @click="tableStyle = tableStyle === 'compact' ? 'spacious' : 'compact'">
          {{ tableStyle === 'compact' ? '⊞ Просторный' : '☰ Компактный' }}
        </button>
        <button class="icon-toggle" @click="summaryMode = summaryMode === 'bar' ? 'counts' : 'bar'">
          {{ summaryMode === 'bar' ? '123 Счётчики' : '▬ График' }}
        </button>
      </div>

      <div class="legend">
        <span class="legend-item" style="background:#EAF3DE;color:#27500A">Работа</span>
        <span class="legend-item" style="background:#FAEEDA;color:#633806">Удалённая работа</span>
        <span class="legend-item" style="background:#E6F1FB;color:#0C447C">Отпуск</span>
        <span class="legend-item" style="background:#FAECE7;color:#712B13">Больничный</span>
      </div>
    </div>

    <div ref="tableWrapRef" class="table-wrap" :class="tableStyle">
      <!-- Прелоадер -->
      <div v-if="isLoading" class="text-center py-5">
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
      <table :key="refreshKey" v-else>

        <thead>
          <tr>
            <th class="name-col">Ф.И.О.</th>
            <th
              v-for="(day, i) in days"
              :key="day"
              :class="{ weekend: weekends.includes(day) }"
            >
              {{ day }}<br>
              <span class="day-name">{{ dayNames[i] }}</span>
            </th>
            <th class="sum-col">Итог</th>
          </tr>
        </thead>

        <tbody>
          <template v-for="[deptName, emps] in filteredDepartments" :key="deptName">
            <tr>
              <td :colspan="days.length + 2" class="dept-row">{{ deptName || 'Без отдела' }}</td>
            </tr>

            <tr v-for="emp in emps" :key="emp.email || emp.mongoId">
              <td class="name-cell">
                <NuxtLink 
                  v-if="isAdmin"
                  :to="`/calendar/${emp.email}`" 
                  class="emp-link"
                >
                  {{ emp.display_name || emp.user_name }}
                </NuxtLink>
                <span v-else>{{ emp.display_name || emp.user_name }}</span>
              </td>

              <td
                v-for="day in days"
                :key="day"
                :class="{ weekend: weekends.includes(day) }"
                :style="!weekends.includes(day) ? {
                  background: tableStyle === 'spacious' ? '' : getStatusConfig(emp.email, getDateString(day)).bg,
                  color: getStatusConfig(emp.email, getDateString(day)).color,
                  cursor: isAdmin ? 'pointer' : 'default'
                } : {
                  cursor: 'default'
                }"
                class="status-cell"
                style="position: relative"
                @click.stop="!weekends.includes(day) && openDropdown(emp.email, day)"
              >
                <template v-if="!weekends.includes(day)">

                  <template v-if="tableStyle === 'compact'">
                    {{ iconMode === 'text'
                      ? getStatusConfig(emp.email, getDateString(day)).label
                      : iconConfig[getStatus(emp.email, getDateString(day)) as StatusKey] }}
                  </template>

                  <template v-else>
                    <div
                      v-if="getStatus(emp.email, getDateString(day)) !== 'work'"
                      class="spacious-block"
                      :style="{ 
                        background: getStatusConfig(emp.email, getDateString(day)).bg, 
                        color: getStatusConfig(emp.email, getDateString(day)).color 
                      }"
                    >
                      {{ iconMode === 'text'
                        ? getStatusConfig(emp.email, getDateString(day)).label
                        : iconConfig[getStatus(emp.email, getDateString(day)) as StatusKey] }}
                    </div>
                  </template>
                </template>

                <div
                  v-if="activeCell?.empEmail === emp.email && activeCell?.date === getDateString(day)"
                  class="dropdown"
                >
                  <div
                    v-for="(cfg, key) in statusConfigWithoutWeekends"
                    :key="key"
                    class="dropdown-item"
                    :style="{ background: cfg.bg, color: cfg.color }"
                    @click.stop="selectStatus(key, emp.email, day)"
                  >
                    {{ key === 'work' ? 'Работа' : key === 'vacation' ? 'Отпуск' : key === 'sick' ? 'Больничный' : 'Удаленка' }}
                  </div>
                </div>
              </td>

              <td class="sum-cell">
                <template v-if="summaryMode === 'bar'">
                  <div class="progress-bar">
                    <div
                      v-for="(cfg, key) in statusConfig"
                      :key="key"
                      :style="{
                        width: getPercent(emp.email, key) + '%',
                        background: progressConfig[key],
                      }"
                      :title="key + ': ' + getCount(emp.email, key) + ' дн.'"
                    ></div>
                  </div>
                </template>

                <template v-else>
                  <div class="counts">
                    <span class="count-item vacation" :title="'Отпуск'">
                      ✈️ {{ getCount(emp.email, 'vacation') }}
                    </span>
                    <span class="count-item sick" :title="'Больничный'">
                      🌡️ {{ getCount(emp.email, 'sick') }}
                    </span>
                    <span class="count-item dayoff" :title="'Удалёнка'">
                      🏠 {{ getCount(emp.email, 'day_off') }}
                    </span>
                    <span class="count-item work" :title="'Работа'">
                      💼 {{ (days_month - weekends.length) - (getCount(emp.email, 'vacation') + getCount(emp.email, 'sick') + getCount(emp.email, 'day_off')) }}
                    </span>
                    <span class="count-item work" :title="'Работа'">
                      ☀️ {{ weekends.length }}
                    </span>

                  </div>
                </template>
              </td>
            </tr>
          </template>
        </tbody>

      </table>
    </div>
  </div>
</template>





<script setup lang="ts">


import { useAuthStore } from '~/stores/useAuthStore'
import { useScheduleStore } from '~/stores/useScheduleStore'
import { normalizeMongoId } from '~/utils/mongo'
import { nextTick } from 'vue'
import { productionCalendar } from '~/data/productionCalendar'

const authStore = useAuthStore()
const scheduleStore = useScheduleStore()

// Состояния UI
const searchQuery = ref('')
const filterDept = ref('')
const refreshKey = ref(0)
const iconMode = ref<'text' | 'icon'>('text')
const tableStyle = ref<'compact' | 'spacious'>('compact')
const summaryMode = ref<'bar' | 'counts'>('bar')
const activeCell = ref<{ empEmail: string; date: string } | null>(null)

const tableWrapRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const startX = ref(0)
const scrollLeft = ref(0)
const isDown = ref(false)

const showCalendar = ref(false)
const calendarYear = computed(() => Number(scheduleStore.currentMonth.split('-')[0]))
const calendarData = computed(() => productionCalendar[calendarYear.value])
const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']

type StatusKey = 'work' | 'vacation' | 'sick' | 'day_off' | 'weekend'
type StatusKeyWithoutWeekends = 'work' | 'vacation' | 'sick' | 'day_off'

const iconConfig: Record<StatusKey, string> = {
  work: '',
  day_off: '🏠',
  vacation: '✈️',
  sick: '🌡️',
  weekend: '☀️',
}

const statusConfig: Record<StatusKey, { label: string; bg: string; color: string }> = {
  work: { label: ' ', bg: '#EAF3DE', color: '#27500A' },
  day_off: { label: 'Уд', bg: '#FAEEDA', color: '#633806' },
  vacation: { label: 'От', bg: '#E6F1FB', color: '#0C447C' },
  sick: { label: 'Б', bg: '#FAECE7', color: '#712B13' },
  weekend: { label: 'В', bg: '#ffe24b', color: '#712B13' },
}

const statusConfigWithoutWeekends: Record<StatusKeyWithoutWeekends, { label: string; bg: string; color: string }> = {
  work: { label: ' ', bg: '#EAF3DE', color: '#27500A' },
  day_off: { label: 'Уд', bg: '#FAEEDA', color: '#633806' },
  vacation: { label: 'От', bg: '#E6F1FB', color: '#0C447C' },
  sick: { label: 'Б', bg: '#FAECE7', color: '#712B13' },
}

const progressConfig: Record<StatusKey, string> = {
  work: '#9AF797',
  day_off: '#F0A884',
  vacation: '#8DCAF2',
  sick: '#F55B5B',
  weekend: '#ffe24b'
}

const days_week = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

// Данные из store
const isLoading = computed(() => scheduleStore.isLoading || false)
const error = computed(() => scheduleStore.error || null)
const currentMonth = computed(() => scheduleStore.currentMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`)

// ✅ ИСПРАВЛЕННЫЙ computed для пользователей - используем mergedUsers напрямую
const users = computed(() => {
  if (!scheduleStore.mergedUsers || !Array.isArray(scheduleStore.mergedUsers)) {
    return []
  }
  
  return scheduleStore.mergedUsers.map((emp: any) => {
    // Нормализуем mongoId
    const normalizedMongoId = normalizeMongoId(emp.mongoId)

    
    return {
      id: emp.id || emp.jira_id || emp.mongoId,
      mongoId: normalizedMongoId,
      email: emp.email,
      display_name: emp.display_name || emp.user_name || emp.email,
      user_name: emp.user_name || emp.email,
      department: emp.department || '',
      role: emp.role || '',
      schedule: emp.schedule || [],
      vacationBalance: emp.vacationBalance || {}
    }
  })
})






// Вычисляемые свойства для календаря
const currentDate = computed(() => {
  const [year, month] = currentMonth.value.split('-').map(Number)
  return { year: year || new Date().getFullYear(), month: month || 1 }
})

const days_month = computed(() => {
  return new Date(currentDate.value.year, currentDate.value.month, 0).getDate()
})

const days = computed(() => {
  return Array.from({ length: days_month.value }, (_, i) => i + 1)
})

const dayNames = computed(() => {
  const names = []
  for (let i = 1; i <= days_month.value; i++) {
    const date = new Date(currentDate.value.year, currentDate.value.month - 1, i)
    names.push(days_week[date.getDay()])
  }
  return names
})

const weekends = computed(() => {
  const w: number[] = []
  for (let i = 1; i <= days_month.value; i++) {
    const date = new Date(currentDate.value.year, currentDate.value.month - 1, i)
    if (date.getDay() === 0 || date.getDay() === 6) w.push(i)
  }
  return w
})

const workingDays = computed(() => {
  return days.value.length - weekends.value.length
})

const isAdmin = computed(() => authStore.user?.roles.includes('admin'))




// Отделы
const departments = computed(() => {
  const deptSet = new Set<string>()
  if (Array.isArray(users.value)) {
    users.value.forEach(user => {
      if (user.department) {
        deptSet.add(user.department)
      }
    })
  }
  return Array.from(deptSet).sort()
})




// Фильтрация
const filteredDepartments = computed(() => {
  const result = new Map<string, typeof users.value>()

  let filteredUsers = Array.isArray(users.value) ? users.value : []

  if (filterDept.value) {
    filteredUsers = filteredUsers.filter(user => user.department === filterDept.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filteredUsers = filteredUsers.filter(user => 
      (user.display_name || user.user_name || '').toLowerCase().includes(query)
    )
  }

  filteredUsers.forEach(user => {
    const dept = user.department || 'Без отдела'
    if (!result.has(dept)) {
      result.set(dept, [])
    }
    result.get(dept)!.push(user)
  })

  result.forEach((emps) => {
    emps.sort((a, b) => (a.display_name || a.user_name).localeCompare(b.display_name || b.user_name))
  })

  return result
})





// Вспомогательные функции
function getDateString(day: number): string {
  return `${currentMonth.value}-${String(day).padStart(2, '0')}`
}

function getStatus(empEmail: string, date: string): StatusKey {
  if (!empEmail) return 'work'
  return scheduleStore.getStatus(empEmail, date) as StatusKey
}

function getStatusConfig(empEmail: string, date: string) {
  const status = getStatus(empEmail, date)
  return statusConfig[status] || statusConfig.work
}

function getCount(empEmail: string, statusType: string): number {
  if (!empEmail) return 0
    if (statusType === 'work') return workingDays.value
    if (statusType === 'weekend') return weekends.value.length

  const records = scheduleStore.getScheduleForEmployee(empEmail)
  return records.filter(r => r.status === statusType).length
}

function getPercent(empEmail: string, statusType: string): number {
  const workingDays = days.value.filter(d => !weekends.value.includes(d)).length

  if (!empEmail) return 0
  return statusType === 'work'
    ? (workingDays / workingDays) * 100
    : statusType === 'weekend'
        ? (weekends.value.length / workingDays) * 100
        : (getCount(empEmail, statusType) / workingDays) * 100
    
}






// Dropdown
function openDropdown(empEmail: string, day: number) {
  if (!authStore.user || !isAdmin.value || !empEmail) return

  const date = getDateString(day)
  if (activeCell.value?.empEmail === empEmail && activeCell.value?.date === date) {
    activeCell.value = null
    return
  }

  activeCell.value = { empEmail, date }
  positionDropdown()
}

function closeDropdown() {
  activeCell.value = null
}

// Обработчик скролла
function handleScroll() {
  if (activeCell.value) {
    positionDropdown()
  }
}



async function selectStatus(status: string, empEmail: string, day: number) {
  if (!activeCell.value || !empEmail) return
  
  const date = getDateString(day)
  await scheduleStore.updateStatus(empEmail, date, status)
  activeCell.value = null
  
  refreshKey.value++
  await nextTick()
}


function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' || event.key === 'Esc') {
    closeDropdown()
  }
}



function onMouseDown(e: MouseEvent) {
  if (tableStyle.value !== 'spacious') return
  if (e.button !== 0) return // только левая кнопка

  
  const tableWrap = tableWrapRef.value
  if (!tableWrap) return
  
  isDown.value = true
  isDragging.value = true
  startX.value = e.pageX - tableWrap.offsetLeft
  scrollLeft.value = tableWrap.scrollLeft
  
  tableWrap.style.cursor = 'grabbing'
  tableWrap.style.userSelect = 'none'
  tableWrap.style.scrollBehavior = 'auto'
}

function onMouseUp(e: MouseEvent) {
  if (!isDown.value) return
  
  isDown.value = false
  isDragging.value = false
  
  const tableWrap = tableWrapRef.value
  if (tableWrap) {
    tableWrap.style.cursor = tableStyle.value === 'spacious' ? 'grab' : ''
    tableWrap.style.userSelect = ''
    tableWrap.style.scrollBehavior = 'smooth'
  }
}

function onMouseMove(e: MouseEvent) {
  if (!isDown.value) return
  
  e.preventDefault()
  
  const tableWrap = tableWrapRef.value
  if (!tableWrap) return
  
  const x = e.pageX - tableWrap.offsetLeft
  const walk = (x - startX.value) * 1.5
  tableWrap.scrollLeft = scrollLeft.value - walk
}

function onMouseLeave(e: MouseEvent) {
  if (isDown.value) {
    onMouseUp(e)
  }
}


// Функция позиционирования dropdown
function positionDropdown() {
  if (!activeCell.value) return
  
  // Ждём рендеринга dropdown
  nextTick(() => {
    const dropdown = document.querySelector('.dropdown') as HTMLElement
    if (!dropdown) return
    
    // Находим ячейку, которая содержит dropdown
    const cell = dropdown.closest('td.status-cell') as HTMLElement
    if (!cell) return
    
    const cellRect = cell.getBoundingClientRect()
    const dropdownHeight = dropdown.offsetHeight || 200
    const dropdownWidth = dropdown.offsetWidth || 150
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    
    // Рассчитываем позицию
    let top = cellRect.bottom
    let left = cellRect.left
    
    // Корректировка по вертикали
    if (cellRect.bottom + dropdownHeight > viewportHeight) {
      top = cellRect.top - dropdownHeight
    }
    
    // Корректировка по горизонтали
    if (cellRect.left + dropdownWidth > viewportWidth) {
      left = cellRect.right - dropdownWidth
    }
    
    // Применяем позицию
    dropdown.style.position = 'fixed'
    dropdown.style.top = `${Math.max(10, top)}px`
    dropdown.style.left = `${Math.max(10, left)}px`
  })
}







// Инициализация
onMounted(async () => {
  try {
    scheduleStore.generateMonths()
    document.addEventListener('keydown', handleKeyDown)
    
    // ✅ Drag to scroll - используем правильные события
    nextTick(() => {
      const tableWrap = tableWrapRef.value
      if (tableWrap) {
        // Удаляем старые слушатели, если есть
        tableWrap.removeEventListener('mousedown', onMouseDown)
        tableWrap.removeEventListener('mouseleave', onMouseLeave)
        tableWrap.removeEventListener('mouseup', onMouseUp)
        tableWrap.removeEventListener('mousemove', onMouseMove)
        
        // Добавляем новые
        tableWrap.addEventListener('mousedown', onMouseDown)
        tableWrap.addEventListener('mouseleave', onMouseLeave)
        tableWrap.addEventListener('mouseup', onMouseUp)
        tableWrap.addEventListener('mousemove', onMouseMove)
        
        // Устанавливаем курсор
        tableWrap.style.cursor = tableStyle.value === 'spacious' ? 'grab' : ''
      }
    })

    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleScroll)

  } catch (error) {
    console.error('❌ Ошибка загрузки:', error)
  }

  // Восстанавливаем настройки из localStorage
  const savedTableStyle = localStorage.getItem(`tableStyle-${authStore.user?.id}`)
  if (savedTableStyle) {
    tableStyle.value = savedTableStyle as 'compact' | 'spacious'
    // Обновляем курсор после загрузки стиля
    const tableWrap = tableWrapRef.value
    if (tableWrap) {
      tableWrap.style.cursor = savedTableStyle === 'spacious' ? 'grab' : ''
    }
  }
  
  const savedIcons = localStorage.getItem(`iconMode-${authStore.user?.id}`)
  if (savedIcons) iconMode.value = savedIcons as 'text' | 'icon'

  const savedSummary = localStorage.getItem(`summaryMode-${authStore.user?.id}`)
  if (savedSummary) summaryMode.value = savedSummary as 'bar' | 'counts'


})




onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  
  // ✅ Удаляем обработчики
  const tableWrap = tableWrapRef.value
  if (tableWrap) {
    tableWrap.removeEventListener('mousedown', onMouseDown)
    tableWrap.removeEventListener('mouseleave', onMouseLeave)
    tableWrap.removeEventListener('mouseup', onMouseUp)
    tableWrap.removeEventListener('mousemove', onMouseMove)
  }

  window.removeEventListener('scroll', handleScroll, true)
  window.removeEventListener('resize', handleScroll)
})




// Сохранение настроек
watch(tableStyle, (val) => {
  localStorage.setItem(`tableStyle-${authStore.user?.id}`, val)
  
  // ✅ Обновляем курсор при смене режима
  const tableWrap = tableWrapRef.value
  if (tableWrap) {
    tableWrap.style.cursor = val === 'spacious' ? 'grab' : ''
  }
})

watch(iconMode, (val) => {
  localStorage.setItem(`iconMode-${authStore.user?.id}`, val)
})

watch(summaryMode, (val) => {
  localStorage.setItem(`summaryMode-${authStore.user?.id}`, val)
})

watch(() => scheduleStore.mergedUsers, () => {
  // ✅ Обновляем ключ при изменении mergedUsers
  refreshKey.value++
}, { deep: true })


</script>








<style scoped>
.legend {
  display: flex;
  gap: 8px;
  margin-left: 20px;
  flex-wrap: wrap;
}


.legend-item {
  /* font-size: 12px; */
  padding: 3px 10px;
  border-radius: 4px;
}

.toggle-buttons {
  display: flex;
  gap: 10px;
}




table {
  border-collapse: collapse;
  width: 100%;
}

/* Добавляем объёмную тень для всей таблицы */
.table-wrap table {
  border-collapse: collapse;
  width: 100%;
  border-radius: 12px;
  box-shadow: 
    0 10px 10px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -1px rgba(0, 0, 0, 0.08),
    0 10px 20px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}


.spacious-block {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-weight: 500;
  width: 100%;
  height: 44px;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.06),
    0 1px 2px rgba(0, 0, 0, 0.04);
}

.spacious-block:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 
    0 10px 25px rgba(0, 0, 0, 0.15),
    0 4px 10px rgba(0, 0, 0, 0.08);
  z-index: 5;
}


th {
  background: #f3f4f6;
  padding: 5px 4px;
  text-align: center;
  font-weight: 500;
}


th.name-col {
  text-align: left;
  padding-left: 10px;
  min-width: 120px;
}


th.sum-col { min-width: 80px; }
th.weekend { color: #e92c2c; }
td {
  border: 1px solid #e5e7eb;
  text-align: center;
  padding: 0;
  height: 26px;
}


td.name-cell {
  text-align: left;
  padding: 0 10px;
  background: #ffffff;
  min-width: 120px;
}


td.sum-cell {
  background: #f3f4f6;
  padding: 0 6px;
  color: #6b7280;
}


td.weekend {
  background: #fffff4;
}





td.dept-row {
  background: linear-gradient(356deg, #ebedef 0%, #eaf1ff 100%);
  font-weight: 600;
  color: #4b5563;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 4px 10px;
  text-align: left;
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  position: sticky;
  left: 0;
  z-index: 5;
}

td.sum-cell {
  background: #f3f4f6;
  padding: 0 8px;
  min-width: 100px;
  vertical-align: middle;
}

.progress-bar {
  display: flex;
  flex-direction: row;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  width: 100%;
  background: #e5e7eb;
}
.progress-bar div {
  height: 100%;
}

.counts {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}


.count-item {
  /* font-size: 11px; */
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
}


.count-item.vacation {
  background: #E6F1FB;
  color: #0C447C;
}


.count-item.sick {
  background: #FAECE7;
  color: #712B13;
}


.count-item.dayoff {
  background: #FAEEDA;
  color: #633806;
}

.count-item.work {
  background: #EAF3DE;
  color: #633806;
}




.dropdown-item {
  padding: 8px 16px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
  margin: 5px 0;
  border-radius: 4px;
}

.dropdown-item:hover {
  transform: scale(1.02);
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.12);
  filter: brightness(1.05);
}


.filters {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin: 20px;
  flex-wrap: wrap;
}

.d-flex {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}


.search-input {
  /* font-size: 13px; */
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  outline: none;
  transition: all 0.2s ease;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    inset 0 1px 2px rgba(0, 0, 0, 0.03);
}

.search-input:focus {
  border-color: #6b7280;
  box-shadow: 
    0 0 0 3px rgba(107, 114, 128, 0.15),
    0 2px 8px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}


.filter-select {
  /* font-size: 13px; */
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  outline: none;
  width: 15rem;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    inset 0 1px 2px rgba(0, 0, 0, 0.03);
}

/*  кнопка переключатель */
.legend-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}


.icon-toggle {
  padding: 4px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
  white-space: nowrap;
}

.icon-toggle {
  padding: 4px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
  white-space: nowrap;
}


.icon-toggle:hover {
  background: #f3f4f6;
}

/* переключение темы */

.table-wrap.spacious {
  cursor: grab;
  scroll-behavior: smooth;
  user-select: none; /* предотвращает выделение текста при перетаскивании */
}

@media (pointer: coarse) {
  .table-wrap.spacious {
    cursor: default;
    -webkit-overflow-scrolling: touch;
  }
}

.table-wrap.spacious:active {
  cursor: grabbing;
}

/* Скрываем скроллбар для более чистого вида (опционально) */
.table-wrap.spacious::-webkit-scrollbar {
  height: 8px;
}

.table-wrap.spacious::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.table-wrap.spacious::-webkit-scrollbar-thumb {
  background: #c1c7cd;
  border-radius: 4px;
}

.table-wrap.spacious::-webkit-scrollbar-thumb:hover {
  background: #a0a7ae;
}

.table-wrap.spacious table {
  overflow-y: visible !important;
  width: max-content;
  min-width: 100%;
  border: 1px solid #d1d5db;
}

.table-wrap.spacious th {
  padding: 12px 20px;
  min-width: 100px;
  border: none;
  border-bottom: 2px solid #e5e7eb;
  border-right: 1px solid #f3f4f6;
  background: #ffffff;
}

.table-wrap.spacious th.name-col {
  min-width: 220px;
}


.table-wrap.spacious th.weekend {
  color: #9ca3af;
  background: #ffedab3b;
}

.table-wrap.spacious td {
  height: 56px;
  min-width: 140px; 
  border: none;
  border-bottom: 1px solid #f3f4f6;
  border-right: 1px solid #f3f4f6;
  padding: 6px 8px;
  vertical-align: middle;
}


.table-wrap.spacious td.name-cell {
  font-weight: 500;
  min-width: 220px;
  padding: 0 20px;
  background: #ffffff;
  border-right: 2px solid #e5e7eb;
}

.table-wrap.spacious td.weekend {
  background: rgb(255 237 171 0.23);
  border-right: 1px solid #f0f0f0;
}

.table-wrap.spacious td.dept-row {
  background: #f3f4f6;
  font-weight: 600;
  border-bottom: 1px solid #e5e7eb;
  padding: 6px 20px;
  color: #4b5563;
}

.table-wrap.spacious td.sum-cell {
  background: transparent;
  border-left: 2px solid #e5e7eb;
  min-width: 120px;
}

.table-wrap.spacious td.status-cell {
  background: transparent;
  padding: 4px 6px;
  isolation: isolate;
  position: relative;
  z-index: 1;
}

.table-wrap.spacious td.status-cell:has(.dropdown) {
  z-index: 9999;
}

td.status-cell:has(.dropdown) {
  z-index: 9999;
}

/* .table-wrap.spacious tr:hover td {
  background: #fafafa;
} */

.spacious-block {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-weight: 500;
  width: 100%;
  height: 44px;
}

/* .table-wrap.spacious td.status-cell {
  background: transparent;
  border-right: 1px solid #f3f4f6;
} */

/* .table-wrap.spacious tr:hover td {
  background: #fafafa;
} */

.table-wrap.spacious th {
  padding: 10px 16px;
  min-width: 140px;
  border: none;
  border-bottom: 2px solid #e5e7eb;
  border-right: 1px solid #f3f4f6;
  background: #ffffff;
}

.table-wrap.spacious td.name-cell {
  font-weight: 500;
  min-width: 180px;
  padding: 0 16px;
  border-right: 2px solid #e5e7eb;
}

.table-wrap.spacious td.sum-cell {
  background: transparent;
  border-left: 2px solid #e5e7eb;
}

.table-wrap.spacious td.weekend {
  background: #ffedab3b;
  border-right: 1px solid #f0f0f0;
}


.calendar {
  display: flex;
  align-items: center;
  border: 1px solid lightgrey;
  border-radius: 10px;
  padding: 0 16px;
  font-size: 16px;
  color: #6b7280;
  text-decoration: none;
  transition: color 0.15s;
}
.calendar:hover { color: #1a1a1a; }
.calendar.router-link-active {
  color: #1a1a1a;
  font-weight: 500;
  border-bottom-color: #1a1a1a;
}

/* для производственного календаря */
.cal-trigger {
  position: relative;
  cursor: pointer;
}

.prod-calendar {
  position: absolute;
  top: 62px;
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
  font-size: 16px;
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


/* ✅ Глобальное решение для всех таблиц с dropdown */
.table-wrap {
  overflow-y: visible !important;
  overflow-x: auto;
  padding: 20px;
  transition: cursor 0.2s ease;
  touch-action: pan-y; /* для совместимости с тач-устройствами */
}


/* ✅ Создаём новый контекст наложения */
td.status-cell {
  isolation: isolate;
  position: relative;
  z-index: 1;
  cursor: pointer;
}

td.status-cell:has(.dropdown) {
  z-index: 9999;
}

.dropdown {
  position: fixed;
  top: auto;
  left: auto;
  z-index: 9999 !important;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  min-width: 150px;
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 2px 4px rgba(0, 0, 0, 0.04);
  padding: 10px;
  animation: dropdownSlide 0.5s ease;
}

</style>