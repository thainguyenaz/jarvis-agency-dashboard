import { NextResponse } from 'next/server'
import { getContext } from '@/lib/jarvis-data-server'

const BEHAVIORAL_HEALTH_EXPERTISE = `
BEHAVIORAL HEALTH INDUSTRY EXPERTISE:
You are an expert in the behavioral health treatment industry — specifically luxury residential addiction treatment and mental health care in Arizona. You understand:

PATIENT & FAMILY PSYCHOLOGY:
- The caller is almost never the patient — it is usually a family member (spouse, parent, sibling) in crisis making a desperate call
- The decision window is extremely short — if a family does not get a compassionate, knowledgeable response within minutes, they call the next facility
- Luxury behavioral health buyers are insurance-dependent but want premium amenities, clinical excellence, and privacy
- Common objections: cost, insurance coverage, distance from home, fear of stigma, uncertainty about what to expect
- Tricare/TriWest in-network status is a significant differentiator for military families — always flag this as an asset

TREATMENT LEVELS & DRC SERVICES:
- Residential Treatment Center (RTC): highest acuity, 24/7 supervised care, 30-90 days typical LOS
- Partial Hospitalization Program (PHP): step-down from residential, 6 hours/day
- Intensive Outpatient Program (IOP): 3 hours/day, 3 days/week minimum
- Outpatient (OP): weekly therapy sessions
- TMS (Transcranial Magnetic Stimulation): NeuroStar device, non-invasive, for depression/OCD
- Sober Living: transitional housing post-treatment
- DRC has TWO residential locations: Scottsdale (Church RTC, female, 10 beds) and Glendale (Frier RTC, male, 10 beds)
- Outpatient is at Phoenix (4160 N 108th Ave)

MARKETING & COMPLIANCE CONSTRAINTS:
- LegitScript certified — must maintain compliant ad copy
- HIPAA applies to all patient data — never reference specific patients
- Banned language in ads: "cure," "guarantee," "best," "number one" without substantiation
- Google has strict behavioral health advertising policies — ads require LegitScript certification to run
- No Medicare or Medicaid — private insurance and Tricare/TriWest only
- Joint Commission accredited — this is a major trust signal, always use it

SEARCH INTENT CLASSIFICATION FOR BEHAVIORAL HEALTH:
- HIGH INTENT (target aggressively): "inpatient rehab Arizona," "residential mental health treatment Scottsdale," "luxury addiction treatment," "private pay rehab," "executive rehab program," "dual diagnosis treatment Arizona," "mental hospital phoenix," "inpatient psychiatric hospital"
- MEDIUM INTENT (target carefully): "drug rehab near me," "mental health treatment center," "addiction treatment program," "long term inpatient psychiatric care," "addiction counseling," "i need counseling now," "psychology referral service"
- LOW INTENT / WRONG FIT (add as negatives): "free rehab," "AA meetings," "hotline," "online therapy," "mental health app"
- COMPETITOR SEARCHES: Only bid on competitor terms if you have clear differentiation to offer

DATA-VERIFIED NEGATIVE KEYWORD LIST (April 12, 2026 — based on 6-month search term analysis, $12,781 spend, 421 matched terms):
CONFIRMED NEGATIVES — ADD TO ALL CAMPAIGNS:
- therapist, therapists near me (zero conversions across 6 months, pure outpatient intent)
- online counseling, over the phone counseling (excluded, zero conversions)
- anger management counseling (zero conversions, wrong service type)
- counselors [city] — mesa, chandler, tempe variants (wrong location + outpatient provider search)
- substance abuse counselor (outpatient provider search, $117 spent, 0 conversions)
- drug abuse counselor ($104 spent, 0 conversions)
- alcohol screening with a licensed counselor ($158 spent, 0 conversions)
- forensic psychiatric evaluation ($51 spent, 0 conversions, wrong service)
- redemption psychiatry (competitor name, $58 spent, 0 conversions)
- valley psychiatric hospital (competitor name, $65 spent, 0 conversions)
- crossroads counseling scottsdale (competitor name — note: 1 conversion but competitor traffic)

DO NOT ADD AS NEGATIVES — DATA SHOWS THESE CONVERT:
- mental hospital, mental hospital phoenix, mental hospitals near me (9 conversions at $422 CPA — high-value cluster)
- inpatient psychiatric hospital phoenix (2 conversions — residential intent confirmed)
- long term inpatient psychiatric care (1 conversion — residential intent)
- psychiatrist (DO NOT negative — DRC is hiring a psychiatrist MD, and "psychiatrist" had 1 conversion at $396)
- addiction counseling (1 conversion at $188 — crisis/treatment-seeking intent)
- i need counseling now (1 conversion — crisis intent, not outpatient browsing)
- psychology referral service (1 conversion — referral pathway)

NEW KEYWORD OPPORTUNITIES (based on psychiatrist hire + data):
- psychiatrist Arizona luxury
- inpatient psychiatrist Phoenix
- psychiatric evaluation and treatment Arizona
- dual diagnosis psychiatrist Arizona
- luxury psychiatric care Scottsdale

CALL QUALITY STANDARDS:
- A real qualified lead is a family member or patient calling about residential admission with insurance coverage
- Average qualified call duration: 6+ minutes
- Calls under 60 seconds = wrong number, hangup, or non-English speaker
- Calls 60-120 seconds = borderline, may be information seekers
- Calls 120+ seconds with 4-5 star CTM rating = TRUE QUALIFIED LEAD
- Speed to lead matters critically — DRC's current average is 12.4 minutes vs 5 minute industry standard. Every minute of delay loses admissions to competitors

COMPETITIVE LANDSCAPE IN ARIZONA:
- Arizona is a highly competitive behavioral health market
- Key competitors: Scottsdale Recovery Center, Desert Hope, Banner Behavioral Health, Valleywise
- DRC differentiators: luxury amenities, dual diagnosis, Joint Commission accredited, TMS therapy, Tricare/TriWest in-network, two separate gender-specific residential locations
- Recovery.com and Psychology Today listings are high-intent directories — prioritize these over generic display advertising

REVENUE & OCCUPANCY CONTEXT:
- 20 total beds across two locations (10 Scottsdale, 10 Glendale)
- Current occupancy: Scottsdale 8/10 (80%), Glendale 3/10 (30%) — Glendale is the critical gap
- Average LOS (length of stay): typically 30-60 days residential
- Every empty bed is direct revenue loss
- One qualified admission can be worth $30,000-$90,000+ depending on LOS and insurance reimbursement
- The math: improving from 51 to 100 true qualified leads/month at current admission rate = significant revenue impact`

const CRITICAL_INSTRUCTION = `RESPONSE FORMAT RULES — FOLLOW EXACTLY:
- Always complete your FULL response in ONE message. Never truncate. Never stop mid-thought.
- Use clear headers with --- separators between sections
- Use bullet points for lists, not paragraphs
- Use specific numbers and data — never say 'unknown' if data is available
- Be direct and detailed like a senior analyst, not a paragraph-writing assistant
- Every recommendation must cite the specific data source (CTM, Google Ads API, Kipu, etc.)
- Minimum response length for strategic questions: 500 words with actual numbers`

const AGENT_PERSONAS: Record<string, string> = {
  '01': `${CRITICAL_INSTRUCTION}

You are Agent 01, the Sr CMO Orchestrator for Desert Recovery Centers (DRC),
a Joint Commission accredited luxury behavioral health treatment center in Arizona
with locations in Glendale (Frier RTC, male residential), Scottsdale (Church RTC,
female residential), and Phoenix (outpatient PHP/IOP/TMS).
You oversee all 20 marketing agents and are responsible for the overall marketing
strategy. You have visibility into all data — occupancy, ad spend, SEO, social,
referrals, and content. You advise Thai Nguyen (CEO) on high-level marketing
decisions and coordinate between agents.
Phase 1: Advise only. No execution without Thai approval.
${BEHAVIORAL_HEALTH_EXPERTISE}

CORE PERFORMANCE RULE — NON-NEGOTIABLE:
The only metric that matters is 4-5 star CTM qualified leads with call duration >= 120 seconds.
- A Google Ads "conversion" means nothing unless it results in a 4 or 5 star CTM call lasting 2+ minutes
- Any campaign with zero 4-5 star calls in 30 days is FAILING regardless of conversion count
- Any campaign with CPL > $1,500 per qualified lead is CRITICAL and requires immediate review
- Short calls under 60 seconds are FAKE or WRONG NUMBER — never count these
- Calls 60-120 seconds are BORDERLINE — treat as unqualified unless tagged otherwise
- Calls 120+ seconds with 4-5 stars are TRUE QUALIFIED LEADS
- Every recommendation must be tied back to: "does this drive more 4-5 star calls over 2 minutes?"`,

  '03': `${CRITICAL_INSTRUCTION}

You are Agent 03, the Sr SEO Expert for Desert Recovery Centers (DRC).
You specialize in organic search rankings, technical SEO, content strategy, and
local SEO for behavioral health. You monitor keyword rankings daily via Google
Search Console, identify content gaps, and brief Agent 04 (Content) and Agent 15
(Website Builder) on improvements needed.
Current context: DRC is completely invisible to AI engines on discovery queries.
The Next.js website at desertrecoverycenters.com needs schema markup, AEO
optimization, and topical authority content.
Phase 1: Advise only. No execution without Thai approval.
${BEHAVIORAL_HEALTH_EXPERTISE}`,

  '07': `${CRITICAL_INSTRUCTION}

You are Agent 07, the Google Paid Media Buyer for Desert Recovery Centers (DRC).
Your job is to analyze live Google Ads account performance and advise Thai on
campaign optimization, budget allocation, bid strategy, and landing-page routing.
Target CPL is under $150.
Guardrails: max 2 changes per campaign per week, max 20% bid adjustment,
budget increases over 30% require Thai approval, no changes during learning phase.
Phase 1: Advise only. No execution without Thai approval.
${BEHAVIORAL_HEALTH_EXPERTISE}

CORE PERFORMANCE RULE — NON-NEGOTIABLE:
The only metric that matters is 4-5 star CTM qualified leads with call duration >= 120 seconds.
- A Google Ads "conversion" means nothing unless it results in a 4 or 5 star CTM call lasting 2+ minutes
- Any campaign with zero 4-5 star calls in 30 days is FAILING regardless of conversion count
- Any campaign with CPL > $1,500 per qualified lead is CRITICAL and requires immediate review
- Short calls under 60 seconds are FAKE or WRONG NUMBER — never count these
- Calls 60-120 seconds are BORDERLINE — treat as unqualified unless tagged otherwise
- Calls 120+ seconds with 4-5 stars are TRUE QUALIFIED LEADS
- Every recommendation must be tied back to: "does this drive more 4-5 star calls over 2 minutes?"`,

  '11': `${CRITICAL_INSTRUCTION}

You are Agent 11, the Reputation and Directory Agent for Desert Recovery Centers (DRC).
You manage DRC's online reputation across Google Business Profile, Yelp, Healthgrades,
Psychology Today, SAMHSA FindTreatment.gov, NAATP, and 20+ directories.
You monitor reviews, flag negative sentiment, ensure NAP consistency, and identify
new directory listing opportunities. LegitScript certified at both locations.
Phase 1: Advise only. No execution without Thai approval.
${BEHAVIORAL_HEALTH_EXPERTISE}`,

  '18': `${CRITICAL_INSTRUCTION}

You are Agent 18, the Keyword Rank Tracker and Content Freshness Agent for DRC.
You monitor daily rankings from Google Search Console, track competitor movements
(deserthopetreatment.com, mountainsidewellness.org, phoenixhouseaz.org), and flag
pages losing traffic. You brief Agent 03 (SEO) on ranking drops and Agent 04
(Content) on pages needing refresh.
DRC is currently invisible on AI engine discovery queries — that is your top priority.
Phase 1: Advise only. No execution without Thai approval.
${BEHAVIORAL_HEALTH_EXPERTISE}`,

  '20': `${CRITICAL_INSTRUCTION}

You are Agent 20, the AEO Intelligence Agent for Desert Recovery Centers (DRC).
AEO = Answer Engine Optimization. You monitor DRC's citation status across ChatGPT,
Perplexity, Gemini, Claude, and Google AI Overviews.
Current baseline: DRC is NOT CITED on any discovery query across all AI engines.
Only recognized when users already know the name. You audit schema markup gaps,
brief Agent 04 on FAQ content needs, and brief Agent 15 on schema implementation.
The 8 priority schemas: MedicalBusiness, LocalBusiness x2, Organization with sameAs,
FAQPage, MedicalCondition, Person (clinicians), BreadcrumbList.
Phase 1: Advise only. No execution without Thai approval.
${BEHAVIORAL_HEALTH_EXPERTISE}`
}

const DEFAULT_PERSONA = `You are a Jarvis Marketing Agency AI agent for Desert Recovery Centers (DRC),
a luxury behavioral health treatment center in Arizona. You advise Thai Nguyen (CEO)
on marketing strategy. Phase 1: Advise only. No execution without Thai approval.
Always respond in clean paragraphs. Never use bullet points or markdown headers.`

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders })
}

const VPS_BASE = 'http://93.188.166.239:3002'

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const { message, agentId, agentRole, agentName, history, context, conversation_id } = await req.json()

    if (!message) {
      return NextResponse.json({ reply: 'No message provided' }, { status: 400, headers: corsHeaders })
    }

    const persona = AGENT_PERSONAS[agentId] || DEFAULT_PERSONA

    // Fetch server-side data for all agents — every agent gets live context
    let contextBlock = ''
    const serverData = await getContext(agentId).catch((err: any) => {
      console.error(`[AGENT-${agentId}] Server data fetch failed:`, err.message)
      return null
    })

    if (agentId === '01') {
      // Use server-side data, fall back to client context
      const p = serverData?.performance || context?.performance
      const census = serverData?.census || context?.census
      const ctm = serverData?.ctmQuality || context?.ctm
      const hubspot = serverData?.hubspot || context?.hubspot
      const cq = serverData?.campaignQuality || context?.campaignQuality
      const campHist = serverData?.campaignHistory || context?.campaignHistory

      const pSummary = p?.summary || p
      const churchLoc = (census?.locations || census?.byLocation || [])
        .find((l: any) => l.name?.toLowerCase().includes('church'))
      const frierLoc = (census?.locations || census?.byLocation || [])
        .find((l: any) => l.name?.toLowerCase().includes('frier'))

      const ctmSummary = ctm?.summary || ctm
      const sd = ctmSummary?.score_distribution || {}

      contextBlock = `

LIVE DRC DASHBOARD DATA (server-side, SQLite-first):

GOOGLE ADS (7d):
- Spend: $${pSummary?.total_spend?.toFixed(0) ?? 'unknown'}
- Clicks: ${pSummary?.total_clicks ?? 'unknown'}
- CPC: $${pSummary?.avg_cpc?.toFixed(2) ?? 'unknown'}
- CPL: $${pSummary?.cost_per_conversion?.toFixed(0) ?? 'unknown'} (target: $150)
- Conversions: ${Math.round(pSummary?.total_conversions || 0)}
- CTR: ${pSummary?.avg_ctr?.toFixed(1) ?? 'unknown'}%

CTM CALL QUALITY (30d):
- Total calls: ${ctmSummary?.total_calls ?? 'unknown'}
- Qualification rate: ${ctmSummary?.qualification_rate ?? 'unknown'}%
- 5-star qualified: ${sd['5'] ?? 0}
- 4-star potential: ${sd['4'] ?? 0}
- Qualified leads: ${ctmSummary?.qualified_leads ?? 'unknown'}`

      if (cq?.campaigns) {
        const withCPL = cq.campaigns.filter((c: any) => c.qualified_cpl != null)
          .sort((a: any, b: any) => a.qualified_cpl - b.qualified_cpl)
        if (withCPL.length > 0) {
          contextBlock += `\n\nTOP CAMPAIGNS BY QUALIFIED CPL (30d):`
          withCPL.slice(0, 5).forEach((c: any) => {
            contextBlock += `\n- ${c.campaign}: $${c.qualified_cpl} CPL, ${c.qualified_leads} qualified of ${c.total_calls} calls (${c.qualification_rate}%)`
          })
        }
      }

      contextBlock += `

CENSUS (Kipu):
- Church RTC (Scottsdale, female): ${churchLoc?.occupied ?? churchLoc?.census ?? '?'}/${churchLoc?.beds ?? '10'} beds
- Frier RTC (Glendale, male): ${frierLoc?.occupied ?? frierLoc?.census ?? '?'}/${frierLoc?.beds ?? '10'} beds
- Occupancy: ${census?.occupancyPct ?? '?'}%

HUBSPOT PIPELINE:
- Total deals: ${hubspot?.deals_count ?? hubspot?.total_deals ?? 0}
- Total contacts: ${hubspot?.contacts_count ?? 'unknown'}
- Top sources: ${Object.entries(hubspot?.lead_sources || {}).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} (${v})`).join(', ') || 'unknown'}`

      if (campHist?.campaigns) {
        contextBlock += `\n\nCAMPAIGN ALL-TIME HISTORY:\n`
        campHist.campaigns.slice(0, 8).forEach((c: any) => {
          contextBlock += `- ${c.campaign_name}: $${c.total_spend?.toFixed(0)} total, ${Math.round(c.total_conversions)} conv, CPA $${c.avg_cpa ?? 'N/A'}, active ${c.first_active || '?'}–${c.last_active || '?'}, ${c.status}\n`
        })
      }

      // Inject deep qualified leads data
      const qlDeep01 = serverData?.qualifiedLeadsDeep || context?.qualifiedLeadsDeep
      if (qlDeep01?.summary) {
        const qs = qlDeep01.summary
        contextBlock += `\n\nTRUE QUALIFIED LEADS (4-5 star, 2+ min calls, last 30 days):\n`
        contextBlock += `Total: ${qs.qualified_leads} calls\n`
        contextBlock += `By source: ${(qs.by_source || []).map((s: any) => `${s.source} (${s.count}, avg ${s.avg_duration}s)`).join(', ')}\n`
        contextBlock += `By campaign: ${(qs.by_campaign || []).map((c: any) => `${c.campaign} (${c.count}, avg ${c.avg_duration}s)`).join(', ')}\n`
        contextBlock += `4-star calls: ${qs.by_score?.['4'] ?? 0} | 5-star calls: ${qs.by_score?.['5'] ?? 0}\n`
        contextBlock += `Average duration of qualified calls: ${qs.avg_duration_qualified}s\n`
        contextBlock += `Filtered out: ${qs.filtered_out_short_duration} short (<2min), ${qs.filtered_out_unanswered} unanswered\n`
      }

      contextBlock += `
RECOMMENDATION FRAMEWORK:
- NEVER recommend increasing PMax budget based on call volume alone — cross-reference with CTM star ratings
- A "conversion" in Google Ads does NOT mean a qualified lead. Use CTM quality scores as the truth metric
- Free channels (GBP, Organic) should be evaluated on qualified-lead output, not just call volume
- When occupancy is low at a specific location, flag surge-marketing needs for that demographic
- When account CPL exceeds the $150 target, diagnose root cause before recommending budget changes

Analyze the live numbers above to give Thai a complete strategic picture.
Do not ask Thai to share data you already have above. Cite actual numbers from
this context in your response.`
    } else if (agentId === '07') {
      const msgLower = (message || '').toLowerCase()
      let requestedDays = 7
      if (/\b90 days?\b|\bquarter\b|\blast 3 months?\b|\bpast 90\b/.test(msgLower)) {
        requestedDays = 90
      } else if (/\bthis month\b|\b30 days?\b|\blast 30\b|\bpast 30\b|\bmonth\b/.test(msgLower)) {
        requestedDays = 30
      } else if (/\blast 14\b|\b14 days?\b|\btwo weeks?\b|\bpast 14\b/.test(msgLower)) {
        requestedDays = 14
      }

      // Use server-side data as primary, client context as fallback
      let p: any = serverData?.performance || context?.performance
      const pSummary = p?.summary || p

      // Re-fetch for non-7d ranges via API
      if (requestedDays !== 7 && authHeader) {
        try {
          const perfRes = await fetch(`${VPS_BASE}/api/google-ads/performance?days=${requestedDays}`, {
            headers: { Authorization: authHeader }
          })
          if (perfRes.ok) p = await perfRes.json()
        } catch (err: any) {
          console.error('[AGENT-07] days re-fetch failed:', err?.message)
        }
      }

      const ps = requestedDays === 7 ? pSummary : (p?.summary || p)
      const rangeLabel = `${requestedDays} day${requestedDays === 1 ? '' : 's'}`

      contextBlock = `

LIVE GOOGLE ADS DATA (server-side, SQLite-first):

Account Summary (${rangeLabel}):
- Total Spend: $${ps?.total_spend?.toFixed(2) ?? 'unknown'}
- Clicks: ${ps?.total_clicks ?? 'unknown'}
- CPC: $${ps?.avg_cpc?.toFixed(2) ?? 'unknown'}
- Conversions: ${Math.round(ps?.total_conversions || 0)}
- CPL: $${ps?.cost_per_conversion?.toFixed(2) ?? 'unknown'} (target: $150)
- CTR: ${ps?.avg_ctr?.toFixed(2) ?? 'unknown'}%

RECOMMENDATION FRAMEWORK:
- A "conversion" in Google Ads does NOT mean a qualified lead — always cross-reference with CTM quality scores below
- NEVER recommend increasing PMax budget based on call volume alone
- When recommending pauses, budget shifts, or bid changes, cite the exact campaign name and metric
- Free channels (GBP, Organic) should be evaluated on qualified-lead output, not just call volume`

      // Inject per-campaign performance data
      const campaigns = p?.campaigns
      if (campaigns && Array.isArray(campaigns)) {
        // Aggregate daily rows by campaign name
        const byName: Record<string, { spend: number; clicks: number; impressions: number; conversions: number; status: number }> = {}
        campaigns.forEach((c: any) => {
          const name = c.campaignName || c.campaign_name || 'Unknown'
          if (!byName[name]) byName[name] = { spend: 0, clicks: 0, impressions: 0, conversions: 0, status: c.status }
          byName[name].spend += c.spend || 0
          byName[name].clicks += c.clicks || 0
          byName[name].impressions += c.impressions || 0
          byName[name].conversions += c.conversions || 0
        })
        contextBlock += `\n\nCAMPAIGN PERFORMANCE (${rangeLabel}):`
        Object.entries(byName)
          .sort((a, b) => b[1].spend - a[1].spend)
          .forEach(([name, d]) => {
            const cpc = d.clicks > 0 ? (d.spend / d.clicks).toFixed(2) : 'N/A'
            const cpl = d.conversions > 0 ? (d.spend / d.conversions).toFixed(2) : 'NONE'
            contextBlock += `\n- ${name}: $${d.spend.toFixed(2)} spend, ${d.clicks} clicks, CPC $${cpc}, ${d.conversions} conv, CPL $${cpl}`
          })
      }

      // CTM quality from server data
      const cq = serverData?.campaignQuality || context?.campaignQuality
      const ctmQ = serverData?.ctmQuality || context?.ctmQuality

      if (cq?.campaigns) {
        contextBlock += `\n\nCTM QUALITY CORRELATION:\n`
        contextBlock += `Account qualification rate: ${cq.account_summary?.account_qualification_rate}%\n`
        contextBlock += `Blended qualified CPL: $${cq.account_summary?.blended_qualified_cpl}\n\n`
        contextBlock += `CAMPAIGN TRUE QUALIFIED CPL:\n`
        cq.campaigns.forEach((c: any) => {
          if (c.ad_spend > 0) {
            contextBlock += `- ${c.campaign}: $${c.ad_spend} spend, ${c.qualified_leads} qualified (4-5★), CPL: $${c.qualified_cpl || 'NONE'}, verdict: ${c.verdict}\n`
          }
        })
      }

      if (ctmQ?.summary) {
        const sd = ctmQ.summary.score_distribution || {}
        contextBlock += `\nCTM QUALITY SUMMARY (30d):\n`
        contextBlock += `Total calls: ${ctmQ.summary.total_calls}, qual rate: ${ctmQ.summary.qualification_rate}%, 5★: ${sd['5'] ?? 0}, 4★: ${sd['4'] ?? 0}\n`

        if (ctmQ.by_source) {
          contextBlock += `\nQUALIFIED LEADS BY TRAFFIC SOURCE (these are CTM call sources, NOT Google Ads campaign names):\n`
          ctmQ.by_source.slice(0, 8).forEach((s: any) => {
            contextBlock += `- ${s.source}: ${s.qualified} qualified (${s.scores?.['5'] ?? 0} five-star), ${s.qualificationRate}% qual rate\n`
          })
        }
      }

      const campHist = serverData?.campaignHistory || context?.campaignHistory
      if (campHist?.campaigns) {
        const activeCamps = campHist.campaigns.filter((c: any) => c.status === 'ENABLED')
        const pausedCamps = campHist.campaigns.filter((c: any) => c.status === 'PAUSED')
        if (activeCamps.length > 0) {
          contextBlock += `\nACTIVE CAMPAIGN ALL-TIME HISTORY:\n`
          activeCamps.forEach((c: any) => {
            contextBlock += `- ${c.campaign_name}: $${c.total_spend?.toFixed(0)} total, ${Math.round(c.total_conversions)} conv, CPA $${c.avg_cpa ?? 'N/A'}, active ${c.first_active || '?'}–${c.last_active || '?'}\n`
          })
        }
        if (pausedCamps.length > 0) {
          contextBlock += `\nPAUSED CAMPAIGNS (historical reference only — NOT currently running):\n`
          pausedCamps.slice(0, 5).forEach((c: any) => {
            contextBlock += `- ${c.campaign_name}: $${c.total_spend?.toFixed(0)} total (PAUSED)\n`
          })
        }
      }

      // Inject deep qualified leads data — server-side primary, client fallback
      const qlDeep07 = serverData?.qualifiedLeadsDeep || context?.qualifiedLeadsDeep
      if (qlDeep07?.summary) {
        const qs = qlDeep07.summary
        contextBlock += `\nTRUE QUALIFIED LEADS (4-5 star, 2+ min calls, last 30 days):\n`
        contextBlock += `Total: ${qs.qualified_leads} calls\n`
        contextBlock += `By source: ${(qs.by_source || []).map((s: any) => `${s.source} (${s.count}, avg ${s.avg_duration}s)`).join(', ')}\n`
        contextBlock += `By campaign: ${(qs.by_campaign || []).map((c: any) => `${c.campaign} (${c.count}, avg ${c.avg_duration}s)`).join(', ')}\n`
        contextBlock += `4-star calls: ${qs.by_score?.['4'] ?? 0} | 5-star calls: ${qs.by_score?.['5'] ?? 0}\n`
        contextBlock += `Average duration of qualified calls: ${qs.avg_duration_qualified}s\n`
        contextBlock += `Filtered out: ${qs.filtered_out_short_duration} short (<2min), ${qs.filtered_out_unanswered} unanswered\n`
      }

      contextBlock += `
KEY INSIGHT: True qualified CPL is typically much higher than Google-reported CPL. Always reference CTM star ratings, not Google conversion counts, when evaluating performance.

CRITICAL DATA INTEGRITY RULE:
The ONLY active Google Ads campaigns are those listed in CAMPAIGN PERFORMANCE above. Do NOT invent, estimate, or hallucinate any campaign names, spend figures, click counts, or conversion numbers. If a data point is missing from the LIVE DATA sections above, say "data not available" — never fabricate numbers. Paused campaigns listed under PAUSED CAMPAIGNS are historical context only and are NOT currently spending. The "QUALIFIED LEADS BY SOURCE" section lists CTM call tracking sources (Google Organic, GBP, Direct), NOT Google Ads campaigns — do not confuse traffic sources with campaign names.
`
    } else if (['03', '11', '18', '20'].includes(agentId)) {
      // All marketing/admissions agents get CTM quality data for cross-referencing
      const ctm = serverData?.ctmQuality || context?.ctm || context?.ctmQuality
      const ctmSummary = ctm?.summary || ctm
      const sd = ctmSummary?.score_distribution || {}

      if (ctmSummary?.total_calls) {
        contextBlock = `

CTM CALL QUALITY DATA (30d — for cross-reference):
- Total calls: ${ctmSummary.total_calls}
- Qualification rate: ${ctmSummary.qualification_rate ?? '?'}%
- 5-star qualified: ${sd['5'] ?? 0}
- 4-star potential: ${sd['4'] ?? 0}
- Qualified leads: ${ctmSummary.qualified_leads ?? '?'}`

        if (ctm?.by_source) {
          contextBlock += `\n\nQUALIFIED LEADS BY SOURCE:`
          ctm.by_source.slice(0, 8).forEach((s: any) => {
            contextBlock += `\n- ${s.source}: ${s.qualified} qualified (${s.scores?.['5'] ?? 0} five-star), ${s.qualificationRate}% qual rate`
          })
        }

        contextBlock += `\n\nCORE METRIC: Only 4-5 star CTM calls lasting 2+ minutes count as true qualified leads. Reference this data when evaluating any marketing channel performance.`
      }

      // Inject deep qualified leads data if available
      const qlDeep = context?.qualifiedLeadsDeep
      if (qlDeep?.summary) {
        const qs = qlDeep.summary
        contextBlock += `\n\nTRUE QUALIFIED LEADS (4-5 star, 2+ min calls, last 30 days):\nTotal: ${qs.qualified_leads} calls\n`
        contextBlock += `By source: ${(qs.by_source || []).map((s: any) => `${s.source} (${s.count}, avg ${s.avg_duration}s)`).join(', ')}\n`
        contextBlock += `4-star calls: ${qs.by_score?.['4'] ?? 0} | 5-star calls: ${qs.by_score?.['5'] ?? 0}\n`
      }
    }

    const systemPrompt = `${persona}${contextBlock}

You are speaking directly to Thai Nguyen, the CEO. Be direct and specific.
Reference actual numbers when relevant. Use headers with --- separators and
bullet points — not paragraphs. If recommending a change that requires
approval, clearly state it requires Thai approval before execution.`

    const messages = [
      ...(history || []).slice(-10).map((h: any) => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.content
      })),
      { role: 'user', content: message }
    ]

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Anthropic API error:', response.status, errText)
      return NextResponse.json({
        reply: `Agent ${agentId || 'unknown'} API error: ${response.status}. Check server logs.`
      }, { status: 500, headers: corsHeaders })
    }

    const data = await response.json()
    const reply = data.content?.[0]?.text || 'No response from agent'

    // Auto-save the exchange to jarvis-api SQLite (non-fatal)
    let savedConvId = conversation_id || null
    if (authHeader) {
      try {
        const saveRes = await fetch(`${VPS_BASE}/api/conversations/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({
            conversation_id: conversation_id || undefined,
            agent_id: agentId,
            agent_name: agentName,
            user_message: message,
            agent_response: reply,
          })
        })
        const saveJson = await saveRes.json()
        if (saveJson?.conversation_id) savedConvId = saveJson.conversation_id
      } catch (saveErr: any) {
        console.error('[CONV] Save failed:', saveErr?.message)
      }
    }

    return NextResponse.json({
      reply,
      agentId,
      agentName,
      conversation_id: savedConvId
    }, { headers: corsHeaders })

  } catch (err: any) {
    console.error('Chat agent error:', err)
    return NextResponse.json({
      reply: `Connection failed: ${err.message}`
    }, { status: 500, headers: corsHeaders })
  }
}
