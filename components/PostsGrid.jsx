'use client'

import Image from 'next/image'
import { ExternalLink, ArrowUpDown } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { PlatformBadge } from './PlatformBadge'

const AVATAR_COLORS = {
  avatar_1: 'text-indigo-400',
  avatar_2: 'text-emerald-400',
  avatar_3: 'text-amber-400',
}

function formatNum(n) {
  if (!n) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function formatDate(dateStr) {
  try { return format(parseISO(dateStr), 'MMM d, yy') } catch { return '—' }
}

const SORT_OPTIONS = [
  { value: 'views',           label: 'Views' },
  { value: 'likes',           label: 'Likes' },
  { value: 'shares',          label: 'Shares' },
  { value: 'saves',           label: 'Saves' },
  { value: 'engagement_rate', label: 'Engagement Rate' },
  { value: 'reach',           label: 'Reach' },
]

export function PostsGrid({ posts, loading, sortBy, onSortChange, avatarNames }) {
  if (loading) return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 bg-slate-700 rounded w-44 animate-pulse" />
        <div className="h-8 bg-slate-700 rounded w-36 animate-pulse" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3 border-t border-slate-700/50 animate-pulse">
          <div className="w-14 h-14 bg-slate-700 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-700 rounded w-3/4" />
            <div className="h-3 bg-slate-800 rounded w-1/3" />
          </div>
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="text-right space-y-1">
                <div className="h-4 bg-slate-700 rounded w-12" />
                <div className="h-3 bg-slate-800 rounded w-8" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  const getAvatarName = (key) => avatarNames?.[key] ?? key?.replace('_', ' ')

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-300">Top Performing Posts</h3>
        <div className="flex items-center gap-2">
          <ArrowUpDown size={12} className="text-slate-500" />
          <select
            value={sortBy}
            onChange={e => onSortChange(e.target.value)}
            className="bg-surface-700 border border-slate-600/50 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {(!posts || posts.length === 0) && (
        <div className="py-12 text-center text-slate-600 text-sm">
          No posts found for this filter combination.
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-700/50">
              <th className="text-left pb-3 font-medium">Post</th>
              <th className="text-right pb-3 font-medium">Views</th>
              <th className="text-right pb-3 font-medium">Likes</th>
              <th className="text-right pb-3 font-medium">Shares</th>
              <th className="text-right pb-3 font-medium">Saves</th>
              <th className="text-right pb-3 font-medium">Eng %</th>
            </tr>
          </thead>
          <tbody>
            {(posts ?? []).map((post, i) => (
              <tr key={`${post.post_id}-${i}`} className="border-b border-slate-700/30 hover:bg-surface-700/30 transition-colors">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    {/* Thumbnail */}
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-700/50 flex-shrink-0">
                      {post.thumbnail_url ? (
                        <Image
                          src={post.thumbnail_url}
                          alt={post.title ?? ''}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                          No img
                        </div>
                      )}
                    </div>
                    {/* Meta */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <PlatformBadge platform={post.platform} />
                        <span className={`text-xs font-medium ${AVATAR_COLORS[post.avatar] ?? 'text-slate-400'}`}>
                          {getAvatarName(post.avatar)}
                        </span>
                      </div>
                      <p className="text-slate-200 text-sm font-medium leading-snug truncate max-w-[260px]">
                        {post.title || post.caption?.slice(0, 60) || 'Untitled'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-slate-500 text-xs">{formatDate(post.published_at)}</span>
                        {post.post_url && (
                          <a href={post.post_url} target="_blank" rel="noopener noreferrer"
                            className="text-slate-600 hover:text-indigo-400 transition-colors">
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 text-right text-slate-200 font-mono text-sm">{formatNum(post.views)}</td>
                <td className="py-3 text-right text-slate-200 font-mono text-sm">{formatNum(post.likes)}</td>
                <td className="py-3 text-right text-slate-200 font-mono text-sm">{formatNum(post.shares)}</td>
                <td className="py-3 text-right text-slate-200 font-mono text-sm">{formatNum(post.saves)}</td>
                <td className="py-3 text-right">
                  <span className={`font-mono text-sm ${post.engagement_rate >= 5 ? 'text-emerald-400' : post.engagement_rate >= 2 ? 'text-amber-400' : 'text-slate-400'}`}>
                    {post.engagement_rate?.toFixed(1) ?? '0.0'}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
