// import { prisma } from '../utils/prisma'

// export default defineEventHandler(async () => {
//     const employees = await prisma.employee.findMany({
//         include: {
//             department: true
//         }
//     })
//     return employees
// })

import { db } from '~/server/utils/db'

export default defineEventHandler(async () => {
  const [rows] = await db.query(`
    SELECT e.id, e.name, d.name as department
    FROM employee e
    LEFT JOIN departments d ON e.dep_id = d.id
  `)
  return rows
})