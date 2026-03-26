'use client'

const PLATFORM_CONFIG = {
  instagram: { label: 'IG',       bg: 'bg-pink-600/20',    text: 'text-pink-400',   border: 'border-pink-600/30' },
  facebook:  { label: 'FB',       bg: 'bg-blue-600/20',    text: 'text-blue-400',   border: 'border-blue-600/30' },
  threads:   { label: 'TH',       bg: 'bg-slate-600/20',   text: 'text-slate-300',  border: 'border-slate-600/30' },
  youtube:   { label: 'YT',       bg: 'bg-red-600/20',     text: 'text-red-400',    border: 'border-red-600/30' },
  tiktok:    { label: 'TT',       bg: 'bg-cyan-600/20',    text: 'text-cyan-400',   border: 'border-cyan-600/30' },
}

export function PlatformBadge({ platform, size = 'sm' }) {
  const config = PLATFORM_CONFIG[platform] ?? { label: platform, bg: 'bg-slate-700', text: 'text-slate-400', border: 'border-slate-600' }
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'
  return (
    <span className={`inline-flex items-center rounded-md font-semibold border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}>
      {config.label}
    </span>
  )
}

export function PlatformDot({ platform }) {
  const colors = {
    instagram: 'bg-pink-500',
    facebook: 'bg-blue-500',
    threads: 'bg-slate-400',
    youtube: 'bg-red-500',
    tiktok: 'bg-cyan-400',
  }
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[platform] ?? 'bg-slate-500'}`} />
}
