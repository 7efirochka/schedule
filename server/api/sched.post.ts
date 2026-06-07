// import { prisma } from '../utils/prisma'

// export default defineEventHandler(async (event) => {
//   const query = getQuery(event)
//   const month = query.month as string

//   const [year, monthNum] = month.split('-').map(Number)
//   const startDate = new Date(year, monthNum - 1, 1)
//   const endDate = new Date(year, monthNum, 0)

//   const schedule = await prisma.schedule.findMany({
//     where: {
//       date: {
//         gte: startDate,
//         lte: endDate
//       }
//     }
//   })
//   return schedule
// })

import { db } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { employee_id, date, status } = body

  await db.query(`
    INSERT INTO schedule (employee_id, date, status)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE status = ?
  `, [employee_id, date, status, status])

  return { success: true }
})