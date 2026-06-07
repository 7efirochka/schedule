import { db } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email } = body

  const [rows]: any = await db.query(`
    SELECT e.id, e.name, e.email, d.name as department
    FROM employee e
    LEFT JOIN departments d ON e.dep_id = d.id
    WHERE e.email = ?
  `, [email])

  if (rows.length === 0) {
    throw createError({ statusCode: 401, message: 'Пользователь не найден' })
  }

  return rows[0]
})