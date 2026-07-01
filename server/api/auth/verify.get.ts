// server/api/auth/verify.get.ts
export default defineEventHandler(async (event) => {
  try {
    const authHeader = getHeader(event, 'Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { valid: false }
    }

    const token = authHeader.substring(7)
    const config = useRuntimeConfig()

    try {
      // ✅ Динамический импорт
      const jwt = await import('jsonwebtoken')
      const decoded = jwt.default.verify(token, config.jwtSecret) as {
        id: string
        email: string
        roles: string[]
      }
      
      return {
        valid: true,
        user: {
          id: decoded.id,
          email: decoded.email,
          roles: decoded.roles || ['user']
        }
      }
    } catch {
      return { valid: false }
    }
  } catch {
    return { valid: false }
  }
})