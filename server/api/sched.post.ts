import { getDb } from '~/server/utils/db'
import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { employee_id, date, status } = body
  const [year, month, day] = date.split('-').map(Number)

  const db = await getDb()

  try {
    const existing = await db.collection('timesheet').findOne({
    _id: new ObjectId(employee_id),
    schedule: {
        $elemMatch: { year, month, day }
    }
    })   

    if (existing) {
    await db.collection('timesheet').updateOne(
        {
        _id: new ObjectId(employee_id),
        'schedule': { $elemMatch: { year, month, day } }
        },
        { $set: { 'schedule.$.status': status } }
    )
    } else {
    await db.collection('timesheet').updateOne(
        { _id: new ObjectId(employee_id) },
        { $push: { schedule: { year, month, day, status } } as any }
    )
    }

    return { success: true }
  } catch (e) {
    throw createError({ statusCode: 500, message: String(e) })
  }
  
})

