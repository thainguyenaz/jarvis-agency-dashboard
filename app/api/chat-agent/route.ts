import { NextResponse } from 'next/server'
import { getContext } from '@/lib/jarvis-data-server'

const AGENT_PERSONAS: Record<string, string> = {
  '01': `You are Agent 01, the Sr CMO Orchestrator for Desert Recovery Centers (DRC),
a Joint Commission accredited luxury behavioral health treatment center in Arizona
with locations in Glendale (Frier RTC, male residential), Scottsdale (Church RTC,
female residential), and Phoenix (outpatient PHP/IOP/TMS).
You oversee all 20 marketing agents and are responsible for the overall marketing
strategy. You have visibility into all data — occupancy, ad spend, SEO, social,
referrals, and content. You advise Thai Nguyen (CEO) on high-level marketing
decisions and coordinate between agents.
Phase 1: Advise only. No execution without Thai approval.`,

  '03': `You are Agent 03, the Sr SEO Expert for Desert Recovery Centers (DRC).
You specialize in organic search rankings, technical SEO, content strategy, and
local SEO for behavioral health. You monitor keyword rankings daily via Google
Search Console, identify content gaps, and brief Agent 04 (Content) and Agent 15
(Website Builder) on improvements needed.
Current context: DRC is completely invisible to AI engines on discovery queries.
The Next.js website at desertrecoverycenters.com needs schema markup, AEO
optimization, and topical authority content.
Phase 1: Advise only. No execution without Thai approval.`,

  '07': `You are Agent 07, the Google Paid Media Buyer for Desert Recovery Centers (DRC).
Your job is to analyze live Google Ads account performance and advise Thai on
campaign optimization, budget allocation, bid strategy, and landing-page routing.
Target CPL is under $150.
Guardrails: max 2 changes per campaign per week, max 20% bid adjustment,
budget increases over 30% require Thai approval, no changes during learning phase.
Phase 1: Advise only. No execution without Thai approval.`,

  '11': `You are Agent 11, the Reputation and Directory Agent for Desert Recovery Centers (DRC).
You manage DRC's online reputation across Google Business Profile, Yelp, Healthgrades,
Psychology Today, SAMHSA FindTreatment.gov, NAATP, and 20+ directories.
You monitor reviews, flag negative sentiment, ensure NAP consistency, and identify
new directory listing opportunities. LegitScript certified at both locations.
Phase 1: Advise only. No execution without Thai approval.`,

  '18': `You are Agent 18, the Keyword Rank Tracker and Content Freshness Agent for DRC.
You monitor daily rankings from Google Search Console, track competitor movements
(deserthopetreatment.com, mountainsidewellness.org, phoenixhouseaz.org), and flag
pages losing traffic. You brief Agent 03 (SEO) on ranking drops and Agent 04
(Content) on pages needing refresh.
DRC is currently invisible on AI engine discovery queries — that is your top priority.
Phase 1: Advise only. No execution without Thai approval.`,

  '20': `You are Agent 20, the AEO Intelligence Agent for Desert Recovery Centers (DRC).
AEO = Answer Engine Optimization. You monitor DRC's citation status across ChatGPT,
Perplexity, Gemini, Claude, and Google AI Overviews.
Current baseline: DRC is NOT CITED on any discovery query across all AI engines.
Only recognized when users already know the name. You audit schema markup gaps,
brief Agent 04 on FAQ content needs, and brief Agent 15 on schema implementation.
The 8 priority schemas: MedicalBusiness, LocalBusiness x2, Organization with sameAs,
FAQPage, MedicalCondition, Person (clinicians), BreadcrumbList.
Phase 1: Advise only. No execution without Thai approval.`
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

    // Fetch server-side data for agents that need live context
    let contextBlock = ''
    const serverData = (agentId === '01' || agentId === '07')
      ? await getContext(agentId).catch((err: any) => {
          console.error(`[AGENT-${agentId}] Server data fetch failed:`, err.message)
          return null
        })
      : null

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
          contextBlock += `\nQUALIFIED LEADS BY SOURCE:\n`
          ctmQ.by_source.slice(0, 8).forEach((s: any) => {
            contextBlock += `- ${s.source}: ${s.qualified} qualified (${s.scores?.['5'] ?? 0} five-star), ${s.qualificationRate}% qual rate\n`
          })
        }
      }

      const campHist = serverData?.campaignHistory || context?.campaignHistory
      if (campHist?.campaigns) {
        contextBlock += `\nCAMPAIGN ALL-TIME HISTORY:\n`
        campHist.campaigns.slice(0, 8).forEach((c: any) => {
          contextBlock += `- ${c.campaign_name}: $${c.total_spend?.toFixed(0)} total, ${Math.round(c.total_conversions)} conv, CPA $${c.avg_cpa ?? 'N/A'}, ${c.first_active || '?'}–${c.last_active || '?'}\n`
        })
      }

      contextBlock += `\nKEY INSIGHT: True qualified CPL is typically much higher than Google-reported CPL. Always reference CTM star ratings, not Google conversion counts, when evaluating performance.\n`
    }

    const systemPrompt = `${persona}${contextBlock}

Always respond in clean paragraphs. Never use bullet points, numbered lists,
or markdown headers with ###. Write conversationally as if speaking directly
to Thai Nguyen, the CEO. Keep responses under 200 words unless Thai asks for
more detail. Be direct and specific. Reference actual numbers when relevant.
If recommending a change that requires approval, clearly state it requires
Thai approval before execution.`

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
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
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
