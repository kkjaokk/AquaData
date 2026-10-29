const tones = {
  success: 'bg-success-soft text-success',
  neutral: 'bg-subtle text-muted',
}

export default function Badge({ tone = 'neutral', children }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  )
}