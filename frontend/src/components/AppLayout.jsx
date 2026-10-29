import { LogOut } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import Button from './ui/Button'

export default function AppLayout() {
  const { coach, signOut } = useAuth()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line bg-bg/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link to="/atletas" aria-label="aquaData, página inicial">
            <Logo />
          </Link>
          <nav aria-label="Principal" className="flex items-center gap-1">
            <NavLink
              to="/atletas"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-soft text-brand-text' : 'text-muted hover:text-fg'
                }`
              }
            >
              Atletas
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <span className="mr-2 hidden text-sm text-muted sm:inline">{coach.name}</span>
            <ThemeToggle />
            <Button variant="ghost" onClick={signOut} aria-label="Sair">
              <LogOut size={16} />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}