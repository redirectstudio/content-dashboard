/**
 * Analytics query helpers
 * All the queries the dashboard frontend uses — called via API routes.
 */

import { supabase } from './supabase.js'
import { subDays, startOfDay, formatISO } from 'date-fns'

/**
 * Build date range for a given period string ('7d' | '14d' | '30d' | '90d')
 */
export function getDateRange(period = '30d') {
  const days = parseInt(period)
  const now = new Date()
  const current_start = startOfDay(subDays(now, days))
  const previous_start = startOfDay(subDays(now, days * 2))
  return {
    current_start: formatISO(current_start),
    previous_start: formatISO(previous_start),
    current_end: formatISO(now),
    previous_end: formatISO(current_start),
  }
}

/**
 * Build Supabase query filters (platform + avatar)
 */
function applyFilters(query, { platform, avatar }) {
  if (platform && platform !== 'all') query = query.eq('platform', platform)
  if (avatar   && avatar   !== 'all') query = query.eq('avatar', avatar)
  return query
}

// ─────────────────────────────────────────────────────────────
// KPI Totals — returns aggregated sums for current & prev period
// ─────────────────────────────────────────────────────────────
export async function getKpiTotals({ platform, avatar, period }) {
  const { current_start, previous_start, current_end, previous_end } = getDateRange(period)

  async function getPeriodTotals(from, to) {
    let query = supabase
      .from('content_analytics')
      .select('views, likes, comments, shares, saves, reach, engagement_rate')
      .gte('published_at', from)
      .lte('published_at', to)

    query = applyFilters(query, { platform, avatar })
    const { data, error } = await query
    if (error) throw new Error(error.message)

    const totals = (data ?? []).reduce(
      (acc, row) => ({
        views:            acc.views            + (row.views   ?? 0),
        reach:            acc.reach            + (row.reach   ?? 0),
        likes:            acc.likes            + (row.likes   ?? 0),
        comments:         acc.comments         + (row.comments ?? 0),
        shares:           acc.shares           + (row.shares  ?? 0),
        saves:            acc.saves            + (row.saves   ?? 0),
        engagement_sum:   acc.engagement_sum   + (row.engagement_rate ?? 0),
        count:            acc.count            + 1,
      }),
      { views: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, engagement_sum: 0, count: 0 }
    )
    totals.engagement_rate = totals.count > 0
      ? parseFloat((totals.engagement_sum / totals.count).toFixed(2))
      : 0
    return totals
  }

  const [current, previous] = await Promise.all([
    getPeriodTotals(current_start, current_end),
    getPeriodTotals(previous_start, previous_end),
  ])

  function pctChange(cur, prev) {
    if (prev === 0) return cur > 0 ? 100 : 0
    return parseFloat((((cur - prev) / prev) * 100).toFixed(1))
  }

  return {
    views:           { value: current.views,           change: pctChange(current.views,           previous.views) },
    reach:           { value: current.reach,           change: pctChange(current.reach,           previous.reach) },
    likes:           { value: current.likes,           change: pctChange(current.likes,           previous.likes) },
    comments:        { value: current.comments,        change: pctChange(current.comments,        previous.comments) },
    shares:          { value: current.shares,          change: pctChange(current.shares,          previous.shares) },
    saves:           { value: current.saves,           change: pctChange(current.saves,           previous.saves) },
    engagement_rate: { value: current.engagement_rate, change: pctChange(current.engagement_rate, previous.engagement_rate) },
  }
}

// ─────────────────────────────────────────────────────────────
// Time series — daily aggregates for charts
// ─────────────────────────────────────────────────────────────
export async function getTimeSeries({ platform, avatar, period }) {
  const { current_start, current_end } = getDateRange(period)

  let query = supabase
    .from('content_analytics')
    .select('published_at, views, reach, likes, comments, shares, saves')
    .gte('published_at', current_start)
    .lte('published_at', current_end)
    .order('published_at', { ascending: true })

  query = applyFilters(query, { platform, avatar })

  const { data, error } = await query
  if (error) throw new Error(error.message)

  // Group by date
  const byDate = {}
  for (const row of data ?? []) {
    const date = row.published_at?.slice(0, 10)
    if (!date) continue
    if (!byDate[date]) {
      byDate[date] = { date, views: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0 }
    }
    byDate[date].views    += row.views    ?? 0
    byDate[date].reach    += row.reach    ?? 0
    byDate[date].likes    += row.likes    ?? 0
    byDate[date].comments += row.comments ?? 0
    byDate[date].shares   += row.shares   ?? 0
    byDate[date].saves    += row.saves    ?? 0
  }

  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))
}

// ─────────────────────────────────────────────────────────────
// Top posts — sorted by a given metric
// ─────────────────────────────────────────────────────────────
export async function getTopPosts({ platform, avatar, period, sortBy = 'views', limit = 20 }) {
  const { current_start, current_end } = getDateRange(period)

  const validSortColumns = ['views', 'likes', 'shares', 'saves', 'engagement_rate', 'reach', 'comments']
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'views'

  let query = supabase
    .from('content_analytics')
    .select('post_id, platform, avatar, title, caption, thumbnail_url, post_url, published_at, views, likes, comments, shares, saves, reach, engagement_rate')
    .gte('published_at', current_start)
    .lte('published_at', current_end)
    .order(sortColumn, { ascending: false })
    .limit(limit)

  query = applyFilters(query, { platform, avatar })

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return data ?? []
}

// ─────────────────────────────────────────────────────────────
// Follower counts — latest snapshot per account
// ─────────────────────────────────────────────────────────────
export async function getFollowerCounts({ platform, avatar }) {
  let query = supabase
    .from('account_snapshots')
    .select('platform, avatar, follower_count, snapshotted_at')
    .order('snapshotted_at', { ascending: false })

  if (platform && platform !== 'all') query = query.eq('platform', platform)
  if (avatar   && avatar   !== 'all') query = query.eq('avatar',   avatar)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  // Return latest snapshot per platform+avatar combo
  const seen = new Set()
  const latest = []
  for (const row of data ?? []) {
    const key = `${row.platform}_${row.avatar}`
    if (!seen.has(key)) {
      seen.add(key)
      latest.push(row)
    }
  }

  const total = latest.reduce((sum, row) => sum + (row.follower_count ?? 0), 0)
  return { total, breakdown: latest }
}
