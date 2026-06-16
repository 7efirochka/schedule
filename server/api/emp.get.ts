import { db } from '~/server/utils/db'

export default defineEventHandler(async () => {
  const [rows] = await db.query(`
    SELECT e.id, e.name, e.role, d.name as department
    FROM employee e
    LEFT JOIN departments d ON e.dep_id = d.id
  `)
  return rows
})