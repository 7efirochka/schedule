import { MongoClient, Db } from 'mongodb'

let client: MongoClient | null = null
let db: Db | null = null

export async function getDb() {
  if (!db) {
    client = new MongoClient('mongodb://localhost:27017')
    await client.connect()
    db = client.db('schedule')
  }
  return db
}