import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import TextField from '../components/ui/TextField'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { coach, signIn } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const from = location.state?.from?.pathname ?? '/atletas'
  if (coach) return <Navigate to={from} replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo className="text-2xl" />
        </div>
        <div className="rounded-2xl border border-line bg-surface p-8">
          <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
          <p className="mt-1 text-sm text-muted">
            Acesse o painel de análise dos seus atletas.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <TextField
              id="email"
              type="email"
              label="E-mail"
              value={email}
              autoComplete="email"
              required
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              id="password"
              type="password"
              label="Senha"
              value={password}
              autoComplete="current-password"
              required
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <Alert>{error}</Alert>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}