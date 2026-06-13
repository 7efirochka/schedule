import { db } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const year = query.year ?? new Date().getFullYear()

  const [employees]: any = await db.query(`
    SELECT 
      e.id,
      e.name,
      d.name as department,
      COALESCE(vb.days_carried_over, 0) as days_carried_over
    FROM employee e
    LEFT JOIN departments d ON e.dep_id = d.id
    LEFT JOIN vacation vb ON vb.employee_id = e.id AND vb.year = ?
    ORDER BY d.name, e.name
  `, [year])

  const [scheduleData]: any = await db.query(`
    SELECT 
      employee_id,
      DATE_FORMAT(date, '%Y-%m') as month,
      SUM(status = 'vacation') as vacation_days,
      SUM(status = 'sick') as sick_days,
      SUM(status = 'day_off') as dayoff_days
    FROM schedule
    WHERE YEAR(date) = ?
    GROUP BY employee_id, DATE_FORMAT(date, '%Y-%m')
  `, [year])

  const result = employees.map((emp: any) => {
    const months: any = {}
    let totalVacation = 0

    scheduleData
      .filter((s: any) => s.employee_id === emp.id)
      .forEach((s: any) => {
        months[s.month] = {
          vacation: s.vacation_days,
          sick: s.sick_days,
          dayoff: s.dayoff_days
        }
        totalVacation += Number(s.vacation_days)
      })

    return {
      ...emp,
      days_used: totalVacation,
      days_remaining: 28 + emp.days_carried_over - totalVacation,
      months
    }
  })

  return result
})