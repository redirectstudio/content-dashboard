'use client'

import { RefreshCw } from 'lucide-react'

const PLATFORMS = [
  { value: 'all',       label: 'All Platforms' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook',  label: 'Facebook' },
  { value: 'threads',   label: 'Threads' },
  { value: 'youtube',   label: 'YouTube' },
  { value: 'tiktok',    label: 'TikTok' },
]

const PERIODS = [
  { value: '7d',  label: '7D' },
  { value: '14d', label: '14D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
]

export function FilterBar({
  platform, onPlatformChange,
  avatar,   onAvatarChange,
  period,   onPeriodChange,
  onRefresh, syncing,
  avatarNames = {},
  lastSynced,
}) {
  const AVATARS = [
    { value: 'all',      label: 'All Avatars' },
    { value: 'avatar_1', label: avatarNames.avatar_1 ?? 'Avatar 1' },
    { value: 'avatar_2', label: avatarNames.avatar_2 ?? 'Avatar 2' },
    { value: 'avatar_3', label: avatarNames.avatar_3 ?? 'Avatar 3' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Platform filter */}
      <div className="flex items-center gap-1 bg-surface-700/50 rounded-xl p-1 flex-wrap">
        {PLATFORMS.map(p => (
          <button
            key={p.value}
            onClick={() => onPlatformChange(p.value)}
            className={`btn ${platform === p.value ? 'btn-active' : 'btn-inactive'} text-xs`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Avatar filter */}
      <div className="flex items-center gap-1 bg-surface-700/50 rounded-xl p-1">
        {AVATARS.map(a => (
          <button
            key={a.value}
            onClick={() => onAvatarChange(a.value)}
            className={`btn ${avatar === a.value ? 'btn-active' : 'btn-inactive'} text-xs`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Period filter */}
      <div className="flex items-center gap-1 bg-surface-700/50 rounded-xl p-1">
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => onPeriodChange(p.value)}
            className={`btn ${period === p.value ? 'btn-active' : 'btn-inactive'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Manual sync button */}
      <button
        onClick={onRefresh}
        disabled={syncing}
        className="ml-auto flex items-center gap-2 btn btn-inactive text-xs disabled:opacity-50"
      >
        <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
        {syncing ? 'Syncing...' : 'Sync Now'}
      </button>

      {lastSynced && (
        <span className="text-xs text-slate-600">
          Last sync: {lastSynced}
        </span>
      )}
    </div>
  )
}
