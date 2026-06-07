<script setup lang="ts">
const store = useScheduleStore()

onMounted(async () => {
  await store.fetchEmployees()
  await store.fetchSchedule()
})

const days = Array.from({ length: 31 }, (_, i) => i + 1)

const dayNames = ['ср','чт','пт','сб','вс','пн','вт','ср','чт','пт','сб','вс','пн','вт','ср','чт','пт','сб','вс','пн','вт','ср','чт','пт','сб','вс','пн','вт','ср','чт','пт']

const weekends = [5, 6, 12, 13, 19, 20, 26, 27]

const statusConfig = {
  work:     { label: 'Р',  bg: '#EAF3DE', color: '#27500A' },
  vacation: { label: 'От', bg: '#E6F1FB', color: '#0C447C' },
  sick:     { label: 'Б',  bg: '#FAECE7', color: '#712B13' },
  day_off:  { label: 'Уд', bg: '#FAEEDA', color: '#633806' },
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

function getDateString(day: number) {
  return `2026-07-${String(day).padStart(2, '0')}`
}

function getSummary(empId: number) {
  let work = 0, vacation = 0, sick = 0, day_off = 0
  days.forEach(d => {
    if (weekends.includes(d)) return
    const s = store.getStatus(empId, getDateString(d))
    if (s === 'work') work++
    else if (s === 'vacation') vacation++
    else if (s === 'sick') sick++
    else if (s === 'day_off') day_off++
  })
  const parts = []
  if (work) parts.push(`${work}р`)
  if (vacation) parts.push(`${vacation}от`)
  if (sick) parts.push(`${sick}б`)
  if (day_off) parts.push(`${day_off}уд`)
  return parts.join(' / ')
}
</script>

<template>
  <div>
    <div class="legend">
      <span class="legend-item" style="background:#EAF3DE;color:#27500A">Работа</span>
      <span class="legend-item" style="background:#E6F1FB;color:#0C447C">Отпуск</span>
      <span class="legend-item" style="background:#FAECE7;color:#712B13">Больничный</span>
      <span class="legend-item" style="background:#FAEEDA;color:#633806">Отгул</span>
    </div>

    <div class="table-wrap">
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
          <template v-for="[deptName, emps] in departments" :key="deptName">
            <tr>
              <td :colspan="days.length + 2" class="dept-row">{{ deptName }}</td>
            </tr>
            <tr v-for="emp in emps" :key="emp.id">
              <td class="name-cell">{{ emp.name }}</td>
              <td
                v-for="day in days"
                :key="day"
                :class="{ weekend: weekends.includes(day) }"
                :style="!weekends.includes(day) ? {
                  background: statusConfig[store.getStatus(emp.id, getDateString(day))].bg,
                  color: statusConfig[store.getStatus(emp.id, getDateString(day))].color
                } : {}"
                class="status-cell"
              >
                {{ weekends.includes(day) ? '' : statusConfig[store.getStatus(emp.id, getDateString(day))].label }}
              </td>
              <td class="sum-cell">{{ getSummary(emp.id) }}</td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.legend {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.legend-item {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 4px;
}
.table-wrap {
  overflow-x: auto;
}
table {
  border-collapse: collapse;
  font-size: 12px;
  white-space: nowrap;
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
th.weekend { color: #9ca3af; }
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
  background: #f3f4f6;
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 4px 10px;
  text-align: left;
}
</style>