export const ROUNDS = 5
export const MAX_TRIES = 5
export const START_BLUR = 15
export const BLUR_STEP = 3

export interface GameSession {
  categoryId: number
  slug: string
  videoIds: number[]
  index: number
  tries: number
  score: number
  correct: number
  roundDone: boolean
  finished: boolean
  saved: boolean
}

export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

/** Ignora acentos/maiúsculas. Aceita nome completo, qualquer parte do nome ou trecho com mais de 3 letras. */
export function isCorrect(guess: string, answer: string) {
  const g = normalize(guess)
  const a = normalize(answer)
  if (g.length < 2) return false
  return a === g || a.split(' ').includes(g) || (g.length > 3 && a.includes(g))
}

/** 100 pontos no primeiro palpite, -25 por erro anterior, mínimo de 10. */
export const roundScore = (tries: number) => Math.max(10, 100 - 25 * (tries - 1))

export const blurFor = (tries: number, done: boolean) =>
  done ? 0 : Math.max(0, START_BLUR - BLUR_STEP * tries)

export function shuffle<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
