// import { prisma } from '~/server/utils/prisma'

// export default defineEventHandler(async (event) => {
//   const body = await readBody(event)
//   const { employee_id, date, status } = body

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