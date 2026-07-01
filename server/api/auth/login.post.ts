import { getDb } from '~/server/utils/db'


interface User {
  _id: string | { $oid: string }
  email: string
  password: string
  roles: string[]
  refreshTokens: string[]
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email и пароль обязательны'
    })
  }

  try {
    const bcrypt = (await import('bcrypt')) as any
    const jwt = (await import('jsonwebtoken')) as any

    const db = await getDb()
    const users = db.collection<User>('users')

    // Находим пользователя по email
    const user = await users.findOne({ email: email.trim().toLowerCase() })


    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Неверный email или пароль'
      })
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Неверный email или пароль'
      })
    }

    // Генерируем JWT токен
    const config = useRuntimeConfig()
    const userId = typeof user._id === 'object' && '$oid' in user._id 
      ? user._id.$oid 
      : String(user._id)

    const token = jwt.default.sign(
      {
        id: userId,
        email: user.email,
        roles: user.roles || ['user']
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    )

    // Обновляем refreshToken (опционально)
    await users.updateOne(
      { _id: user._id },
      { $addToSet: { refreshTokens: token } }
    )

    // Возвращаем данные пользователя и токен
    return {
      token,
      user: {
        id: userId,
        email: user.email,
        roles: user.roles || ['user']
      }
    }
  } catch (error: any) {
    console.error('Ошибка авторизации:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Ошибка авторизации'
    })
  }
})