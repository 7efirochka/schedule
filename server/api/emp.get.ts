import { getDb } from '~/server/utils/db'

export default defineEventHandler(async () => {
  const db = await getDb()
  const employees = await db.collection('employees').find().toArray()
  return employees
})