
import { defineStore } from 'pinia'
import { useAuthStore } from '~/stores/useAuthStore'


interface ScheduleRecord {
  employee_id: string
  employee_email: string
  employee_name: string
  employee_department: string
  jira_id: number | null
  date: string
  day: number
  status: string
  is_weekend: boolean
  vacation_balance: Record<string, number>
}

export interface MergedUser {
  id: number
  mongoId?: string
  email: string
  display_name: string
  user_name: string
  department: string
  role: string
  schedule: any[]
  vacationBalance: Record<string, number>
  active: number
  jira_groups: string
}


export const useScheduleStore = defineStore('schedule', {
  
  state: () => ({
    
      currentMonth: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      employees: [] as any[],
      jiraUsers: [] as any[],
      schedule: [] as ScheduleRecord[],
      mergedUsers: [] as MergedUser[],
      isLoading: false,
      months: [] as { value: string, label: string }[],
      error: null as string | null

  }),

  getters: {

    getStatus: (state) => (employeeEmail: string, date: string): string => {
      // Ищем пользователя в mergedUsers по mongoId
      const user = state.mergedUsers.find(user => {
        return String(user.email) === String(employeeEmail)
      })

      
      if (!user || !user.schedule) return 'work'

      const [year, month, day] = date.split('-').map(Number)
      const record = user.schedule.find(
        (s: any) => s.year === year && s.month === month && s.day === day
      )
      return record?.status || 'work'
    },




    // Получение всех записей для сотрудника из mergedUsers
    getScheduleForEmployee: (state) => (employeeEmail: string): any[] => {
      const user = state.mergedUsers.find(user => {
        return user.email === employeeEmail
      })

      const [year, month] = state.currentMonth.split('-').map(Number)

      const record = user?.schedule.filter(
        (s: any) => s.year === year && s.month === month
      )      
      
      return record || []
    },



    departments: (state): string[] => {
      const depts = new Set<string>()
      state.mergedUsers.forEach(user => {
        if (user.department) depts.add(user.department)
      })
      return Array.from(depts).sort()
    },



    employeesWithNames: (state): MergedUser[] => {
      return state.mergedUsers
    }
  },

  actions: {
    // ✅ Инициализация на клиенте
    async initialize() {
      const authStore = useAuthStore()
      if (import.meta.client) {
        // Загружаем сохранённый месяц
        const savedMonth = localStorage.getItem(`currentMonth-${authStore.user?.id}`)
        if (savedMonth) {
          this.currentMonth = savedMonth
        }
        
        // Загружаем данные
        await this.fetchSchedule()
      }
    },


    // Загрузка объединённых пользователей
    async fetchMergedUsers() {
      try {
        const response = await $fetch<{ status: string; data: MergedUser[] }>('/api/merged')
        this.mergedUsers = response.data || []
        
        // Для каждого пользователя парсим schedule, если он в виде строки
        this.mergedUsers = this.mergedUsers.map(user => {
          if (typeof user.schedule === 'string') {
            try {
              user.schedule = JSON.parse(user.schedule) || []
            } catch {
              user.schedule = []
            }
          }
          return user
        })
        
        console.log(`✅ Загружено ${this.mergedUsers.length} объединённых пользователей`)
      } catch (error) {
        console.error('❌ Ошибка загрузки объединённых пользователей:', error)
        this.error = 'Ошибка загрузки пользователей'
        this.mergedUsers = []
      }
    },

    // Загрузка графика и обновление mergedUsers
    async fetchSchedule() {
      if (!this.currentMonth) {
        console.warn('⚠️ Текущий месяц не установлен')
        return
      }

      this.isLoading = true
      this.error = null
      
      try {
        console.log(`📅 Загрузка графика за ${this.currentMonth}`)
        const data = await $fetch(`/api/sched?month=${this.currentMonth}`)
        this.schedule = data as ScheduleRecord[]
        
        // ОБНОВЛЯЕМ mergedUsers данными из графика
        this.updateUsersWithSchedule()
        
      } catch (error: any) {
        console.error('❌ Ошибка загрузки графика:', error)
        this.error = error.message || 'Ошибка загрузки графика'
        this.schedule = []
      } finally {
        this.isLoading = false
      }
    },

    // Обновление schedule у пользователей из загруженного графика
    updateUsersWithSchedule() {
      // Группируем записи графика по employee_id
      const scheduleMap = new Map<string, any[]>()
      
      this.schedule.forEach(record => {
        const empId = record.employee_id
        if (!scheduleMap.has(empId)) {
          scheduleMap.set(empId, [])
        }
        // Добавляем запись в формате { year, month, day, status }
        const [year, month, day] = record.date.split('-').map(Number)
        scheduleMap.get(empId)!.push({
          year,
          month,
          day,
          status: record.status
        })
      })
      
      // Обновляем mergedUsers
      this.mergedUsers = this.mergedUsers.map(user => {
        if (user.mongoId && scheduleMap.has(user.mongoId)) {
          // Объединяем существующий schedule с загруженным
          const existingSchedule = user.schedule || []
          const newSchedule = scheduleMap.get(user.mongoId) || []
          
          // Создаём Map для быстрого поиска по дате
          const scheduleMapByDate = new Map()
          existingSchedule.forEach((s: any) => {
            const key = `${s.year}-${s.month}-${s.day}`
            scheduleMapByDate.set(key, s)
          })
          
          // Обновляем или добавляем новые записи
          newSchedule.forEach((s: any) => {
            const key = `${s.year}-${s.month}-${s.day}`
            scheduleMapByDate.set(key, s)
          })
          
          user.schedule = Array.from(scheduleMapByDate.values())
        }
        return user
      })
      
      console.log(`✅ Обновлены schedule у ${this.mergedUsers.filter(u => u.schedule && u.schedule.length > 0).length} пользователей`)
    },




    // Загрузка всех данных
    async fetchAllData() {
      this.isLoading = true
      this.error = null
      try {
        // Сначала загружаем пользователей
        await this.fetchMergedUsers()
        // Затем загружаем график (он сам обновит mergedUsers)
        await this.fetchSchedule()
      } catch (error: any) {
        this.error = error.message || 'Ошибка загрузки данных'
        console.error('❌ Ошибка загрузки данных:', error)
      } finally {
        this.isLoading = false
      }
    },

    // Обновление статуса
    async updateStatus(employeeEmail: string, date: string, status: string) {
      try {
        const [year, month, day] = date.split('-').map(Number)
        
        // ✅ 1. Обновляем локально, если пользователь есть
        const user = this.mergedUsers.find(u => u.email === employeeEmail)
        if (user) {
          const existing = user.schedule.find(
            (s: any) => s.year === year && s.month === month && s.day === day
          )
          if (existing) {
            existing.status = status
          } else {
            user.schedule.push({ year, month, day, status })
          }
        }
        
        const record = this.schedule.find(
          (s: any) => s.employee_email === employeeEmail && s.date === date
        )
        if (record) {
          record.status = status
        }
        
        this.mergedUsers = [...this.mergedUsers]
        this.schedule = [...this.schedule]
        
        // ✅ 2. Отправляем запрос на сервер
        const response = await $fetch('/api/sched', {
          method: 'POST',
          body: { employee_email: employeeEmail, date, status }
        })
        
        await this.fetchSchedule()
        
        console.log(`✅ Статус обновлён: ${employeeEmail} ${date} -> ${status}`)
        
      } catch (error) {
        console.error('❌ Ошибка обновления статуса:', error)
        this.error = 'Ошибка обновления статуса'
        await this.fetchSchedule()
      }
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

      const authStore = useAuthStore()
      if (this.currentMonth === month) {
        console.log(`📅 Месяц уже установлен: ${month}`)
        return
      }
      this.currentMonth = month
      localStorage.setItem(`currentMonth-${authStore.user?.id}`, this.currentMonth)
      await this.fetchSchedule()
    },

    clearData() {
      this.employees = []
      this.jiraUsers = []
      this.schedule = []
      this.mergedUsers = []
      this.error = null
    }
  }
})