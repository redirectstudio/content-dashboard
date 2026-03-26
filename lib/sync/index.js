/**
 * Main sync orchestrator
 * Runs all platform syncs for all 3 avatars, upserts into Supabase.
 */

import { supabaseAdmin } from '../supabase.js'
import { syncInstagram } from './instagram.js'
import { syncFacebook  } from './facebook.js'
import { syncThreads   } from './threads.js'
import { syncYouTube   } from './youtube.js'
import { syncTikTok    } from './tiktok.js'

// ─────────────────────────────────────────────────────────────
// Account config — reads from environment variables
// ─────────────────────────────────────────────────────────────
const AVATARS = [
  { key: 'avatar_1', label: process.env.NEXT_PUBLIC_AVATAR_1_NAME ?? 'Avatar 1', index: 1 },
  { key: 'avatar_2', label: process.env.NEXT_PUBLIC_AVATAR_2_NAME ?? 'Avatar 2', index: 2 },
  { key: 'avatar_3', label: process.env.NEXT_PUBLIC_AVATAR_3_NAME ?? 'Avatar 3', index: 3 },
]

// ─────────────────────────────────────────────────────────────
// Upsert helpers
// ─────────────────────────────────────────────────────────────
async function upsertPosts(records) {
  if (!records.length) return
  const { error } = await supabaseAdmin
    .from('content_analytics')
    .upsert(records, { onConflict: 'post_id,platform' })
  if (error) throw new Error(`Supabase upsert error: ${error.message}`)
}

async function upsertSnapshot(snapshot) {
  if (!snapshot) return
  const { error } = await supabaseAdmin
    .from('account_snapshots')
    .upsert(snapshot, { onConflict: 'platform,avatar,(snapshotted_at::date)' })
  if (error) console.warn(`Snapshot upsert warning: ${error.message}`)
}

// ─────────────────────────────────────────────────────────────
// Per-platform sync runners
// ─────────────────────────────────────────────────────────────
async function runInstagramSync(avatar) {
  const accountId  = process.env[`INSTAGRAM_ACCOUNT_ID_${avatar.index}`]
  const token      = process.env[`META_LONG_LIVED_TOKEN_${avatar.index}`]
  if (!accountId || !token) {
    console.log(`Instagram: credentials missing for ${avatar.key}, skipping.`)
    return
  }
  const { records, accountSnapshot } = await syncInstagram({
    accountId, accessToken: token, avatarKey: avatar.key,
  })
  await upsertPosts(records)
  await upsertSnapshot(accountSnapshot)
  console.log(`✅ Instagram ${avatar.key}: ${records.length} posts synced`)
}

async function runFacebookSync(avatar) {
  const pageId = process.env[`FACEBOOK_PAGE_ID_${avatar.index}`]
  const token  = process.env[`META_LONG_LIVED_TOKEN_${avatar.index}`]
  if (!pageId || !token) {
    console.log(`Facebook: credentials missing for ${avatar.key}, skipping.`)
    return
  }
  const { records, accountSnapshot } = await syncFacebook({
    pageId, accessToken: token, avatarKey: avatar.key,
  })
  await upsertPosts(records)
  await upsertSnapshot(accountSnapshot)
  console.log(`✅ Facebook ${avatar.key}: ${records.length} posts synced`)
}

async function runThreadsSync(avatar) {
  const accountId = process.env[`THREADS_ACCOUNT_ID_${avatar.index}`]
  const token     = process.env[`META_LONG_LIVED_TOKEN_${avatar.index}`]
  if (!accountId || !token) {
    console.log(`Threads: credentials missing for ${avatar.key}, skipping.`)
    return
  }
  const { records, accountSnapshot } = await syncThreads({
    accountId, accessToken: token, avatarKey: avatar.key,
  })
  await upsertPosts(records)
  await upsertSnapshot(accountSnapshot)
  console.log(`✅ Threads ${avatar.key}: ${records.length} posts synced`)
}

async function runYouTubeSync(avatar) {
  const channelId = process.env[`YOUTUBE_CHANNEL_ID_${avatar.index}`]
  const apiKey    = process.env.YOUTUBE_API_KEY
  if (!channelId || !apiKey) {
    console.log(`YouTube: credentials missing for ${avatar.key}, skipping.`)
    return
  }
  const { records, accountSnapshot } = await syncYouTube({
    channelId, apiKey, avatarKey: avatar.key,
  })
  await upsertPosts(records)
  await upsertSnapshot(accountSnapshot)
  console.log(`✅ YouTube ${avatar.key}: ${records.length} videos synced`)
}

async function runTikTokSync(avatar) {
  const accessToken = process.env[`TIKTOK_ACCESS_TOKEN_${avatar.index}`]
  const openId      = process.env[`TIKTOK_OPEN_ID_${avatar.index}`]
  if (!accessToken || !openId) {
    console.log(`TikTok: credentials missing for ${avatar.key}, skipping.`)
    return
  }
  const { records, accountSnapshot } = await syncTikTok({
    accessToken, openId, avatarKey: avatar.key,
  })
  await upsertPosts(records)
  await upsertSnapshot(accountSnapshot)
  console.log(`✅ TikTok ${avatar.key}: ${records.length} videos synced`)
}

// ─────────────────────────────────────────────────────────────
// Main export — runs everything
// ─────────────────────────────────────────────────────────────
export async function runFullSync() {
  const results = { success: [], errors: [] }
  const startTime = Date.now()

  console.log('🔄 Starting full content sync...')

  const tasks = []
  for (const avatar of AVATARS) {
    tasks.push(
      runInstagramSync(avatar).catch(e => {
        console.error(`❌ Instagram ${avatar.key}: ${e.message}`)
        results.errors.push(`instagram_${avatar.key}: ${e.message}`)
      }),
      runFacebookSync(avatar).catch(e => {
        console.error(`❌ Facebook ${avatar.key}: ${e.message}`)
        results.errors.push(`facebook_${avatar.key}: ${e.message}`)
      }),
      runThreadsSync(avatar).catch(e => {
        console.error(`❌ Threads ${avatar.key}: ${e.message}`)
        results.errors.push(`threads_${avatar.key}: ${e.message}`)
      }),
      runYouTubeSync(avatar).catch(e => {
        console.error(`❌ YouTube ${avatar.key}: ${e.message}`)
        results.errors.push(`youtube_${avatar.key}: ${e.message}`)
      }),
      runTikTokSync(avatar).catch(e => {
        console.error(`❌ TikTok ${avatar.key}: ${e.message}`)
        results.errors.push(`tiktok_${avatar.key}: ${e.message}`)
      }),
    )
  }

  await Promise.allSettled(tasks)

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`✅ Sync complete in ${elapsed}s. Errors: ${results.errors.length}`)

  return {
    synced_at: new Date().toISOString(),
    duration_seconds: parseFloat(elapsed),
    errors: results.errors,
  }
}
