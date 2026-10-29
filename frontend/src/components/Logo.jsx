import { Waves } from 'lucide-react'

export default function Logo({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 text-lg tracking-tight ${className}`}>
      <span className="grid size-8 place-items-center rounded-lg bg-brand text-brand-fg">
        <Waves size={18} aria-hidden="true" />
      </span>
      <span>
        <span className="font-light">aqua</span>
        <span className="font-bold">Data</span>
      </span>
    </span>
  )
}