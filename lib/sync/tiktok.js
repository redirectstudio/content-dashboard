/**
 * TikTok Business API sync
 *
 * ⚠️  STATUS: REQUIRES DEVELOPER APP APPROVAL
 *
 * TikTok requires you to apply for developer access before you can
 * pull analytics on your own posts. Here's how to get approved:
 *
 * 1. Go to: developers.tiktok.com
 * 2. Create a developer account
 * 3. Create an app → select "Content Posting API" + "Research API"
 * 4. Submit for review (can take 1–5 business days)
 * 5. Once approved, go through OAuth to get your access token
 * 6. Add TIKTOK_ACCESS_TOKEN_1/2/3 and TIKTOK_OPEN_ID_1/2/3 to .env
 *
 * The infrastructure below is ready to go — just plug in your tokens.
 */

const TIKTOK_BASE = 'https://open.tiktokapis.com/v2'

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  const data = await res.json()
  if (data.error?.code && data.error.code !== 'ok') {
    throw new Error(`TikTok API error: ${JSON.stringify(data.error)}`)
  }
  return data
}

/**
 * Fetch the 20 most recent TikTok videos + stats.
 */
export async function syncTikTok({ accessToken, openId, avatarKey }) {
  if (!accessToken || !openId) {
    console.log(`TikTok credentials not set for ${avatarKey} — skipping.`)
    return { records: [], accountSnapshot: null }
  }

  const records = []

  // ── 1. User info ───────────────────────────────────────────────────────────
  let accountSnapshot = { platform: 'tiktok', avatar: avatarKey, follower_count: 0 }

  try {
    const userRes = await fetchJson(
      `${TIKTOK_BASE}/user/info/?fields=follower_count,following_count,video_count`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const info = userRes.data?.user ?? {}
    accountSnapshot.follower_count  = info.follower_count ?? 0
    accountSnapshot.following_count = info.following_count ?? 0
    accountSnapshot.post_count      = info.video_count ?? 0
  } catch (e) {
    console.warn(`TikTok user info failed for ${avatarKey}: ${e.message}`)
  }

  // ── 2. Recent videos ───────────────────────────────────────────────────────
  const videoRes = await fetchJson(
    `${TIKTOK_BASE}/video/list/?fields=id,title,cover_image_url,embed_link,create_time,like_count,comment_count,share_count,view_count,duration`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ max_count: 20 }),
    }
  )

  const videos = videoRes.data?.videos ?? []

  for (const video of videos) {
    const views    = video.view_count    ?? 0
    const likes    = video.like_count    ?? 0
    const comments = video.comment_count ?? 0
    const shares   = video.share_count   ?? 0

    const engagement_rate = views > 0
      ? ((likes + comments + shares) / views) * 100
      : 0

    records.push({
      post_id: video.id,
      platform: 'tiktok',
      avatar: avatarKey,
      title: video.title ?? '',
      caption: video.title ?? '',
      thumbnail_url: video.cover_image_url ?? '',
      post_url: video.embed_link ?? '',
      published_at: new Date(video.create_time * 1000).toISOString(),
      views,
      likes,
      comments,
      shares,
      saves: 0, // Not available via TikTok API
      reach: views,
      impressions: views,
      engagement_rate: parseFloat(engagement_rate.toFixed(4)),
      synced_at: new Date().toISOString(),
    })
  }

  return { records, accountSnapshot }
}
