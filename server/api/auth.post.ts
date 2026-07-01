import { getDb } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  const body = await readBody(event)
  const { email } = body

  //const employee = await db.collection('timesheet').findOne({ email })

  const employee = await db.collection('users').findOne({ email })

  if (!employee) {
    throw createError({ statusCode: 401, message: 'Пользователь не найден' })
  }

  return {
    id: employee._id.toString(),
    email: employee.email,
    roles: employee.roles,
    department: employee.department
  }
})