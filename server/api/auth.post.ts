import { getDb } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  const body = await readBody(event)
  const { email } = body

  const employee = await db.collection('timesheet').findOne({ email })

  if (!employee) {
    throw createError({ statusCode: 401, message: 'Пользователь не найден' })
  }

  return {
    id: employee._id.toString(),
    email: employee.email,
    role: employee.role,
    department: employee.department
  }
})