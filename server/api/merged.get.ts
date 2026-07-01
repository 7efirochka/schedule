import { getDb } from '~/server/utils/db'
import { useJsonParser } from '~/composables/useJsonParser'



interface JiraUser {
  id: number
  user_name: string
  email: string
  display_name: string
  active: number
  jira_groups: string
}

interface ScheduleUser {
  _id: string | { $oid: string }
  email: string
  department: string
  role: string
  schedule: string | any[] // Может быть строкой или массивом
  vacationBalance: string
}

interface MergedUser extends JiraUser {
  schedule: any[]
  vacationBalance: Record<string, number>
  department: string
  role: string
  mongoId?: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const { safeParse } = useJsonParser()

  try {
    // 1. Получаем пользователей из JIRA
    const { data } = await $fetch<{ data: JiraUser[] }>(`${config.wpUrl}/jirausers`, {
      headers: {
        'Accept': getHeader(event, 'Accept') || 'application/json',
      }
    })
    const jiraUsers = data
    
    // 2. Получаем пользователей с графиком из MongoDB
    const db = await getDb()
    const scheduleUsersRaw = await db.collection('timesheet').find().toArray()
    
    const scheduleUsers = scheduleUsersRaw as unknown as ScheduleUser[]
    
    // 3. Создаем Map для быстрого доступа по email
    const scheduleMap = new Map<string, ScheduleUser>()

    scheduleUsers.forEach(user => {
      if (user.email) {
        const emailLower = user.email.toLowerCase().trim()
        scheduleMap.set(emailLower, user)
      }
    })
    
    // 4. Объединяем данные
    const mergedUsers: MergedUser[] = jiraUsers
      .filter(user => user.active === 1)
      .map(jiraUser => {
        const emailLower = jiraUser.email.toLowerCase().trim()
        const scheduleUser = scheduleMap.get(emailLower)
        

        let schedule: any[] = []
        let vacationBalance: Record<string, number> = {}
        let department = ''
        let role = ''
        let mongoId: string | undefined = undefined


        
        if (scheduleUser) {
          // Парсим schedule
          if (Array.isArray(scheduleUser.schedule)) {
            schedule = scheduleUser.schedule
          } else if (typeof scheduleUser.schedule === 'string') {
            try {
              schedule = safeParse(scheduleUser.schedule, [])
            } catch (e) {
              console.error(`   ❌ Ошибка парсинга schedule:`, e)
              schedule = []
            }
          } else {
            console.warn(`   ⚠️ Неизвестный тип schedule: ${typeof scheduleUser.schedule}`)
            schedule = []
          }


          
          // Парсим vacationBalance
          if (typeof scheduleUser.vacationBalance === 'string') {
            try {
              vacationBalance = safeParse(scheduleUser.vacationBalance, {})
            } catch (e) {
              console.error(`   ❌ Ошибка парсинга vacationBalance:`, e)
              vacationBalance = {}
            }
          } else if (typeof scheduleUser.vacationBalance === 'object') {
            vacationBalance = scheduleUser.vacationBalance as Record<string, number>
          }
          
          department = scheduleUser.department || ''
          role = scheduleUser.role || ''

          
          
          if (typeof scheduleUser._id === 'object' && '$oid' in scheduleUser._id) {
            mongoId = scheduleUser._id.$oid
          } else if (typeof scheduleUser._id === 'string') {
            mongoId = scheduleUser._id
          } else if (typeof scheduleUser._id === 'object') {
            mongoId = String(scheduleUser._id)
          }
        }
        
        
        return {
          ...jiraUser,
          schedule,
          vacationBalance,
          department,
          role,
          mongoId
        }
      })




    // 5. Сортируем
    mergedUsers.sort((a, b) => {
      if (a.department && !b.department) return -1
      if (!a.department && b.department) return 1
      if (a.department !== b.department) {
        return a.department.localeCompare(b.department)
      }
      return (a.display_name || a.user_name).localeCompare(b.display_name || b.user_name)
    })

    const usersWithSchedule = mergedUsers.filter(u => u.schedule && u.schedule.length > 0)
    
    if (usersWithSchedule.length === 0) {
      console.warn('⚠️ ВНИМАНИЕ: Нет пользователей с графиком! Проверьте данные MongoDB.')
    }

    return {
      status: 'success',
      data: mergedUsers,
      total: mergedUsers.length,
      fromJira: jiraUsers.length,
      fromMongo: scheduleUsers.length,
      merged: usersWithSchedule.length
    }
  } catch (error: any) {
    console.error('❌ Ошибка объединения пользователей:', error)
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || 'Ошибка получения данных пользователей'
    })
  }
})

