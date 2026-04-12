import { NextResponse } from 'next/server'

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

    // Inject live data context for relevant agents
    let contextBlock = ''
    if (agentId === '01' && context) {
      const p = context.performance
      const camps = context.campaigns?.campaigns || []
      const census = context.census
      const ctm = context.ctm
      const hubspot = context.hubspot

      const churchCensus = census?.byLocation?.find((l: any) => l.name?.toLowerCase().includes('church'))?.census
      const frierCensus  = census?.byLocation?.find((l: any) => l.name?.toLowerCase().includes('frier'))?.census

      contextBlock = `

LIVE DRC DASHBOARD DATA — pulled right now:

GOOGLE ADS (30 days):
- Spend: $${p?.summary?.total_spend?.toFixed(0) ?? 'unknown'}
- Clicks: ${p?.summary?.total_clicks ?? 'unknown'}
- CPL: $${p?.summary?.cost_per_conversion?.toFixed(0) ?? 'unknown'} (target: $150)
- Conversions: ${Math.round(p?.summary?.total_conversions || 0)}
- Active campaigns: ${camps.length}

CENSUS (Kipu live):
- Church RTC (Scottsdale, female): ${churchCensus ?? '?'} beds occupied
- Frier RTC (Glendale, male): ${frierCensus ?? '?'} beds occupied

CALL TRACKING (CTM 30 days):
- Total calls: ${ctm?.total_calls_30d ?? 'unknown'}
- Answer rate: ${ctm?.answer_rate ?? 'unknown'}%
- Missed calls: ${ctm?.total_missed ?? ctm?.missed_calls ?? 'unknown'}

HUBSPOT PIPELINE:
- Total deals: ${hubspot?.deals_count ?? 0}
- Closed won (recent sample): ${(hubspot?.recent_deals || []).filter((d: any) => d.stage === 'closedwon').length}
- Total contacts: ${hubspot?.contacts_count ?? 'unknown'}

RECOMMENDATION FRAMEWORK:
- NEVER recommend increasing PMax budget based on call volume alone — cross-reference with CTM star ratings
- A "conversion" in Google Ads does NOT mean a qualified lead. Use CTM quality scores as the truth metric
- Free channels (GBP, Organic) should be evaluated on qualified-lead output, not just call volume
- When occupancy is low at a specific location, flag surge-marketing needs for that demographic
- When account CPL exceeds the $150 target, diagnose root cause before recommending budget changes

Analyze the live numbers above to give Thai a complete strategic picture.
Do not ask Thai to share data you already have above. Cite actual numbers from
this context in your response.`
    } else if (agentId === '07' && context?.performance) {
      // Detect requested time range from the user message. Default is 7d
      // (daily check-in bias — most Agent 07 questions are "how are we doing
      // today / this week"). If the user explicitly asks about "this month",
      // "30 days", "quarter", etc. we widen the window.
      const msgLower = (message || '').toLowerCase()
      let requestedDays = 7
      if (/\b90 days?\b|\bquarter\b|\blast 3 months?\b|\bpast 90\b/.test(msgLower)) {
        requestedDays = 90
      } else if (/\bthis month\b|\b30 days?\b|\blast 30\b|\bpast 30\b|\bmonth\b/.test(msgLower)) {
        requestedDays = 30
      } else if (/\blast 14\b|\b14 days?\b|\btwo weeks?\b|\bpast 14\b/.test(msgLower)) {
        requestedDays = 14
      } else if (/\btoday\b|\byesterday\b|\bthis week\b|\bweek\b|\brecent(ly)?\b|\blast 7\b|\b7 days?\b|\bpast week\b/.test(msgLower)) {
        requestedDays = 7
      }

      let p: any = context.performance
      let camps: any[] = context.campaigns?.campaigns || []

      // Re-fetch if the user asked for a range different from the client's 30d default.
      if (requestedDays !== 30 && authHeader) {
        try {
          const [perfRes, campRes] = await Promise.all([
            fetch(`${VPS_BASE}/api/google-ads/performance?days=${requestedDays}`, {
              headers: { Authorization: authHeader }
            }),
            fetch(`${VPS_BASE}/api/google-ads/campaigns?days=${requestedDays}`, {
              headers: { Authorization: authHeader }
            }),
          ])
          if (perfRes.ok) p = await perfRes.json()
          if (campRes.ok) {
            const cj = await campRes.json()
            camps = cj?.campaigns || camps
          }
        } catch (err: any) {
          console.error('[chat-agent] days re-fetch failed:', err?.message)
        }
      }

      const rangeLabel = `${requestedDays} day${requestedDays === 1 ? '' : 's'}`

      const campLines = camps.slice(0, 20).map((c: any) => {
        const cpl = c.conversions > 0
          ? `$${Math.round(c.spend / c.conversions)}`
          : 'No conv'
        return `  - ${c.campaignName}: $${c.spend?.toFixed(0)} spend, ${c.clicks} clicks, ${Math.round(c.conversions || 0)} conv, CPL ${cpl}, Status: ${c.status === 2 ? 'ENABLED' : 'PAUSED'}`
      }).join('\n')

      contextBlock = `

LIVE GOOGLE ADS DATA — pulled directly from your account right now:

Account Summary (${rangeLabel}):
- Total Spend: $${p.summary?.total_spend?.toFixed(2)}
- Clicks: ${p.summary?.total_clicks}
- CPC: $${p.summary?.avg_cpc?.toFixed(2)}
- Conversions: ${Math.round(p.summary?.total_conversions || 0)}
- CPL: $${p.summary?.cost_per_conversion?.toFixed(2)} (target: $150)
- CTR: ${p.summary?.avg_ctr?.toFixed(2)}%

All ${camps.length} Campaigns (Status: ENABLED means serving, PAUSED means not serving):
${campLines}

RECOMMENDATION FRAMEWORK:
- A "conversion" in Google Ads does NOT mean a qualified lead — always cross-reference with CTM quality scores below before drawing conclusions
- NEVER recommend increasing PMax budget based on call volume alone; PMax historically produces low-duration hangup calls that inflate conversion counts without driving qualified leads
- When a campaign shows zero or very low conversions at meaningful spend, diagnose root cause by looking at: ad copy intent, match types, landing-page destination and form functionality, Quality Score, and CTM call quality for that source — do NOT assume a broken landing page without verifying the URL loads and has a working form
- When recommending pauses, budget shifts, or bid changes, cite the exact campaign name and the specific metric threshold that justifies the action
- Free channels (GBP, Organic) should be evaluated on qualified-lead output, not just call volume

You have full campaign-level data above plus CTM quality data injected below. Do not ask Thai to share data you already have. Analyze what you have and give specific recommendations with exact campaign names and dollar amounts from this live context.`

      // Live CTM quality data injection
      const cq = context.campaignQuality
      const ctmQ = context.ctmQuality

      if (cq?.campaigns) {
        contextBlock += `\n\nCTM QUALITY CORRELATION (live data):\n`
        contextBlock += `Account qualification rate: ${cq.account_summary?.account_qualification_rate}%\n`
        contextBlock += `Blended qualified CPL: $${cq.account_summary?.blended_qualified_cpl}\n\n`
        contextBlock += `CAMPAIGN TRUE QUALIFIED CPL:\n`
        cq.campaigns.forEach((c: any) => {
          if (c.ad_spend > 0) {
            contextBlock += `- ${c.campaign}: $${c.ad_spend} spend, ${c.qualified_leads} qualified leads (4-5★), qualified CPL: $${c.qualified_cpl || 'NONE'}, avg duration: ${c.avg_duration_seconds}s, verdict: ${c.verdict}\n`
          }
        })
      }

      if (ctmQ?.summary) {
        contextBlock += `\nCTM QUALITY SUMMARY (30 days):\n`
        contextBlock += `Total calls: ${ctmQ.summary.total_calls}\n`
        contextBlock += `5-star qualified: ${ctmQ.summary.score_distribution?.['5'] ?? 0}\n`
        contextBlock += `4-star potential: ${ctmQ.summary.score_distribution?.['4'] ?? 0}\n`
        contextBlock += `Overall qual rate: ${ctmQ.summary.qualification_rate}%\n`

        if (ctmQ.by_source) {
          contextBlock += `\nQUALIFIED LEADS BY SOURCE:\n`
          ctmQ.by_source.slice(0, 8).forEach((s: any) => {
            contextBlock += `- ${s.source}: ${s.qualified} qualified (${s.scores?.['5'] ?? 0} five-star), ${s.qualificationRate}% qual rate\n`
          })
        }
      }

      if (context.campaignHistory?.campaigns) {
        contextBlock += `\nCAMPAIGN ALL-TIME HISTORY:\n`
        context.campaignHistory.campaigns.forEach((c: any) => {
          contextBlock += `- ${c.campaign_name}: $${c.total_spend.toFixed(0)} total spend, active ${c.first_active || '?'} to ${c.last_active || '?'}, ${Math.round(c.total_conversions)} conv, avg CPA ${c.avg_cpa ? '$' + c.avg_cpa : 'N/A'}, status: ${c.status}\n`
        })
      }

      contextBlock += `\nKEY INSIGHT: True qualified CPL is typically much higher than Google-reported CPL because many Google conversions are low-quality calls. Always reference CTM star ratings from the live data above, not Google conversion counts, when evaluating campaign performance.\n`
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
