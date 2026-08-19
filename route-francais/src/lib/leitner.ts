export const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 16, 30]
export const LESSON_SIZE = 8

export function pick<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  const out: T[] = []
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0])
  }
  return out
}
