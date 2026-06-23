
export default defineEventHandler(async (event) => {

  try {
    const config = useRuntimeConfig()
    const response = await $fetch(`${config.wpUrl}/jirausers`, {
      headers: {
        'Accept': getHeader(event, 'Accept') || 'application/json',
      }
    })
    return response
    
  } catch (error: any) {
    // Если внешний API вернул ошибку, передаем её дальше
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || 'Ошибка проксирования запроса'
    })
  }

})
