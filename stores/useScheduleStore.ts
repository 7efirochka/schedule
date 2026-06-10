import { defineStore } from 'pinia'

export const useScheduleStore = defineStore('schedule', {
  state: () => ({
    currentMonth: `${new Date().getFullYear()}-${String(new Date().getMonth() + 2).padStart(2, '0')}`,
    employees: [] as any[],
    schedule: [] as any[],
    isLoading: false,
      months: [] as { value: string, label: string }[]
  }),

  actions: {
    async fetchEmployees() {
      const data = await $fetch('/api/emp')
      this.employees = data as any[]
    },

    async fetchSchedule() {
      const data = await $fetch(`/api/sched?month=${this.currentMonth}`)
      this.schedule = data as any[]
    },

    getStatus(employeeId: number, date: string) {
      const record = this.schedule.find(s => {
        const recordDate = s.date
        return s.employee_id === employeeId && recordDate === date
      })
      return record ? record.status : 'work'
    },


    async updateStatus(employeeId: number, date: string, status: string) {
      await $fetch('/api/sched', {
        method: 'POST',
        body: { employee_id: employeeId, date, status }
      })
      await this.fetchSchedule()
    },

    generateMonths() {
      const now = new Date()
      const months = []
      
      for (let i = -3; i <= 3; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const label = date.toLocaleString('ru', { month: 'long', year: 'numeric' })
        months.push({ value, label })
      }
      
      this.months = months
    },

    async setMonth(month: string) {
      this.currentMonth = month
      await this.fetchSchedule()
    }
  }
})