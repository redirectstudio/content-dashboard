'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { SparklineChart } from './SparklineChart'

function formatNumber(n) {
  if (n === undefined || n === null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  if (typeof n === 'number' && !Number.isInteger(n)) return n.toFixed(1)
  return n.toLocaleString()
}

function ChangeIndicator({ change }) {
  if (change === undefined || change === null) return null
  if (change > 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium stat-up">
      <TrendingUp size={11} /> +{change}%
    </span>
  )
  if (change < 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium stat-down">
      <TrendingDown size={11} /> {change}%
    </span>
  )
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium stat-flat">
      <Minus size={11} /> 0%
    </span>
  )
}

export function KPICard({ title, value, change, sparklineData, sparklineKey, icon: Icon, loading }) {
  return (
    <div className="card flex flex-col gap-3 min-h-[120px]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">{title}</span>
        {Icon && <Icon size={14} className="text-slate-600" />}
      </div>

      {loading ? (
        <div className="flex flex-col gap-2 animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-24" />
          <div className="h-3 bg-slate-800 rounded w-12" />
        </div>
      ) : (
        <>
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className="text-2xl font-bold text-slate-50 leading-none mb-1">
                {formatNumber(value)}
              </div>
              <ChangeIndicator change={change} />
            </div>
            {sparklineData && sparklineData.length > 1 && (
              <div className="w-20 h-10 flex-shrink-0">
                <SparklineChart data={sparklineData} dataKey={sparklineKey} positive={change >= 0} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
