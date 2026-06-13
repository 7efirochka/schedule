<script setup lang="ts">
// definePageMeta({
//   middleware: 'auth'
// })

const selectedYear = ref(new Date().getFullYear())
const searchQuery = ref('')
const filterDept = ref('')

const { data: summaryData, refresh } = await useFetch(() => 
  `/api/summary?year=${selectedYear.value}`
)

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

const departments = computed(() => {
  if (!summaryData.value) return []
  const depts = new Set(summaryData.value.map((e: any) => e.department))
  return Array.from(depts)
})

const filtered = computed(() => {
  if (!summaryData.value) return []
  return summaryData.value.filter((emp: any) => {
    const matchSearch = emp.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchDept = filterDept.value === '' || emp.department === filterDept.value
    return matchSearch && matchDept
  })
})

function getMonthKey(month: string) {
  return `${selectedYear.value}-${month}`
}

function getMonthData(emp: any, month: string) {
  return emp.months[getMonthKey(month)] || { vacation: 0, sick: 0, dayoff: 0 }
}

watch(selectedYear, () => refresh())
</script>

<template>
  <div class="summary-page">
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
        <select v-model="selectedYear" class="filter-select" @change="refresh()">
        <option v-for="y in [selectedYear - 1, selectedYear, selectedYear + 1]" :key="y" :value="y">
            {{ y }}
        </option>
        </select>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th class="col-name" rowspan="2">Ф.И.О.</th>
            <th class="col-dept" rowspan="2">Отдел</th>
            <th class="col-num" rowspan="2">С пр. года</th>
            <th class="col-num" rowspan="2">Остаток</th>
            <th class="col-num" rowspan="2">Исп.</th>
            <th class="col-num" rowspan="2">Б</th>
            <th class="col-num" rowspan="2">Уд</th>
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
              <th class="col-sub vacation">От</th>
              <th class="col-sub sick">Б</th>
              <th class="col-sub dayoff">Уд</th>
            </template>
          </tr>
        </thead>
        <tbody>
          <template v-if="filtered.length">
            <tr v-for="emp in filtered" :key="emp.id">
              <td class="col-name">{{ emp.name }}</td>
              <td class="col-dept">{{ emp.department }}</td>
              <td class="col-num">{{ emp.days_carried_over }}</td>
              <td class="col-num" :class="{ negative: emp.days_remaining < 0 }">
                {{ emp.days_remaining }}
              </td>
              <td class="col-num">{{ emp.days_used }}</td>
              <td class="col-num sick-total">
                {{ Object.values(emp.months).reduce((s: any, m: any) => s + Number(m.sick), 0) }}
              </td>
              <td class="col-num dayoff-total">
                {{ Object.values(emp.months).reduce((s: any, m: any) => s + Number(m.dayoff), 0) }}
              </td>
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
              Ничего не найдено
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
.search-input:focus {
  border-color: #9ca3af;
}
.filter-select {
  font-size: 13px;
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  outline: none;
}
.year-btns {
  display: flex;
  gap: 6px;
}
.year-btn {
  padding: 5px 14px;
  font-size: 13px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
}
.year-btn.active {
  background: #1a1a1a;
  color: #ffffff;
  border-color: #1a1a1a;
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
  padding: 5px 6px;
  text-align: center;
  border: 1px solid #e5e7eb;
  font-weight: 500;
  font-size: 11px;
}
th.col-name {
  text-align: left;
  min-width: 120px;
  padding-left: 10px;
}
th.col-dept {
  text-align: left;
  min-width: 140px;
  padding-left: 10px;
}
th.col-num { min-width: 40px; }
th.col-month { min-width: 60px; }
th.col-sub { min-width: 24px; font-weight: 400; }
th.vacation { color: #0C447C; }
th.sick { color: #712B13; }
th.dayoff { color: #633806; }
td {
  border: 1px solid #e5e7eb;
  text-align: center;
  padding: 4px 6px;
  height: 26px;
  font-size: 11px;
}
td.col-name {
  text-align: left;
  padding-left: 10px;
  background: #ffffff;
}
td.col-dept {
  text-align: left;
  padding-left: 10px;
  color: #6b7280;
}
td.col-sub.vacation { color: #0C447C; }
td.col-sub.sick { color: #712B13; }
td.col-sub.dayoff { color: #633806; }
td.negative { color: #dc2626; font-weight: 500; }
td.sick-total { color: #712B13; }
td.dayoff-total { color: #633806; }
.no-results {
  text-align: center;
  color: #9ca3af;
  padding: 20px;
}
</style>