import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import Button from './ui/Button'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <Button
      variant="ghost"
      onClick={toggle}
      className="!px-0 w-10"
      aria-label={dark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  )
}