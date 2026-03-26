'use client'

import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts'

export function SparklineChart({ data, dataKey, positive }) {
  const color = positive ? '#10b981' : '#ef4444'

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <defs>
          <linearGradient id={`sparkGrad-${dataKey}-${positive}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11 }}
          itemStyle={{ color: '#94a3b8' }}
          labelFormatter={() => ''}
          formatter={(v) => [v?.toLocaleString(), '']}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#sparkGrad-${dataKey}-${positive})`}
          dot={false}
          activeDot={{ r: 2, fill: color }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
