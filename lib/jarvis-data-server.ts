import Database from 'better-sqlite3'
import fs from 'fs'

const DB_PATH = '/home/openclaw/data/jarvis-cache.db'
const STALE_HOURS = 25
const VPS_BASE = 'http://93.188.166.239:3002'

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
  adsPerf:         { source: 'GOOGLE_ADS', endpoint: 'performance_7', label: 'GoogleAds' },
  ctmQuality:      { source: 'ctm',        endpoint: 'quality-30d',   label: 'CTM' },
  campaignQuality: { source: 'ctm',        endpoint: 'campaign-quality-30d', label: 'CampaignQuality' },
  campaignHistory: { source: 'GOOGLE_ADS', endpoint: 'campaign_history', label: 'CampaignHistory' },
  hubspot:         { source: 'HUBSPOT',    endpoint: 'pipeline',      label: 'HubSpot' },
  kipu:            { source: 'KIPU',       endpoint: 'census',        label: 'Kipu' },
}

const API_ENDPOINTS: Record<string, string> = {
  adsPerf:         '/api/google-ads/performance?days=7',
  ctmQuality:      '/api/ctm/quality-report?days=30',
  campaignQuality: '/api/ctm/campaign-quality?days=30',
  campaignHistory: '/api/google-ads/campaign-history',
  hubspot:         '/api/hubspot/pipeline',
  kipu:            '/api/kipu/census',
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
    const cutoff = Date.now() - STALE_HOURS * 3600 * 1000
    const results: Record<string, CacheResult> = {}

    for (const [key, def] of Object.entries(SQLITE_SOURCES)) {
      const row = db.prepare(
        'SELECT data, fetched_at FROM sync_cache WHERE source = ? AND endpoint = ? LIMIT 1'
      ).get(def.source, def.endpoint) as { data: string; fetched_at: number } | undefined

      if (row && row.fetched_at > cutoff) {
        const ageH = ((Date.now() - row.fetched_at) / 3600000).toFixed(1)
        results[key] = { value: JSON.parse(row.data), src: `SQLite(${ageH}h)`, label: def.label }
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

  return {
    performance: data.adsPerf || null,
    ctmQuality: data.ctmQuality || null,
    campaignQuality: data.campaignQuality || null,
    campaignHistory: data.campaignHistory || null,
    hubspot: data.hubspot || null,
    census: data.kipu || null,
    sources,
  }
}
