'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import {
  Eye, Users, TrendingUp, Heart, Share2, Bookmark,
  BarChart2, Activity,
} from 'lucide-react'

import { FilterBar }        from '../components/FilterBar'
import { KPICard }          from '../components/KPICard'
import { ViewsReachChart, EngagementChart } from '../components/Charts'
import { PostsGrid }        from '../components/PostsGrid'

// ─────────────────────────────────────────────────────────────
// Config: avatar display names from env
// ─────────────────────────────────────────────────────────────
const AVATAR_NAMES = {
  avatar_1: process.env.NEXT_PUBLIC_AVATAR_1_NAME ?? 'Avatar 1',
  avatar_2: process.env.NEXT_PUBLIC_AVATAR_2_NAME ?? 'Avatar 2',
  avatar_3: process.env.NEXT_PUBLIC_AVATAR_3_NAME ?? 'Avatar 3',
}

// ─────────────────────────────────────────────────────────────
// Fetch helpers
// ─────────────────────────────────────────────────────────────
async function fetchAnalytics(type, params) {
  const qs = new URLSearchParams({ type, ...params }).toString()
  const res = await fetch(`/api/analytics?${qs}`)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error)
  return json.data
}

// ─────────────────────────────────────────────────────────────
// KPI card definitions
// ─────────────────────────────────────────────────────────────
const KPI_DEFS = [
  { key: 'views',           title: 'Views',           icon: Eye,        sparkKey: 'views' },
  { key: 'reach',           title: 'Reach',           icon: Users,      sparkKey: 'reach' },
  { key: 'engagement_rate', title: 'Engagement Rate', icon: Activity,   sparkKey: null,    suffix: '%' },
  { key: 'followers',       title: 'Followers',       icon: Users,      sparkKey: null },
  { key: 'shares',          title: 'Shares',          icon: Share2,     sparkKey: 'shares' },
  { key: 'saves',           title: 'Saves',           icon: Bookmark,   sparkKey: 'saves' },
]

// ─────────────────────────────────────────────────────────────
// Platform platform breakdown mini-component
// ─────────────────────────────────────────────────────────────
const PLATFORM_COLORS = {
  instagram: '#ec4899',
  facebook:  '#3b82f6',
  threads:   '#94a3b8',
  youtube:   '#ef4444',
  tiktok:    '#22d3ee',
}

// ─────────────────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [platform,  setPlatform]  = useState('all')
  const [avatar,    setAvatar]    = useState('all')
  const [period,    setPeriod]    = useState('30d')
  const [sortBy,    setSortBy]    = useState('views')
  const [syncing,   setSyncing]   = useState(false)
  const [lastSynced, setLastSynced] = useState(null)

  const [kpis,       setKpis]       = useState(null)
  const [timeSeries, setTimeSeries] = useState([])
  const [topPosts,   setTopPosts]   = useState([])
  const [followers,  setFollowers]  = useState(null)

  const [loadingKpis,   setLoadingKpis]   = useState(true)
  const [loadingCharts, setLoadingCharts] = useState(true)
  const [loadingPosts,  setLoadingPosts]  = useState(true)

  const params = { platform, avatar, period }

  // ── Fetch KPIs ────────────────────────────────────────────────────────────
  const loadKpis = useCallback(async () => {
    setLoadingKpis(true)
    try {
      const [kpiData, followerData] = await Promise.all([
        fetchAnalytics('kpis',      params),
        fetchAnalytics('followers', params),
      ])
      setKpis(kpiData)
      setFollowers(followerData)
    } catch (e) {
      console.error('KPI fetch error:', e)
    } finally {
      setLoadingKpis(false)
    }
  }, [platform, avatar, period])

  // ── Fetch charts ──────────────────────────────────────────────────────────
  const loadCharts = useCallback(async () => {
    setLoadingCharts(true)
    try {
      const data = await fetchAnalytics('timeseries', params)
      setTimeSeries(data)
    } catch (e) {
      console.error('Charts fetch error:', e)
    } finally {
      setLoadingCharts(false)
    }
  }, [platform, avatar, period])

  // ── Fetch posts ───────────────────────────────────────────────────────────
  const loadPosts = useCallback(async () => {
    setLoadingPosts(true)
    try {
      const data = await fetchAnalytics('topposts', { ...params, sortBy })
      setTopPosts(data)
    } catch (e) {
      console.error('Posts fetch error:', e)
    } finally {
      setLoadingPosts(false)
    }
  }, [platform, avatar, period, sortBy])

  // ── Trigger on filter change ──────────────────────────────────────────────
  useEffect(() => { loadKpis()   }, [loadKpis])
  useEffect(() => { loadCharts() }, [loadCharts])
  useEffect(() => { loadPosts()  }, [loadPosts])

  // ── Manual sync ───────────────────────────────────────────────────────────
  const handleSync = async () => {
    setSyncing(true)
    try {
      await fetch('/api/sync', { method: 'POST' })
      setLastSynced(format(new Date(), 'MMM d, h:mm a'))
      await Promise.all([loadKpis(), loadCharts(), loadPosts()])
    } catch (e) {
      console.error('Sync failed:', e)
    } finally {
      setSyncing(false)
    }
  }

  // ── Build KPI card values ─────────────────────────────────────────────────
  function getKpiValue(key) {
    if (key === 'followers') return followers?.total
    return kpis?.[key]?.value
  }

  function getKpiChange(key) {
    if (key === 'followers') return null
    return kpis?.[key]?.change
  }

  // ── Total engagement across period ───────────────────────────────────────
  const totalEngagements = timeSeries.reduce(
    (s, d) => s + (d.likes ?? 0) + (d.comments ?? 0) + (d.shares ?? 0) + (d.saves ?? 0), 0
  )

  return (
    <div className="min-h-screen bg-surface-900">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-700/50 px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-50 tracking-tight">
              Content Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time analytics · All avatars · All platforms
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-400">Live</span>
            </div>
            <span className="text-xs text-slate-600">Syncs every 6h via Vercel Cron</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <FilterBar
          platform={platform}    onPlatformChange={setPlatform}
          avatar={avatar}        onAvatarChange={setAvatar}
          period={period}        onPeriodChange={setPeriod}
          onRefresh={handleSync} syncing={syncing}
          avatarNames={AVATAR_NAMES}
          lastSynced={lastSynced}
        />

        {/* ── KPI Cards ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {KPI_DEFS.map(kpi => (
            <KPICard
              key={kpi.key}
              title={kpi.title}
              value={getKpiValue(kpi.key)}
              change={getKpiChange(kpi.key)}
              icon={kpi.icon}
              loading={loadingKpis}
              sparklineData={kpi.sparkKey ? timeSeries : undefined}
              sparklineKey={kpi.sparkKey ?? undefined}
            />
          ))}
        </div>

        {/* ── Charts ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ViewsReachChart  data={timeSeries} loading={loadingCharts} />
          <EngagementChart  data={timeSeries} loading={loadingCharts} />
        </div>

        {/* ── Platform breakdown bar ───────────────────────────────────────── */}
        {!loadingKpis && timeSeries.length > 0 && (
          <div className="card">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Total engagements this period — {totalEngagements.toLocaleString()}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Likes',    value: kpis?.likes?.value,    color: 'bg-pink-500' },
                { label: 'Comments', value: kpis?.comments?.value, color: 'bg-indigo-500' },
                { label: 'Shares',   value: kpis?.shares?.value,   color: 'bg-amber-500' },
                { label: 'Saves',    value: kpis?.saves?.value,    color: 'bg-emerald-500' },
              ].map(item => {
                const pct = totalEngagements > 0 ? ((item.value ?? 0) / totalEngagements) * 100 : 0
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400">{item.label}</span>
                      <span className="text-slate-200 font-medium">
                        {(item.value ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-700`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <div className="text-right text-xs text-slate-600 mt-1">{pct.toFixed(1)}%</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Top Posts Grid ───────────────────────────────────────────────── */}
        <PostsGrid
          posts={topPosts}
          loading={loadingPosts}
          sortBy={sortBy}
          onSortChange={setSortBy}
          avatarNames={AVATAR_NAMES}
        />

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <footer className="text-center text-xs text-slate-700 pb-4">
          Redirect Studio — Content Dashboard · Data refreshes every 6 hours
        </footer>

      </main>
    </div>
  )
}
