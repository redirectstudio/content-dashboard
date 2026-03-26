/**
 * GET /api/analytics?type=kpis&platform=all&avatar=all&period=30d&sortBy=views
 * Returns analytics data for the dashboard frontend.
 */

import { NextResponse }       from 'next/server'
import { getKpiTotals }       from '../../../lib/analytics.js'
import { getTimeSeries }      from '../../../lib/analytics.js'
import { getTopPosts }        from '../../../lib/analytics.js'
import { getFollowerCounts }  from '../../../lib/analytics.js'

export const runtime = 'nodejs'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const type     = searchParams.get('type')     ?? 'kpis'
  const platform = searchParams.get('platform') ?? 'all'
  const avatar   = searchParams.get('avatar')   ?? 'all'
  const period   = searchParams.get('period')   ?? '30d'
  const sortBy   = searchParams.get('sortBy')   ?? 'views'

  try {
    let data

    switch (type) {
      case 'kpis':
        data = await getKpiTotals({ platform, avatar, period })
        break
      case 'timeseries':
        data = await getTimeSeries({ platform, avatar, period })
        break
      case 'topposts':
        data = await getTopPosts({ platform, avatar, period, sortBy })
        break
      case 'followers':
        data = await getFollowerCounts({ platform, avatar })
        break
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
