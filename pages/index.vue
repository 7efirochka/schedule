
<template>
  <div @click="closeDropdown">
      <div class="filters">
      <input
        v-model="searchQuery"
        class="search-input"
        placeholder="Поиск по ФИО..."
      />
      <select v-model="filterDept" class="filter-select">
        <option value="">Все отделы</option>
        <option v-for="[deptName] in departments" :key="deptName" :value="deptName">
          {{ deptName }}
        </option>
      </select>
    </div>
    <div class="legend-row">
      <div class="legend">
        <span class="legend-item" style="background:#EAF3DE;color:#27500A">Работа</span>
        <span class="legend-item" style="background:#FAEEDA;color:#633806">Удалённая работа</span>
        <span class="legend-item" style="background:#E6F1FB;color:#0C447C">Отпуск</span>
        <span class="legend-item" style="background:#FAECE7;color:#712B13">Больничный</span>
      </div>
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

    <div class="table-wrap" :class="tableStyle">
      <table>
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
              <td :colspan="days.length + 2" class="dept-row">{{ deptName }}</td>
            </tr>

            <tr v-for="emp in emps" :key="emp._id">
              <td class="name-cell">
                <NuxtLink 
                  v-if="isAdmin"
                  :to="`/calendar/${emp._id}`" class="emp-link">
                  {{ setDisplayName(emp.email) }}
                </NuxtLink>
                <span v-else>{{ setDisplayName(emp.email) }}</span>
              </td>
              <td
                v-for="day in days"
                :key="day"
                :class="{ weekend: weekends.includes(day) }"
                :style="!weekends.includes(day) ? {
                  background: tableStyle === 'spacious' ? '' : getStatusConfig(emp._id, getDateString(day)).bg,
                  color: getStatusConfig(emp._id, getDateString(day)).color,
                  cursor: isAdmin ? 'pointer' : 'default'
                } : {
                  cursor:'default'
                }"
                class="status-cell"
                style="position: relative"
                @click.stop="!weekends.includes(day) && openDropdown(emp._id, day)"
              >
                <template v-if="!weekends.includes(day)">
                  <template v-if="tableStyle === 'compact'">
                    {{ iconMode === 'text'
                      ? getStatusConfig(emp._id, getDateString(day)).label
                      : iconConfig[store.getStatus(emp._id, getDateString(day)) as StatusKey] }}
                  </template>
                  <template v-else>
                    <div
                      v-if="store.getStatus(emp._id, getDateString(day)) !== 'work'"
                      class="spacious-block"
                      :style="{ background: getStatusConfig(emp._id, getDateString(day)).bg, color: getStatusConfig(emp._id, getDateString(day)).color }"
                    >
                      {{ iconMode === 'text'
                        ? getStatusConfig(emp._id, getDateString(day)).label
                        : iconConfig[store.getStatus(emp._id, getDateString(day)) as StatusKey] }}
                    </div>
                  </template>
                </template>

                <div
                  v-if="activeCell?.empId === emp._id && activeCell?.date === getDateString(day)"
                  class="dropdown"
                >
                  <div
                    v-for="(cfg, key) in statusConfig"
                    :key="key"
                    class="dropdown-item"
                    :style="{ background: cfg.bg, color: cfg.color }"
                    @click.stop="selectStatus(key)"
                  >
                    {{ cfg.label }} —
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
                        width: getPercent(emp._id, key) + '%',
                        background: progressConfig[key],
                      }"
                      :title="key + ': ' + getCount(emp._id, key) + ' дн.'"
                    ></div>
                  </div>
                </template>
                <template v-else>
                  <div class="counts">
                    <span class="count-item vacation" :title="'Отпуск'">
                      ✈️ {{ getCount(emp._id, 'vacation') }}
                    </span>
                    <span class="count-item sick" :title="'Больничный'">
                      🌡️ {{ getCount(emp._id, 'sick') }}
                    </span>
                    <span class="count-item dayoff" :title="'Удалёнка'">
                      🏠 {{ getCount(emp._id, 'day_off') }}
                    </span>
                    <span class="count-item work" :title="'Удалёнка'">
                      💼 {{ days_month - (getCount(emp._id, 'vacation') +  getCount(emp._id, 'sick') +  getCount(emp._id, 'day_off'))}}
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

const store = useScheduleStore()
const authStore = useAuthStore()

const isAdmin = computed(() => authStore.user?.role === 'admin')

const days_week = ["вс","пн","вт","ср","чт","пт","сб"]

onMounted(async () => {
  store.generateMonths()
  await store.fetchEmployees()
  await store.fetchJiraUsers()
  await store.fetchSchedule()
})

const currentDate = computed(() => {
  const [year, month] = store.currentMonth.split('-').map(Number)
  return { year: year!, month: month! }
})

const days_month = computed(() => new Date(currentDate.value.year, currentDate.value.month, 0).getDate())

const days = computed(() => Array.from({ length: days_month.value }, (_, i) => i + 1))

const dayNames = computed(() => {
  const names = []
  for (let i = 1; i <= days_month.value; i++) {
    const date = new Date(currentDate.value.year, currentDate.value.month - 1, i)
    names.push(days_week[date.getDay()])
  }
  return names
})

const weekends = computed(() => {
  const w = []
  for (let i = 1; i <= days_month.value; i++) {
    const date = new Date(currentDate.value.year, currentDate.value.month - 1, i)
    if (date.getDay() === 0 || date.getDay() === 6) w.push(i)
  }
  return w
})

const iconMode = ref<'text' | 'icon'>('text')

const iconConfig = {
  work:     '•',
  day_off:  '🏠',
  vacation: '✈️',
  sick:     '🌡️',
}

const statusConfig = {
  work:     { label: 'Р',  bg: '#EAF3DE', color: '#27500A' },
  day_off:  { label: 'Уд', bg: '#FAEEDA', color: '#633806' },
  vacation: { label: 'От', bg: '#E6F1FB', color: '#0C447C' },
  sick:     { label: 'Б',  bg: '#FAECE7', color: '#712B13' },
}

const progressConfig = {
  work:     '#9AF797',
  day_off:  '#F0A884',
  vacation: '#8DCAF2',
  sick:     '#F55B5B',
}

const departments = computed(() => {
  const map = new Map()

  store.employees.forEach(emp => {
    const deptName = emp.department || 'Без отдела'
    if (!map.has(deptName)) map.set(deptName, [])
    map.get(deptName).push(emp)
  })
  return map
})


function setDisplayName(email: string) {
  return store.jiraUsers.find(user => user.email === email)?.display_name
}



function getDateString(day: number) {
  return `${store.currentMonth}-${String(day).padStart(2, '0')}`
}



function getCount(empId: string, status: string) {
  return days.value.filter(d => {
    if (weekends.value.includes(d)) return false
    return store.getStatus(empId, getDateString(d)) === status
  }).length
}



function getPercent(empId: string, status: string) {
  const workingDays = days.value.filter(d => !weekends.value.includes(d)).length
  return (getCount(empId, status) / workingDays) * 100
}


type StatusKey = 'work' | 'vacation' | 'sick' | 'day_off'


function getStatusConfig(empId: string, date: string) {
  const status = store.getStatus(empId, date) as StatusKey
  return statusConfig[status] ?? statusConfig['work']
    }

const activeCell = ref<{empId: string, date: string} | null>(null)

function openDropdown(empId: string, day: number) {
  if (!authStore.user) return
  if (!isAdmin.value) return

  const date = getDateString(day)
  if (activeCell.value?.empId === empId && activeCell.value?.date === date) {
    activeCell.value = null
  } else {
    activeCell.value = { empId, date }
  }
}

async function selectStatus(status: string) {
  if (!activeCell.value) return
  await store.updateStatus(activeCell.value.empId, activeCell.value.date, status)
  activeCell.value = null
}

function closeDropdown() {
  activeCell.value = null
}



const searchQuery = ref('')
const filterDept = ref('')

const filteredDepartments = computed(() => {
  const result = new Map()

  for (const [deptName, emps] of departments.value) {
    if (filterDept.value && deptName !== filterDept.value) continue

    const filtered = emps.filter((emp: any) =>
      setDisplayName(emp.email)?.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
    if (filtered.length > 0) result.set(deptName, filtered)
  }

  return result
})

// переключатель темы (компактный или просторный)
const tableStyle = ref<'compact' | 'spacious'>('compact')







watch(tableStyle, (val) => {
  localStorage.setItem(`tableStyle-${authStore.user?.id}`, val)
})



watch(iconMode, (val) => {
  localStorage.setItem(`iconMode-${authStore.user?.id}`, val)
})

// переключатель для колонки итога (прогресс или статистика)
const summaryMode = ref<'bar' | 'counts'>('bar')


onMounted(() => {
  const saved = localStorage.getItem(`tableStyle-${authStore.user?.id}`)
  if (saved) tableStyle.value = saved as 'compact' | 'spacious'
  
  const savedIcons = localStorage.getItem(`iconMode-${authStore.user?.id}`)
  if (savedIcons) iconMode.value = savedIcons as 'text' | 'icon'

  const savedSummary = localStorage.getItem(`summaryMode-${authStore.user?.id}`)
  if (savedSummary) summaryMode.value = savedSummary as 'bar' | 'counts'
})

watch(summaryMode, (val) => {
  localStorage.setItem(`summaryMode-${authStore.user?.id}`, val)
})

</script>



<style scoped>
.legend {
  display: flex;
  gap: 8px;
  margin-left: 20px;
  flex-wrap: wrap;
}


.legend-item {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 4px;
}


.table-wrap {
  overflow-x: auto;
  padding: 20px;
}


table {
  border-collapse: collapse;
  font-size: 12px;
  width: 100%;
}

/* Добавляем объёмную тень для всей таблицы */
.table-wrap table {
  border-collapse: collapse;
  font-size: 12px;
  width: 100%;
  border-radius: 12px;
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06),
    0 10px 15px -3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}


.spacious-block {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 13px;
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
  border: 1px solid #e5e7eb;
  font-weight: 500;
  font-size: 11px;
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
  font-size: 11px;
}


td.name-cell {
  text-align: left;
  padding: 0 10px;
  font-size: 12px;
  background: #ffffff;
  min-width: 120px;
}


td.sum-cell {
  background: #f3f4f6;
  font-size: 11px;
  padding: 0 6px;
  color: #6b7280;
}


td.weekend {
  background: #f3f4f6;
}


td.status-cell {
  cursor: pointer;
}




td.dept-row {
  background: linear-gradient(135deg, #f8f9fa 0%, #f3f4f6 100%);
  font-size: 11px;
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
  font-size: 11px;
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



.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  min-width: 150px;
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 2px 4px rgba(0, 0, 0, 0.04);
  padding: 4px 0;
  animation: dropdownSlide 0.2s ease;
}

@keyframes dropdownSlide {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.dropdown-item {
  padding: 8px 16px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
  margin: 2px 4px;
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
  gap: 10px;
  margin: 12px;
  flex-wrap: wrap;
}


.search-input {
  font-size: 13px;
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
  font-size: 13px;
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
  justify-content: flex-start;
  margin-bottom: 12px;
  gap: 22px;
  align-items: flex-start;

}


.icon-toggle {
  font-size: 12px;
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

.table-wrap.spacious table {
  width: max-content;
  min-width: 100%;
  border: 1px solid #d1d5db;
}

.table-wrap.spacious th {
  padding: 12px 20px;
  font-size: 14px;
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
  background: #f3f4f6;
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
  font-size: 14px;
  font-weight: 500;
  min-width: 220px;
  padding: 0 20px;
  background: #ffffff;
  border-right: 2px solid #e5e7eb;
}

.table-wrap.spacious td.weekend {
  background: #fafafa;
  border-right: 1px solid #f0f0f0;
}

.table-wrap.spacious td.dept-row {
  background: #f3f4f6;
  font-size: 12px;
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
}

.table-wrap.spacious tr:hover td {
  background: #fafafa;
}

.spacious-block {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  width: 100%;
  height: 44px;
}

.table-wrap.spacious td.status-cell {
  background: transparent;
  border-right: 1px solid #f3f4f6;
}

.table-wrap.spacious tr:hover td {
  background: #fafafa;
}

.table-wrap.spacious th {
  padding: 10px 16px;
  font-size: 13px;
  min-width: 140px;
  border: none;
  border-bottom: 2px solid #e5e7eb;
  border-right: 1px solid #f3f4f6;
  background: #ffffff;
}

.table-wrap.spacious td.name-cell {
  font-size: 14px;
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
  background: #fafafa;
  border-right: 1px solid #f0f0f0;
}
</style>