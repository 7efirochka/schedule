import { getDb } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { employee_email, date, status } = body
  
  if (!employee_email || !date || !status) {
    throw createError({
      statusCode: 400,
      message: 'Не все обязательные поля заполнены'
    })
  }

  const [year, month, day] = date.split('-').map(Number)
  const db = await getDb()
  const collection = db.collection('timesheet')

  try {
    // ✅ 1. Находим пользователя
    let user = await collection.findOne({ email: employee_email })
    let created = false
    let userId = ''
    
    // ✅ 2. Если нет - создаём
    if (!user) {
      const newUser = {
        email: employee_email,
        department: '',
        schedule: [],
        vacationBalance: {},
        createdAt: new Date()
      }
      
      const result = await collection.insertOne(newUser)
      user = await collection.findOne({ _id: result.insertedId })
      created = true
      userId = result.insertedId.toString()
      
      // ✅ Проверяем, что пользователь создан
      if (!user) {
        throw createError({
          statusCode: 500,
          message: 'Не удалось создать пользователя'
        })
      }
    }
    
    // ✅ Теперь TypeScript знает, что user точно существует
    // ✅ 3. Получаем schedule как массив
    let schedule = []
    
    if (Array.isArray(user.schedule)) {
      schedule = user.schedule
    } else if (typeof user.schedule === 'string') {
      try {
        schedule = user.schedule.trim() ? JSON.parse(user.schedule) : []
      } catch (e) {
        console.warn('Ошибка парсинга schedule:', e)
        schedule = []
      }
    }
    
    // ✅ 4. Ищем или добавляем запись
    const existingIndex = schedule.findIndex(
      (s: any) => s.year === year && s.month === month && s.day === day
    )
    
    if (existingIndex !== -1) {
      schedule[existingIndex].status = status
    } else {
      schedule.push({ year, month, day, status })
    }
    
    // ✅ 5. Сохраняем
    await collection.updateOne(
      { email: employee_email },
      { $set: { schedule: schedule } }
    )
    
    return { 
      success: true,
      created: created,
      userId: userId
    }
    
  } catch (error: any) {
    console.error('❌ Ошибка:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка обновления статуса'
    })
  }
})