
import { getDb } from "~/server/utils/db"
import { useJsonParser } from '~/composables/useJsonParser'

interface JiraUser {
  id: number
  user_name: string
  email: string
  display_name: string
  active: number
  jira_groups: string
}

export default defineEventHandler(async (event) => {
  try {
    const { safeParse } = useJsonParser()

    const query = getQuery(event)
    const month = query.month as string
    
    if (!month) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Параметр month обязателен'
      })
    }

    const [year, monthNum] = month.split('-').map(Number)
    
    if (isNaN(year) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Неверный формат месяца. Ожидается YYYY-MM'
      })
    }


    const db = await getDb()
    const employees = await db.collection("timesheet").find().toArray()
    

    // Получаем пользователей из JIRA для обогащения данными
    let jiraUsers: JiraUser[] = []
    try {
      const response = await $fetch('http://webportal.atlas-pro24.local:3000/jirausers')
      jiraUsers = Array.isArray(response) ? response : []
    } catch (error) {
      console.warn('⚠️ Не удалось загрузить пользователей из JIRA:', error)
    }

    // Создаем Map для быстрого доступа к пользователям JIRA по email
    const jiraMap = new Map<string, JiraUser>()
    jiraUsers.forEach((user: JiraUser) => {
      if (user.email) {
        jiraMap.set(user.email.toLowerCase().trim(), user)
      }
    })

    const result: any[] = []

    employees.forEach(emp => {
      // Получаем email сотрудника
      const email = emp.email?.toLowerCase().trim() || ''
      
      // Находим пользователя в JIRA
      const jiraUser = jiraMap.get(email)
      
      // Получаем schedule
      let schedule: any[] = []
      
      if (Array.isArray(emp.schedule)) {
        schedule = emp.schedule
      } else if (typeof emp.schedule === 'string') {
        try {
          if (!emp.schedule) return schedule = []
          schedule = safeParse(emp.schedule, [])
        } catch (e) {
          console.error(`❌ Ошибка парсинга schedule для ${email}:`, e)
          schedule = []
        }
      }

      // Фильтруем по году и месяцу
      const filteredDays = schedule.filter(
        (s: any) => s.year === year && s.month === monthNum
      )

      // Добавляем записи в результат
      filteredDays.forEach((s: any) => {
        result.push({
          employee_id: emp._id.toString(),
          employee_email: email,
          employee_name: jiraUser?.display_name || jiraUser?.user_name || email,
          employee_department: emp.department || jiraUser?.department || '',
          jira_id: jiraUser?.id || null,
          date: `${year}-${String(monthNum).padStart(2, '0')}-${String(s.day).padStart(2, '0')}`,
          day: s.day,
          status: s.status,
          is_weekend: isWeekend(year, monthNum, s.day),
          vacation_balance: emp.vacationBalance ? parseVacationBalance(emp.vacationBalance) : {}
        })
      })
    })


    return result

  } catch (error: any) {
    console.error('❌ Ошибка получения графика:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Ошибка получения данных графика'
    })
  }
})

// Вспомогательная функция для проверки выходного дня
function isWeekend(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day)
  const dayOfWeek = date.getDay()
  return dayOfWeek === 0 || dayOfWeek === 6
}

// Вспомогательная функция для парсинга vacationBalance
function parseVacationBalance(balance: string | any): Record<string, number> {
  if (typeof balance === 'object') {
    return balance as Record<string, number>
  }
  
  if (typeof balance === 'string') {
    try {
      return JSON.parse(balance) || {}
    } catch {
      return {}
    }
  }
  
  return {}
}

