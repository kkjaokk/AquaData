import { Pencil, Plus, UserCheck, UserX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Alert from '../components/ui/Alert'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { buttonClasses } from '../components/ui/button-styles'
import Segmented from '../components/ui/Segmented'
import Spinner from '../components/ui/Spinner'
import TextField from '../components/ui/TextField'
import { listAthletes, updateAthlete } from '../services/athletes'
import { calcAge, formatDate } from '../utils/date'

const PAGE_SIZE = 20

const STATUS_OPTIONS = [
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
  { value: 'all', label: 'Todos' },
]

const SEX_LABEL = { M: 'Masculino', F: 'Feminino' }
const queryKey = (status, search) => `${status}|${search}`
const activeParam = (status) => (status === 'all' ? undefined : status === 'active')

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export default function AthletesPage() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('active')
  const [result, setResult] = useState({ key: null, items: [], hasMore: false, error: '' })
  const [actionError, setActionError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const currentKey = queryKey(status, search)
  const loading = result.key !== currentKey

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(id)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false
    const key = queryKey(status, search)
    listAthletes({ active: activeParam(status), search, limit: PAGE_SIZE })
      .then((data) => {
        if (!cancelled)
          setResult({ key, items: data, hasMore: data.length === PAGE_SIZE, error: '' })
      })
      .catch((err) => {
        if (!cancelled) setResult({ key, items: [], hasMore: false, error: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [status, search])

  async function loadMore() {
    setLoadingMore(true)
    setActionError('')
    try {
      const data = await listAthletes({
        active: activeParam(status),
        search,
        limit: PAGE_SIZE,
        offset: result.items.length,
      })
      setResult((r) => ({
        ...r,
        items: [...r.items, ...data],
        hasMore: data.length === PAGE_SIZE,
      }))
    } catch (err) {
      setActionError(err.message)
    } finally {
      setLoadingMore(false)
    }
  }

  async function toggleActive(athlete) {
    setBusyId(athlete.id)
    setActionError('')
    try {
      const updated = await updateAthlete(athlete.id, { active: !athlete.active })
      setResult((r) => ({
        ...r,
        items:
          status === 'all'
            ? r.items.map((a) => (a.id === updated.id ? updated : a))
            : r.items.filter((a) => a.id !== updated.id),
      }))
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const filtering = search.trim() !== '' || status !== 'active'

  return (
    <>
      <PageHeader title="Atletas" description="Gerencie os atletas que você acompanha.">
        <Link to="/atletas/novo" className={buttonClasses('primary')}>
          <Plus size={16} aria-hidden="true" />
          Novo atleta
        </Link>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <TextField
          id="search"
          type="search"
          aria-label="Buscar atleta por nome"
          placeholder="Buscar por nome"
          value={searchInput}
          maxLength={120}
          onChange={(e) => setSearchInput(e.target.value)}
          className="sm:w-72"
        />
        <Segmented
          options={STATUS_OPTIONS}
          value={status}
          onChange={setStatus}
          ariaLabel="Filtrar por situação"
        />
      </div>

      {actionError && (
        <div className="mb-4">
          <Alert>{actionError}</Alert>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : result.error ? (
        <Alert>{result.error}</Alert>
      ) : result.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line py-16 text-center">
          <p className="font-medium">
            {filtering ? 'Nenhum atleta encontrado' : 'Você ainda não cadastrou atletas'}
          </p>
          <p className="mt-1 text-sm text-muted">
            {filtering
              ? 'Tente outro nome ou outro filtro.'
              : 'Cadastre o primeiro para começar a acompanhar a evolução.'}
          </p>
          {!filtering && (
            <Link to="/atletas/novo" className={buttonClasses('primary', 'md', 'mt-6')}>
              Cadastrar atleta
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-subtle text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">Atleta</th>
                <th scope="col" className="px-5 py-3 font-medium">Idade</th>
                <th scope="col" className="px-5 py-3 font-medium">Sexo</th>
                <th scope="col" className="px-5 py-3 font-medium">Situação</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((athlete) => (
                <tr key={athlete.id} className="border-t border-line">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand-text"
                      >
                        {initials(athlete.name)}
                      </span>
                      <div>
                        <p className="font-medium">{athlete.name}</p>
                        <p className="text-xs text-muted">
                          Nascimento: {formatDate(athlete.birth_date)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">{calcAge(athlete.birth_date)} anos</td>
                  <td className="px-5 py-3">{SEX_LABEL[athlete.sex]}</td>
                  <td className="px-5 py-3">
                    <Badge tone={athlete.active ? 'success' : 'neutral'}>
                      {athlete.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/atletas/${athlete.id}/editar`}
                        className={buttonClasses('secondary', 'sm')}
                      >
                        <Pencil size={14} aria-hidden="true" />
                        Editar
                      </Link>
                      <Button
                        size="sm"
                        variant={athlete.active ? 'danger' : 'secondary'}
                        disabled={busyId === athlete.id}
                        onClick={() => toggleActive(athlete)}
                      >
                        {athlete.active ? (
                          <UserX size={14} aria-hidden="true" />
                        ) : (
                          <UserCheck size={14} aria-hidden="true" />
                        )}
                        {athlete.active ? 'Inativar' : 'Reativar'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !result.error && result.items.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>Mostrando {result.items.length} atleta(s)</span>
          {result.hasMore && (
            <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? 'Carregando…' : 'Carregar mais'}
            </Button>
          )}
        </div>
      )}
    </>
  )
}