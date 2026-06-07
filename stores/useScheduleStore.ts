import { defineStore } from 'pinia'

export const useScheduleStore = defineStore('schedule', {
  state: () => ({
    currentMonth: '2026-07',
    employees: [] as any[],
    schedule: [] as any[],
    isLoading: false,
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
      const record = this.schedule.find(
        s => s.employee_id === employeeId && s.date.startsWith(date)
      )
      return record ? record.status : 'work'
    },

    async updateStatus(employeeId: number, date: string, status: string) {
      await $fetch('/api/sched', {
        method: 'POST',
        body: { employee_id: employeeId, date, status }
      })
      await this.fetchSchedule()
    }
  }
})