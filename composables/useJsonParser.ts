// composables/useJsonParser.ts
export function useJsonParser() {
  const safeParse = <T = any>(data: string | null | undefined, defaultValue: T): T => {
    if (!data || typeof data !== 'string' || !data.trim()) {
      return defaultValue
    }
    
    try {
      return JSON.parse(data) as T
    } catch (error) {
      console.warn('Ошибка парсинга JSON:', error)
      return defaultValue
    }
  }

  const safeStringify = (data: any, defaultValue: string = '[]'): string => {
    if (!data) return defaultValue
    try {
      return JSON.stringify(data)
    } catch (error) {
      console.warn('Ошибка сериализации JSON:', error)
      return defaultValue
    }
  }

  return {
    safeParse,
    safeStringify
  }
}