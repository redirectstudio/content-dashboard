/**
 * POST /api/sync
 * Triggered by Vercel cron (every 6 hours) OR manually.
 * Protected by CRON_SECRET header.
 */

import { NextResponse } from 'next/server'
import { runFullSync  } from '../../../lib/sync/index.js'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 min timeout for full sync

export async function GET(request) {
  return handler(request)
}

export async function POST(request) {
  return handler(request)
}

async function handler(request) {
  // Verify secret (skip check in dev)
  if (process.env.NODE_ENV === 'production') {
    const secret = request.headers.get('authorization')?.replace('Bearer ', '')
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const result = await runFullSync()
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('Sync failed:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
