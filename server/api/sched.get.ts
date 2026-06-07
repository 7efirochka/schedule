// import { prisma } from '../utils/prisma'

// // export default defineEventHandler(async (event) => {
// //   const body = await readBody(event)
// //   const { employee_id, date, status } = body

//   const record = await prisma.schedule.upsert({
//     where: {
//       employee_id_date: {
//         employee_id,
//         date: new Date(date)
//       }
//     },
//     update: { status },
//     create: { employee_id, date: new Date(date), status }
//   })
//   return record
// })

import { db } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const month = query.month as string

  const [rows] = await db.query(`
    SELECT id, employee_id, DATE_FORMAT(date, '%Y-%m-%d') as date, status
    FROM schedule s
    WHERE DATE_FORMAT(s.date, '%Y-%m') = ?
  `, [month])

  return rows
})