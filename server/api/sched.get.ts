import { getDb } from "~/server/utils/db" 

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const month = query.month as string
  const [year, monthNum] = month.split('-').map(Number)

  const db = await getDb()
  const employees = await db.collection("employees").find().toArray()

  const result: any[] = []

  employees.forEach(emp => {
    const days = (emp.schedule || []).filter(
      (s: any) => s.year === year && s.month === monthNum
    )
    days.forEach((s: any) => {
      result.push({
        employee_id: emp._id.toString(),
        date: `${year}-${String(monthNum).padStart(2, '0')}-${String(s.day).padStart(2, '0')}`,
        status: s.status
      })
    })
  })

  return result
})
