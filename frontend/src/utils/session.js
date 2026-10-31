export const STROKE_LABEL = {
  freestyle: 'Livre',
  backstroke: 'Costas',
  breaststroke: 'Peito',
  butterfly: 'Borboleta',
  medley: 'Medley',
}

export const SESSION_TYPE_LABEL = {
  training: 'Treino',
  competition: 'Competição',
}

export const formatRace = (session) => `${session.distance_m}m ${STROKE_LABEL[session.stroke]}`

export const formatDecimal = (value, digits = 2) => value.toFixed(digits).replace('.', ',')

// 29.38 -> 0:29,38 | 64.62 -> 1:04,62
export function formatTime(seconds) {
  const cs = Math.round(seconds * 100)
  const minutes = Math.floor(cs / 6000)
  const rest = cs % 6000
  const ss = String(Math.floor(rest / 100)).padStart(2, '0')
  const cc = String(rest % 100).padStart(2, '0')
  return `${minutes}:${ss},${cc}`
}