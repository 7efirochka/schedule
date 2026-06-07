// import { PrismaClient } from '@prisma/client'

// const prisma = new PrismaClient()

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