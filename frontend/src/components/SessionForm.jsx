import { useState } from 'react'
import { todayIso } from '../utils/date'
import { formatTime, parseDecimal, parseInteger, parseTime } from '../utils/session'
import Alert from './ui/Alert'
import Button from './ui/Button'
import Segmented from './ui/Segmented'
import Select from './ui/Select'
import TextField from './ui/TextField'

const TYPE_OPTIONS = [
  { value: 'training', label: 'Treino' },
  { value: 'competition', label: 'Competição' },
]
const POOL_OPTIONS = [
  { value: '25', label: '25 m' },
  { value: '50', label: '50 m' },
]
const STROKE_OPTIONS = [
  { value: '', label: 'Selecione o nado' },
  { value: 'freestyle', label: 'Livre' },
  { value: 'backstroke', label: 'Costas' },
  { value: 'breaststroke', label: 'Peito' },
  { value: 'butterfly', label: 'Borboleta' },
  { value: 'medley', label: 'Medley' },
]

function initialValues(initial, fixedAthlete) {
  return {
    athleteId: fixedAthlete ? String(fixedAthlete.id) : '',
    sessionType: initial?.session_type ?? 'training',
    date: initial?.session_date ?? todayIso(),
    stroke: initial?.stroke ?? '',
    pool: initial ? String(initial.pool_length_m) : '25',
    distance: initial ? String(initial.distance_m) : '',
    totalTime: initial ? formatTime(initial.total_time_s) : '',
    swimDistance: initial ? String(initial.swim_distance_m).replace('.', ',') : '',
    swimTime: initial ? formatTime(initial.swim_time_s) : '',
    cycles: initial ? String(initial.stroke_count) : '',
    notes: initial?.notes ?? '',
  }
}

function buildPayload(v) {
  if (!v.athleteId) return { error: 'Selecione o atleta' }
  if (!v.stroke) return { error: 'Selecione o nado' }
  if (!v.date) return { error: 'Informe a data' }
  if (v.date > todayIso()) return { error: 'A data não pode estar no futuro' }

  const pool = Number(v.pool)
  const distance = parseInteger(v.distance)
  if (!distance) return { error: 'Informe a distância total, em metros' }
  if (distance % pool !== 0)
    return { error: `A distância deve ser múltipla do tamanho da piscina (${pool} m)` }

  const total = parseTime(v.totalTime)
  if (total === null) return { error: 'Informe o tempo total no formato 1:02,45' }

  const swimDistance = parseDecimal(v.swimDistance)
  if (!swimDistance) return { error: 'Informe a distância do trecho de nado puro' }
  if (swimDistance > distance)
    return { error: 'O trecho de nado puro não pode superar a distância total' }

  const swimTime = parseTime(v.swimTime)
  if (swimTime === null) return { error: 'Informe o tempo do trecho de nado puro (ex.: 0:40,20)' }
  if (swimTime > total) return { error: 'O tempo do trecho não pode superar o tempo total' }

  const cycles = parseInteger(v.cycles)
  if (!cycles) return { error: 'Informe os ciclos de braçada contados no trecho de nado puro' }

  return {
    payload: {
      session_date: v.date,
      session_type: v.sessionType,
      stroke: v.stroke,
      pool_length_m: pool,
      distance_m: distance,
      total_time_s: total,
      stroke_count: cycles,
      swim_distance_m: swimDistance,
      swim_time_s: swimTime,
      notes: v.notes.trim() || null,
    },
  }
}

function Section({ title, description, children }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

function SegmentedField({ label, ...props }) {
  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium text-fg">{label}</span>
      <div>
        <Segmented ariaLabel={label} {...props} />
      </div>
    </div>
  )
}

export default function SessionForm({
  athletes = [],
  fixedAthlete,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState(() => initialValues(initial, fixedAthlete))
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))
  const onText = (field) => (e) => set(field)(e.target.value)

  const athleteOptions = [
    { value: '', label: 'Selecione o atleta' },
    ...athletes.map((a) => ({ value: String(a.id), label: a.name })),
  ]

  async function handleSubmit(event) {
    event.preventDefault()
    const { error: validationError, payload } = buildPayload(form)
    if (validationError) return setError(validationError)

    setError('')
    setSubmitting(true)
    try {
      await onSubmit(Number(form.athleteId), payload)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="max-w-3xl space-y-8 rounded-2xl border border-line bg-surface p-6 sm:p-8"
    >
      <Section title="Identificação">
        {fixedAthlete ? (
          <TextField id="athlete-fixed" label="Atleta" value={fixedAthlete.name} readOnly disabled />
        ) : (
          <Select
            id="athlete"
            label="Atleta"
            hideLabel={false}
            options={athleteOptions}
            value={form.athleteId}
            onChange={set('athleteId')}
          />
        )}
        <SegmentedField
          label="Tipo"
          options={TYPE_OPTIONS}
          value={form.sessionType}
          onChange={set('sessionType')}
        />
        <TextField
          id="date"
          type="date"
          label="Data"
          value={form.date}
          max={todayIso()}
          onChange={onText('date')}
        />
        <Select
          id="stroke"
          label="Nado"
          hideLabel={false}
          options={STROKE_OPTIONS}
          value={form.stroke}
          onChange={set('stroke')}
        />
      </Section>

      <Section title="Prova">
        <SegmentedField
          label="Piscina"
          options={POOL_OPTIONS}
          value={form.pool}
          onChange={set('pool')}
        />
        <TextField
          id="distance"
          label="Distância total (m)"
          inputMode="numeric"
          value={form.distance}
          hint="Deve ser múltipla do tamanho da piscina."
          onChange={onText('distance')}
        />
        <TextField
          id="total-time"
          label="Tempo total"
          inputMode="text"
          placeholder="1:02,45"
          value={form.totalTime}
          hint="Formato minutos:segundos,centésimos. Ex.: 1:02,45 ou 29,38."
          onChange={onText('totalTime')}
        />
      </Section>

      <Section
        title="Trecho de nado puro"
        description="Trecho nadado sem a saída e sem as viradas. É a base de VN, CB, cadência, IN e SWOLF."
      >
        <TextField
          id="swim-distance"
          label="Distância do trecho (m)"
          inputMode="decimal"
          value={form.swimDistance}
          onChange={onText('swimDistance')}
        />
        <TextField
          id="swim-time"
          label="Tempo do trecho"
          inputMode="text"
          placeholder="0:40,20"
          value={form.swimTime}
          onChange={onText('swimTime')}
        />
        <TextField
          id="cycles"
          label="Ciclos de braçada"
          inputMode="numeric"
          value={form.cycles}
          hint="Conte no trecho de nado puro. Os dois braços juntos contam 1 ciclo."
          onChange={onText('cycles')}
        />
      </Section>

      <section className="space-y-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-fg">
          Observações (opcional)
        </label>
        <textarea
          id="notes"
          value={form.notes}
          maxLength={1000}
          onChange={onText('notes')}
          className="min-h-24 w-full rounded-xl border border-accent/40 bg-bg px-4 py-3 text-sm text-fg placeholder:text-muted focus:border-brand focus:outline-2 focus:outline-accent/40"
        />
      </section>

      {error && <Alert>{error}</Alert>}
      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Salvando…' : submitLabel}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}