export const productionCalendar: Record<number, {
  calendar: number[]
  working: number[]
  preholiday: number[]
}> = {
  2026: {
    calendar: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
    working:  [15, 19, 21, 22, 19, 21, 23, 21, 22, 22, 20, 22],
    preholiday: [0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0],
  },
  2025: {
    calendar: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
    working:  [17, 20, 20, 22, 20, 21, 23, 21, 22, 23, 20, 22],
    preholiday: [0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0],
  }
}