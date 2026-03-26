/**
 * Facebook Graph API sync
 * Pulls recent Page posts + metrics for a given avatar's Facebook Page.
 *
 * Same Meta app as Instagram — reuses the long-lived token.
 * Required permissions: pages_show_list, pages_read_engagement,
 *                       read_insights
 */

const FB_BASE = 'https://graph.facebook.com/v19.0'

const POST_FIELDS = [
  'id', 'message', 'story', 'full_picture', 'permalink_url',
  'created_time', 'attachments{media}',
].join(',')

async function fetchJson(url) {
  const res = await fetch(url)
  const data = await res.json()
  if (data.error) throw new Error(`FB API error: ${JSON.stringify(data.error)}`)
  return data
}

/**
 * Fetch the 25 most recent Page posts + their insights.
 */
export async function syncFacebook({ pageId, accessToken, avatarKey }) {
  const records = []

  // ── 1. Page info (follower count) ─────────────────────────────────────────
  const pageData = await fetchJson(
    `${FB_BASE}/${pageId}?fields=fan_count,followers_count,posts_count&access_token=${accessToken}`
  )

  const accountSnapshot = {
    platform: 'facebook',
    avatar: avatarKey,
    follower_count: pageData.followers_count ?? pageData.fan_count ?? 0,
  }

  // ── 2. Recent posts ────────────────────────────────────────────────────────
  const postsData = await fetchJson(
    `${FB_BASE}/${pageId}/posts?fields=${POST_FIELDS}&limit=25&access_token=${accessToken}`
  )

  const posts = postsData.data ?? []

  // ── 3. Insights per post ───────────────────────────────────────────────────
  for (const post of posts) {
    let insights = {
      post_impressions: 0,
      post_reach: 0,
      post_reactions_like_total: 0,
      post_clicks: 0,
    }

    try {
      const insightData = await fetchJson(
        `${FB_BASE}/${post.id}/insights?metric=post_impressions,post_reach,post_reactions_like_total,post_clicks&access_token=${accessToken}`
      )
      for (const item of insightData.data ?? []) {
        insights[item.name] = item.values?.[0]?.value ?? 0
      }
    } catch (e) {
      console.warn(`FB insights skipped for ${post.id}: ${e.message}`)
    }

    // FB doesn't expose saves/shares per post easily via basic permissions
    // likes come from reactions, comments via separate call (skipped for perf)
    const reach = insights.post_reach ?? 0
    const impressions = insights.post_impressions ?? 0
    const likes = insights.post_reactions_like_total ?? 0
    const views = impressions // FB uses impressions as primary view metric

    const engagement_rate = reach > 0 ? (likes / reach) * 100 : 0

    const thumbnail =
      post.attachments?.data?.[0]?.media?.image?.src ??
      post.full_picture ?? ''

    records.push({
      post_id: post.id,
      platform: 'facebook',
      avatar: avatarKey,
      title: (post.message ?? post.story ?? '').slice(0, 100),
      caption: post.message ?? post.story ?? '',
      thumbnail_url: thumbnail,
      post_url: post.permalink_url ?? '',
      published_at: post.created_time,
      views,
      likes,
      comments: 0, // requires separate API call — add later if needed
      shares: 0,
      saves: 0,
      reach,
      impressions,
      engagement_rate: parseFloat(engagement_rate.toFixed(4)),
      synced_at: new Date().toISOString(),
    })
  }

  return { records, accountSnapshot }
}
