  import { getDb } from '~/server/utils/db'

  export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const year = Number(query.year ?? new Date().getFullYear())

    const db = await getDb()
    const employees = await db.collection('employees').find().sort({ department: 1, name: 1 }).toArray()

    const result = employees.map((emp: any) => {
      const months: any = {}
      let totalVacation = 0

      const yearSchedule = (emp.schedule || []).filter((s: any) => s.year === year)

      yearSchedule.forEach((s: any) => {
        const monthKey = `${year}-${String(s.month).padStart(2, '0')}`
        if (!months[monthKey]) {
          months[monthKey] = { vacation: 0, sick: 0, dayoff: 0 }
        }
        if (s.status === 'vacation') { months[monthKey].vacation++; totalVacation++ }
        if (s.status === 'sick') months[monthKey].sick++
        if (s.status === 'day_off') months[monthKey].dayoff++
      })

      const carriedOver = emp.vacationBalance?.[String(year)] ?? 0
      // console.log('emp vacationBalance:', employees.email, employees.vacationBalance)
      console.log('carriedOver:', carriedOver)

      return {
        id: emp._id,
        email: emp.email,
        department: emp.department,
        days_carried_over: carriedOver,
        days_used: totalVacation,
        days_remaining: 28 + carriedOver - totalVacation,
        months
      }
    })

    return result
  })