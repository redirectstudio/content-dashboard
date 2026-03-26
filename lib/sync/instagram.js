/**
 * Instagram Graph API sync
 * Pulls the 25 most recent posts + account stats for a given avatar.
 *
 * Required permissions on your Meta app:
 *   instagram_basic, instagram_manage_insights,
 *   pages_show_list, pages_read_engagement
 */

const IG_BASE = 'https://graph.facebook.com/v19.0'

// Fields to fetch for each media object
const MEDIA_FIELDS = [
  'id', 'caption', 'media_type', 'media_url', 'thumbnail_url',
  'permalink', 'timestamp', 'like_count', 'comments_count',
].join(',')

// Insight metrics to fetch per post
const INSIGHT_METRICS = 'reach,impressions,saved,video_views,shares'

async function fetchJson(url) {
  const res = await fetch(url)
  const data = await res.json()
  if (data.error) throw new Error(`IG API error: ${JSON.stringify(data.error)}`)
  return data
}

/**
 * Fetch the 25 most recent posts + their insights for one Instagram account.
 * Returns an array of records ready to upsert into content_analytics.
 */
export async function syncInstagram({ accountId, accessToken, avatarKey }) {
  const records = []
  const snapshotRecord = null

  // ── 1. Account info (follower count) ──────────────────────────────────────
  const accountData = await fetchJson(
    `${IG_BASE}/${accountId}?fields=followers_count,media_count&access_token=${accessToken}`
  )

  const accountSnapshot = {
    platform: 'instagram',
    avatar: avatarKey,
    follower_count: accountData.followers_count ?? 0,
    post_count: accountData.media_count ?? 0,
  }

  // ── 2. Recent media ────────────────────────────────────────────────────────
  const mediaData = await fetchJson(
    `${IG_BASE}/${accountId}/media?fields=${MEDIA_FIELDS}&limit=25&access_token=${accessToken}`
  )

  const media = mediaData.data ?? []

  // ── 3. Fetch insights per post ─────────────────────────────────────────────
  for (const post of media) {
    let insights = {}

    try {
      const insightData = await fetchJson(
        `${IG_BASE}/${post.id}/insights?metric=${INSIGHT_METRICS}&access_token=${accessToken}`
      )
      for (const item of insightData.data ?? []) {
        insights[item.name] = item.values?.[0]?.value ?? item.value ?? 0
      }
    } catch (e) {
      // Some post types (e.g. albums) may not support all metrics — skip gracefully
      console.warn(`IG insights skipped for ${post.id}: ${e.message}`)
    }

    const views = insights.video_views ?? 0
    const reach = insights.reach ?? 0
    const impressions = insights.impressions ?? 0
    const saves = insights.saved ?? 0
    const shares = insights.shares ?? 0
    const likes = post.like_count ?? 0
    const comments = post.comments_count ?? 0

    // Engagement rate = (likes + comments + shares + saves) / reach * 100
    const engagement_rate = reach > 0
      ? ((likes + comments + shares + saves) / reach) * 100
      : 0

    records.push({
      post_id: post.id,
      platform: 'instagram',
      avatar: avatarKey,
      title: post.caption?.slice(0, 100) ?? '',
      caption: post.caption ?? '',
      thumbnail_url: post.thumbnail_url ?? post.media_url ?? '',
      post_url: post.permalink ?? '',
      published_at: post.timestamp,
      views,
      likes,
      comments,
      shares,
      saves,
      reach,
      impressions,
      engagement_rate: parseFloat(engagement_rate.toFixed(4)),
      synced_at: new Date().toISOString(),
    })
  }

  return { records, accountSnapshot }
}
