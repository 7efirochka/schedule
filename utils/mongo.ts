export function normalizeMongoId(id: any): string {
  if (!id) return ''
  if (typeof id === 'string' && id.includes('$oid')) {
    try {
      const parsed = JSON.parse(id)
      return parsed.$oid || id
    } catch {
      return id
    }
  }

  
  return String(id)
}