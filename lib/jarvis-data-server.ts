import Database from 'better-sqlite3'
import fs from 'fs'

const DB_PATH = '/home/openclaw/data/jarvis-cache.db'
const STALE_HOURS = 25
const STALE_HOURS_MTD = 1
const VPS_BASE = 'https://api.desertrecoverycenters.com'

interface CacheResult {
  value: any
  src: string
  label: string
}

interface SourceDef {
  source: string
  endpoint: string
  label: string
}

const SQLITE_SOURCES: Record<string, SourceDef> = {
  adsPerf:         { source: 'GOOGLE_ADS', endpoint: 'performance_7', label: 'GoogleAds7d' },
  adsPerf30:       { source: 'GOOGLE_ADS', endpoint: 'performance',   label: 'GoogleAds30d' },
  adsPerfMtd:      { source: 'GOOGLE_ADS', endpoint: 'performance_mtd', label: 'GoogleAdsMTD' },
  ctmQuality:      { source: 'ctm',        endpoint: 'quality-30d',   label: 'CTM' },
  campaignQuality: { source: 'ctm',        endpoint: 'campaign-quality-30d', label: 'CampaignQuality' },
  campaignHistory: { source: 'GOOGLE_ADS', endpoint: 'campaign_history', label: 'CampaignHistory' },
  hubspot:         { source: 'HUBSPOT',    endpoint: 'pipeline',      label: 'HubSpot' },
  kipu:            { source: 'KIPU',       endpoint: 'census',        label: 'Kipu' },
  qualifiedLeadsDeep: { source: 'ctm',  endpoint: 'qualified-leads-deep-30d', label: 'QualifiedLeadsDeep' },
  ctmSummary:      { source: 'CTM',        endpoint: 'summary',       label: 'CTMSummary' },
  budgetCaps:      { source: 'GOOGLE_ADS', endpoint: 'budget_caps',   label: 'BudgetCaps' },
}

const API_ENDPOINTS: Record<string, string> = {
  adsPerf:         '/api/google-ads/performance?days=7',
  adsPerf30:       '/api/google-ads/performance?days=30',
  adsPerfMtd:      '/api/google-ads/performance?range=mtd',
  ctmQuality:      '/api/ctm/quality-report?days=30',
  campaignQuality: '/api/ctm/campaign-quality?days=30',
  campaignHistory: '/api/google-ads/campaign-history',
  hubspot:         '/api/hubspot/pipeline',
  kipu:            '/api/kipu/census',
  qualifiedLeadsDeep: '/api/ctm/qualified-leads-deep?days=30',
  ctmSummary:      '/api/ctm/summary',
  budgetCaps:      '/api/google-ads/budget-caps',
}

let _token: string | null = null
let _tokenExpiry = 0

async function getToken(): Promise<string> {
  const now = Date.now()
  if (_token && now < _tokenExpiry) return _token

  const res = await fetch(`${VPS_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'thai',
      password: process.env.JARVIS_ADMIN_PASSWORD || 'JarvisAdmin2026!'
    })
  })
  const data = await res.json()
  _token = data.token
  _tokenExpiry = now + 55 * 60 * 1000
  return _token!
}

function readSQLiteCache(): Record<string, CacheResult> | null {
  try {
    if (!fs.existsSync(DB_PATH)) return null
    const db = new Database(DB_PATH, { readonly: true, fileMustExist: true })
    const now = Date.now()
    const cutoffDefault = now - STALE_HOURS * 3600 * 1000
    const cutoffMtd = now - STALE_HOURS_MTD * 3600 * 1000
    const results: Record<string, CacheResult> = {}

    for (const [key, def] of Object.entries(SQLITE_SOURCES)) {
      const cutoff = (def.source === 'GOOGLE_ADS' && def.endpoint === 'performance_mtd')
        ? cutoffMtd : cutoffDefault
      const row = db.prepare(
        'SELECT data, fetched_at FROM sync_cache WHERE source = ? AND endpoint = ? LIMIT 1'
      ).get(def.source, def.endpoint) as { data: string; fetched_at: number | string } | undefined

      if (row) {
        // Handle both ISO string and legacy epoch integer
        const fetchedMs = typeof row.fetched_at === 'string'
          ? new Date(row.fetched_at).getTime()
          : row.fetched_at
        if (fetchedMs > cutoff) {
          const ageH = ((Date.now() - fetchedMs) / 3600000).toFixed(1)
          results[key] = { value: JSON.parse(row.data), src: `SQLite(${ageH}h)`, label: def.label }
        }
      }
    }

    db.close()
    return Object.keys(results).length > 0 ? results : null
  } catch (err: any) {
    console.error('[AGENT-DATA] SQLite read error:', err.message)
    return null
  }
}

async function fetchFromAPI(key: string): Promise<any> {
  const endpoint = API_ENDPOINTS[key]
  if (!endpoint) return null

  const token = await getToken()
  const res = await fetch(`${VPS_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  return res.json()
}

export async function getContext(agentId?: string) {
  const cached = readSQLiteCache() || {}
  const sources: Record<string, string> = {}
  const data: Record<string, any> = {}

  const needApi: string[] = []

  for (const key of Object.keys(SQLITE_SOURCES)) {
    if (cached[key]) {
      sources[SQLITE_SOURCES[key].label] = cached[key].src
      data[key] = cached[key].value
    } else {
      needApi.push(key)
      sources[SQLITE_SOURCES[key].label] = 'API(live)'
    }
  }

  if (Object.keys(cached).length === 0) {
    console.log(`[AGENT-${agentId || '??'}] SQLite stale/missing — full API fallback`)
  }

  if (needApi.length > 0) {
    const results = await Promise.allSettled(needApi.map(k => fetchFromAPI(k)))
    needApi.forEach((k, i) => {
      if (results[i].status === 'fulfilled' && (results[i] as PromiseFulfilledResult<any>).value) {
        data[k] = (results[i] as PromiseFulfilledResult<any>).value
      }
    })
  }

  const sourceLog = Object.entries(sources).map(([k, v]) => `${k}=${v}`).join(', ')
  console.log(`[AGENT-${agentId || '??'}] Data: ${sourceLog}`)

  const census = data.kipu || null
  const budgetCaps = data.budgetCaps || null
  const adsPerfMtd = data.adsPerfMtd || null
  const liveOpsBlock = buildLiveOpsBlock(census, budgetCaps, adsPerfMtd)

  return {
    performance: data.adsPerf || null,
    performance30: data.adsPerf30 || null,
    ctmQuality: data.ctmQuality || null,
    ctmSummary: data.ctmSummary || null,
    campaignQuality: data.campaignQuality || null,
    campaignHistory: data.campaignHistory || null,
    hubspot: data.hubspot || null,
    census,
    budgetCaps,
    liveOpsBlock,
    qualifiedLeadsDeep: data.qualifiedLeadsDeep || null,
    sources,
  }
}

function buildLiveOpsBlock(census: any, budgetCaps: any, mtd: any): string {
  const lines: string[] = []
  lines.push('')
  lines.push('═══ LIVE OPERATIONAL DATA — AUTHORITATIVE, OVERRIDES ANY STATIC TEXT ═══')
  lines.push('Any number elsewhere in this prompt that conflicts with the values below is STALE — use these.')

  if (census && typeof census.occupancyPct === 'number') {
    const occ = census.occupiedBeds ?? '?'
    const total = (census.occupiedBeds ?? 0) + (census.availableBeds ?? 0) || '?'
    const zone = census.occupancyPct < 50 ? 'BELOW_50' : census.occupancyPct >= 90 ? 'ABOVE_90' : 'HOLD'
    lines.push('')
    lines.push(`CURRENT LIVE OCCUPANCY: ${census.occupancyPct}% (${occ}/${total} beds) — zone: ${zone}`)
    const locs = Array.isArray(census.locations) ? census.locations : []
    for (const l of locs) {
      const cap = l.beds == null ? 'PHP/IOP' : `${l.occupied}/${l.beds}`
      lines.push(`  - ${l.name}: ${cap}`)
    }
  } else {
    lines.push('')
    lines.push('CURRENT LIVE OCCUPANCY: unavailable — say so; do not guess.')
  }

  if (budgetCaps && Array.isArray(budgetCaps.campaigns)) {
    lines.push('')
    lines.push(`CURRENT LIVE BUDGET CAPS (source: Google Ads API, fetched_at=${budgetCaps.fetched_at || 'unknown'}):`)
    for (const c of budgetCaps.campaigns) {
      const b = c.daily_budget == null ? `[${c.status}]` : `$${c.daily_budget}/day [${c.status}]`
      lines.push(`  - ${c.name}: ${b}`)
    }
  } else {
    lines.push('')
    lines.push('CURRENT LIVE BUDGET CAPS: unavailable — say so; do not cite hardcoded zone targets as current.')
  }

  if (mtd && mtd.summary && typeof mtd.summary.total_spend === 'number') {
    // Hardcoded array because new Date('YYYY-MM-DD') parses as UTC
    // midnight, which becomes the previous day in AZ — toLocaleString
    // would yield the wrong month name. Slicing the YYYY-MM-DD string
    // is the correct path.
    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
    const monthIdx = parseInt((mtd.period?.from || '').slice(5, 7), 10) - 1
    const monthName = MONTHS[monthIdx] || 'Current month'
    const spend = mtd.summary.total_spend.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
    lines.push('')
    lines.push('GOOGLE ADS — MONTH-TO-DATE SPEND (Arizona)')
    lines.push(`${monthName} MTD: ${spend} [as of ${mtd.as_of || 'unknown'}]`)
    lines.push(`Period: ${mtd.period?.from} to ${mtd.period?.to} (${mtd.period?.days} days)`)
    lines.push(`Note: ${mtd.freshness_note || 'Google Ads reporting may lag.'}`)
  } else {
    lines.push('')
    lines.push('GOOGLE ADS — MONTH-TO-DATE SPEND: data temporarily unavailable — say so; do not infer MTD spend from monthly budget targets or 7-day extrapolation.')
  }

  lines.push('═══ END LIVE OPERATIONAL DATA ═══')
  lines.push('')
  return lines.join('\n')
}
