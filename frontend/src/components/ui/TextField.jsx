export default function TextField({ label, id, hint, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-fg">
        {label}
      </label>
      <input
        id={id}
        className={`h-10 w-full rounded-lg border border-line bg-bg px-3 text-sm text-fg placeholder:text-muted focus:border-brand-text focus:outline-2 focus:outline-brand-text/30 ${className}`}
        {...props}
      />
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}