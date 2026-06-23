import { MongoClient, Db, IsAny } from 'mongodb'

let client: MongoClient | null = null
let db: Db | null = null

const config = useRuntimeConfig()

export async function getDb(): Promise<Db> {
  try {
    if (!db) {
      client = new MongoClient(config.mongoUrl)
      await client.connect()
      console.log('✅ MongoDB подключен')

    db = client.db('atlas_pro')

  }
  } catch (error: any) {
    console.error('❌ Ошибка MongoDB:', error.message)
  }

  return db as Db
}