/**
 * Threads API sync
 * Pulls recent Threads posts + metrics for a given avatar.
 *
 * Meta released the Threads API in June 2024.
 * Same Meta app — but requires separate Threads permissions:
 *   threads_basic, threads_manage_insights
 *
 * Get your Threads User ID:
 *   GET https://graph.threads.net/v1.0/me?access_token=YOUR_TOKEN
 */

const THREADS_BASE = 'https://graph.threads.net/v1.0'

const POST_FIELDS = [
  'id', 'text', 'media_type', 'media_url', 'thumbnail_url',
  'permalink', 'timestamp', 'shortcode',
].join(',')

async function fetchJson(url) {
  const res = await fetch(url)
  const data = await res.json()
  if (data.error) throw new Error(`Threads API error: ${JSON.stringify(data.error)}`)
  return data
}

/**
 * Fetch the 25 most recent Threads posts + insights.
 */
export async function syncThreads({ accountId, accessToken, avatarKey }) {
  const records = []

  // ── 1. Profile info ────────────────────────────────────────────────────────
  let accountSnapshot = { platform: 'threads', avatar: avatarKey, follower_count: 0 }

  try {
    const profile = await fetchJson(
      `${THREADS_BASE}/${accountId}?fields=threads_profile_picture_url,threads_biography,followers_count&access_token=${accessToken}`
    )
    accountSnapshot.follower_count = profile.followers_count ?? 0
  } catch (e) {
    console.warn(`Threads profile fetch failed: ${e.message}`)
  }

  // ── 2. Recent threads ──────────────────────────────────────────────────────
  const threadsData = await fetchJson(
    `${THREADS_BASE}/${accountId}/threads?fields=${POST_FIELDS}&limit=25&access_token=${accessToken}`
  )

  const posts = threadsData.data ?? []

  // ── 3. Insights per post ───────────────────────────────────────────────────
  for (const post of posts) {
    let views = 0, likes = 0, replies = 0, reposts = 0, quotes = 0

    try {
      const insightData = await fetchJson(
        `${THREADS_BASE}/${post.id}/insights?metric=views,likes,replies,reposts,quotes&access_token=${accessToken}`
      )
      for (const item of insightData.data ?? []) {
        if (item.name === 'views')   views   = item.values?.[0]?.value ?? item.value ?? 0
        if (item.name === 'likes')   likes   = item.values?.[0]?.value ?? item.value ?? 0
        if (item.name === 'replies') replies = item.values?.[0]?.value ?? item.value ?? 0
        if (item.name === 'reposts') reposts = item.values?.[0]?.value ?? item.value ?? 0
        if (item.name === 'quotes')  quotes  = item.values?.[0]?.value ?? item.value ?? 0
      }
    } catch (e) {
      console.warn(`Threads insights skipped for ${post.id}: ${e.message}`)
    }

    const engagement_rate = views > 0
      ? ((likes + replies + reposts + quotes) / views) * 100
      : 0

    records.push({
      post_id: post.id,
      platform: 'threads',
      avatar: avatarKey,
      title: (post.text ?? '').slice(0, 100),
      caption: post.text ?? '',
      thumbnail_url: post.thumbnail_url ?? post.media_url ?? '',
      post_url: post.permalink ?? '',
      published_at: post.timestamp,
      views,
      likes,
      comments: replies,
      shares: reposts + quotes,
      saves: 0,
      reach: views,
      impressions: views,
      engagement_rate: parseFloat(engagement_rate.toFixed(4)),
      synced_at: new Date().toISOString(),
    })
  }

  return { records, accountSnapshot }
}
