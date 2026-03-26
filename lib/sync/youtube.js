/**
 * YouTube Data API v3 sync
 * Pulls the 25 most recent videos + stats for a given channel.
 *
 * Uses API key (no OAuth needed for public channel data).
 * Get your API key: console.cloud.google.com
 *   → Enable "YouTube Data API v3"
 *   → Credentials → Create API Key
 */

const YT_BASE = 'https://www.googleapis.com/youtube/v3'

async function fetchJson(url) {
  const res = await fetch(url)
  const data = await res.json()
  if (data.error) throw new Error(`YouTube API error: ${JSON.stringify(data.error)}`)
  return data
}

/**
 * Fetch the 25 most recent videos + their stats for one YouTube channel.
 */
export async function syncYouTube({ channelId, apiKey, avatarKey }) {
  const records = []

  // ── 1. Channel info ────────────────────────────────────────────────────────
  const channelData = await fetchJson(
    `${YT_BASE}/channels?part=statistics,snippet&id=${channelId}&key=${apiKey}`
  )

  const channelStats = channelData.items?.[0]?.statistics ?? {}
  const accountSnapshot = {
    platform: 'youtube',
    avatar: avatarKey,
    follower_count: parseInt(channelStats.subscriberCount ?? 0),
    post_count: parseInt(channelStats.videoCount ?? 0),
  }

  // ── 2. Get uploads playlist ID ─────────────────────────────────────────────
  const uploadsPlaylistId =
    channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads

  // If no uploads playlist, fetch via search instead
  let videoIds = []

  if (uploadsPlaylistId) {
    const playlistData = await fetchJson(
      `${YT_BASE}/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=25&key=${apiKey}`
    )
    videoIds = (playlistData.items ?? []).map(item => item.contentDetails.videoId)
  } else {
    // Fallback: search for videos by channel
    const searchData = await fetchJson(
      `${YT_BASE}/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=25&key=${apiKey}`
    )
    videoIds = (searchData.items ?? []).map(item => item.id.videoId)
  }

  if (videoIds.length === 0) return { records, accountSnapshot }

  // ── 3. Video stats in bulk (up to 50 IDs per request) ─────────────────────
  const statsData = await fetchJson(
    `${YT_BASE}/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(',')}&key=${apiKey}`
  )

  for (const video of statsData.items ?? []) {
    const stats = video.statistics ?? {}
    const snippet = video.snippet ?? {}

    const views      = parseInt(stats.viewCount    ?? 0)
    const likes      = parseInt(stats.likeCount    ?? 0)
    const comments   = parseInt(stats.commentCount ?? 0)
    const engagement_rate = views > 0
      ? ((likes + comments) / views) * 100
      : 0

    // Thumbnail — use maxres if available, else high
    const thumbs = snippet.thumbnails ?? {}
    const thumbnail_url =
      thumbs.maxres?.url ?? thumbs.high?.url ?? thumbs.default?.url ?? ''

    records.push({
      post_id: video.id,
      platform: 'youtube',
      avatar: avatarKey,
      title: snippet.title ?? '',
      caption: snippet.description?.slice(0, 500) ?? '',
      thumbnail_url,
      post_url: `https://www.youtube.com/watch?v=${video.id}`,
      published_at: snippet.publishedAt,
      views,
      likes,
      comments,
      shares: 0,    // YouTube API doesn't expose share count
      saves: 0,     // Not available via public API
      reach: views, // YouTube reach ≈ views for public videos
      impressions: views,
      watch_time_mins: 0, // Requires YouTube Analytics API (OAuth) — add later
      engagement_rate: parseFloat(engagement_rate.toFixed(4)),
      synced_at: new Date().toISOString(),
    })
  }

  return { records, accountSnapshot }
}
