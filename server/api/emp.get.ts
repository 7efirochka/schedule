import { prisma } from '../utils/prisma'

export default defineEventHandler(async () => {
    const employees = await prisma.employee.findMany({
        include: {
            department: true
        }
    })
    return employees
})