'use client'

import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'

function formatYAxis(v) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`
  return v
}

function formatDate(dateStr) {
  try { return format(parseISO(dateStr), 'MMM d') } catch { return dateStr }
}

const tooltipStyle = {
  contentStyle: {
    background: '#1e293b',
    border: '1px solid rgba(100,116,139,0.3)',
    borderRadius: 10,
    padding: '8px 14px',
    fontSize: 12,
  },
  itemStyle: { color: '#94a3b8', fontWeight: 500 },
  labelStyle: { color: '#f1f5f9', fontWeight: 600, marginBottom: 4 },
}

export function ViewsReachChart({ data, loading }) {
  if (loading) return (
    <div className="card">
      <div className="h-5 bg-slate-700 rounded w-32 mb-4 animate-pulse" />
      <div className="h-52 bg-slate-800/50 rounded-lg animate-pulse" />
    </div>
  )

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-slate-300 mb-4">Views &amp; Reach</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradReach" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#14b8a6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.12)" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            {...tooltipStyle}
            labelFormatter={formatDate}
            formatter={(v, name) => [v?.toLocaleString(), name]}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }} />
          <Area type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={2}
            fill="url(#gradViews)" dot={false} activeDot={{ r: 3 }} name="Views" />
          <Area type="monotone" dataKey="reach" stroke="#14b8a6" strokeWidth={2}
            fill="url(#gradReach)" dot={false} activeDot={{ r: 3 }} name="Reach" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function EngagementChart({ data, loading }) {
  if (loading) return (
    <div className="card">
      <div className="h-5 bg-slate-700 rounded w-40 mb-4 animate-pulse" />
      <div className="h-52 bg-slate-800/50 rounded-lg animate-pulse" />
    </div>
  )

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-slate-300 mb-4">Engagement Breakdown</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.12)" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            {...tooltipStyle}
            labelFormatter={formatDate}
            formatter={(v, name) => [v?.toLocaleString(), name]}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }} />
          <Bar dataKey="likes"    fill="#ec4899" name="Likes"    radius={[3,3,0,0]} maxBarSize={16} />
          <Bar dataKey="comments" fill="#6366f1" name="Comments" radius={[3,3,0,0]} maxBarSize={16} />
          <Bar dataKey="shares"   fill="#f59e0b" name="Shares"   radius={[3,3,0,0]} maxBarSize={16} />
          <Bar dataKey="saves"    fill="#10b981" name="Saves"    radius={[3,3,0,0]} maxBarSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
