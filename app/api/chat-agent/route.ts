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
Current account data: $49,553 spend (30d), 4,400 clicks, $11.26 CPC, 123 conversions,
$402.89 CPL. Target CPL is under $150. You have 20 active campaigns.
Top performer: Facility Showcase PMax at $63.80 CPL, 9.52% CVR.
Worst performer: Detox Treatment at $1,061 spend, zero conversions in 4 days.
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

      contextBlock = `

LIVE DRC DASHBOARD DATA — pulled right now:

GOOGLE ADS (30 days):
- Spend: $${p?.spend?.toFixed(0) || 'unknown'}
- Clicks: ${p?.clicks || 'unknown'}
- CPL: $${p?.cost_per_conversion?.toFixed(0) || 'unknown'} (target: $150)
- Conversions: ${Math.round(p?.conversions || 0)}
- Active campaigns: ${camps.length}
- Best campaign: Facility Showcase PMax — $63.80 CPL, 9.52% CVR
- Worst campaign: Detox Treatment — $1,061 spent, ZERO conversions
- Wasted spend on zero-conversion search terms: $10,077

CENSUS (Kipu live):
- Church RTC (Scottsdale, female): ${census?.byLocation?.find((l: any) => l.name?.toLowerCase().includes('church'))?.census || '?'}/10 beds
- Frier RTC (Glendale, male): ${census?.byLocation?.find((l: any) => l.name?.toLowerCase().includes('frier'))?.census || '?'}/10 beds
- Frier is CRITICAL at 40% — needs male admissions urgently
- PHP outpatient (Indian School): 1 patient

CALL TRACKING (CTM 30 days):
- Total calls: ${ctm?.total_calls_30d || 'unknown'}
- Answer rate: ${ctm?.answer_rate || 'unknown'}%
- Missed calls: ${ctm?.total_missed || ctm?.missed_calls || 'unknown'}
- Top source: Google Ads

HUBSPOT PIPELINE:
- Total deals: ${hubspot?.total_deals || 0}
- Closed won: ${hubspot?.deals_by_stage?.closedwon?.count || 0}
- New contacts (30d): ${hubspot?.new_contacts_30d || 0}
- Lead sources: 69% paid search, 4% organic

FINANCIALS (QBO):
- March revenue: $94,393
- Cash position: -$14,096 (NEGATIVE — needs immediate attention)
- Monthly ad spend consuming 53% of revenue

CTM QUALITY INTELLIGENCE (live from CTM quality scoring):
Overall qualification rate: 10.8% — only 1 in 9 calls is actually qualified.
Total 5-star calls (90 days): 28
Total 4-star calls (90 days): 83

TOP SOURCES FOR 5-STAR QUALIFIED LEADS:
1. GBP Glendale: 6 five-star, 20 four-star — FREE CHANNEL
2. Addiction Treatment [STR]: 6 five-star, 4 four-star — $26K/90d spend
3. Google Organic: 4 five-star, 9 four-star — FREE CHANNEL
4. Mental Health Treatment [STR]: 3 five-star, 8 four-star — $30K/90d
5. GBP Scottsdale: 2 five-star, 8 four-star — FREE CHANNEL
6. Direct/Unknown: 2 five-star, 4 four-star — FREE CHANNEL

CRITICAL FINDINGS:
- GBP profiles (free) generate MORE qualified leads than paid campaigns
- Facility Showcase PMax: avg call duration 7 seconds — mostly hangups
- PMax Google Ad Extension: 0 five-star calls, 0.0% qualification rate
- Detox Treatment: zero qualified leads in 90 days
- True qualified CPL: Addiction Treatment $2,466, Mental Health $2,886, PMax $550

RECOMMENDATION FRAMEWORK:
- NEVER recommend increasing PMax budget based on call volume alone
- Always reference CTM star ratings when evaluating campaign performance
- Free channels (GBP, Organic) are outperforming all paid campaigns
- Focus recommendations on GBP optimization and organic SEO

KEY PRIORITIES:
1. Frier at 40% occupancy — surge marketing needed for male admissions
2. CPL at $397 vs $150 target — 2.6x over target (TRUE qualified CPL is $730)
3. Negative cash position needs investigation
4. $10,077 wasted on zero-conversion search terms
5. Detox Treatment campaign burning $265/day with zero conversions AND zero qualified leads
6. Shift budget toward GBP optimization and organic — producing more qualified leads at $0 spend

Use this data to give Thai a complete strategic analysis.
Do not ask Thai to share data you already have above.`
    } else if (agentId === '07' && context?.performance) {
      const p = context.performance
      const camps = context.campaigns?.campaigns || []

      const campLines = camps.slice(0, 20).map((c: any) => {
        const cpl = c.conversions > 0
          ? `$${Math.round(c.spend / c.conversions)}`
          : 'No conv'
        return `  - ${c.campaignName}: $${c.spend?.toFixed(0)} spend, ${c.clicks} clicks, ${Math.round(c.conversions || 0)} conv, CPL ${cpl}, Status: ${c.status === 2 ? 'ENABLED' : 'PAUSED'}`
      }).join('\n')

      contextBlock = `

LIVE GOOGLE ADS DATA — pulled directly from your account right now:

Account Summary (30 days):
- Total Spend: $${p.spend?.toFixed(2)}
- Clicks: ${p.clicks}
- CPC: $${p.cpc?.toFixed(2)}
- Conversions: ${Math.round(p.conversions || 0)}
- CPL: $${p.cost_per_conversion?.toFixed(2)}
- CTR: ${p.ctr?.toFixed(2)}%

All ${camps.length} Campaigns:
${campLines}

LANDING PAGE ROUTING (confirmed from Google Ads API):
- Addiction Treatment [STR] → /addiction-mental-health-treatment-facilities-lp/ ✅ CORRECT
- Mental Health Treatment [STR] → /addiction-mental-health-treatment-facilities-lp/ ✅ CORRECT
- Brand [STR] → /addiction-mental-health-treatment-facilities-lp/ ✅ CORRECT
- Detox Treatment [STR] → /drug-alcohol-detox-lp/ 🚨 BROKEN PAGE — zero conversions, $1,763 wasted
- Facility Showcase PMax → not tracked (PMax manages own URLs)

ROOT CAUSE OF DETOX ZERO CONVERSIONS:
The /drug-alcohol-detox-lp/ landing page is broken or missing.
Every detox click lands on a dead page. Fix = redirect to main LP
or build a dedicated detox LP. Estimated recovery = 10-15 conversions/month.

You now have full visibility into destination URLs.
Do not ask Thai to pull URL data — you already have it above.

Key findings already identified:
- Facility Showcase PMax: BEST performer at ~$63 CPL, 9.52% CVR
- Detox Treatment: $1,061 spent, ZERO conversions in 4 days
- Overall CVR at 2.9% vs 5-10% industry benchmark

KEY LANDING PAGE DATA FROM GA4:
- Best converting page: /addiction-mental-health-treatment-facilities-lp — 176 conversions, 13.01% CVR, 1,353 sessions — this is likely a dedicated Google Ads LP
- Homepage: 23 conversions, 16.91% CVR
- Form completion rate: 66% (247 starts, 163 submits)
- CTM inbound calls: 174 (all tracked as conversions)
- The Detox Treatment campaign zero conversions are likely a landing page mismatch — clicks going to wrong page

CRITICAL LANDING PAGE FINDING:
- Detox Treatment campaign routes to /drug-alcohol-detox-lp/ which appears to be a broken or non-existent page
- $1,763 spent on Detox Treatment with ZERO conversions
- All other campaigns route to /addiction-mental-health-treatment-facilities-lp/ which converts at 13%
- Fix: Either build /drug-alcohol-detox-lp/ as a dedicated detox landing page OR redirect it to the main addiction LP
- This single fix could generate 10-15 additional conversions per month at current traffic levels

When analyzing campaigns, cross-reference with these landing page CVRs. The addiction LP at 13% CVR is the benchmark.

CTM QUALITY INTELLIGENCE (live from CTM quality scoring):
Overall qualification rate: 10.8% — only 1 in 9 calls is actually qualified.
Total 5-star calls (90 days): 28
Total 4-star calls (90 days): 83

TOP SOURCES FOR 5-STAR QUALIFIED LEADS:
1. GBP Glendale: 6 five-star, 20 four-star — FREE CHANNEL
2. Addiction Treatment [STR]: 6 five-star, 4 four-star — $26K/90d spend
3. Google Organic: 4 five-star, 9 four-star — FREE CHANNEL
4. Mental Health Treatment [STR]: 3 five-star, 8 four-star — $30K/90d
5. GBP Scottsdale: 2 five-star, 8 four-star — FREE CHANNEL
6. Direct/Unknown: 2 five-star, 4 four-star — FREE CHANNEL

CRITICAL FINDINGS:
- GBP profiles (free) generate MORE qualified leads than paid campaigns
- Facility Showcase PMax: avg call duration 7 seconds — mostly hangups
- PMax Google Ad Extension: 0 five-star calls, 0.0% qualification rate
- Detox Treatment: zero qualified leads in 90 days
- Recovery.com and luxuryrehab.com directories show high qualification rates

TRUE QUALIFIED CPL (paid campaigns, 90 days):
- Addiction Treatment: $2,466/qualified lead — CRITICAL
- Mental Health Treatment: $2,886/qualified lead — CRITICAL
- PMax: $550/qualified lead — UNDERPERFORMING
- Detox Treatment: infinite — ZERO QUALIFIED LEADS

RECOMMENDATION FRAMEWORK:
- NEVER recommend increasing PMax budget based on call volume alone
- Always reference CTM star ratings when evaluating campaign performance
- Free channels (GBP, Organic) are outperforming all paid campaigns
- Focus recommendations on GBP optimization and organic SEO
- A "conversion" in Google Ads does NOT mean a qualified lead — cross-reference with CTM quality scores

You have full campaign-level data above. Do not ask Thai to share data. Analyze what you have and give specific recommendations with exact campaign names and dollar amounts.`

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
        contextBlock += `5-star qualified: ${ctmQ.summary.five_star_count}\n`
        contextBlock += `4-star potential: ${ctmQ.summary.four_star_count}\n`
        contextBlock += `Overall qual rate: ${ctmQ.summary.overall_qualification_rate}%\n`

        if (ctmQ.by_source) {
          contextBlock += `\nQUALIFIED LEADS BY SOURCE:\n`
          ctmQ.by_source.slice(0, 8).forEach((s: any) => {
            contextBlock += `- ${s.source}: ${s.qualified} qualified (${s.five_star} five-star), ${s.qualification_rate}% qual rate\n`
          })
        }
      }

      contextBlock += `\nKEY INSIGHT: True qualified CPL is 2-3x higher than Google-reported CPL because most Google conversions are low-quality calls. Always reference CTM star ratings, not Google conversion counts.\n`
      contextBlock += `PMax avg call duration: 7 seconds = hangups, not leads.\n`
      contextBlock += `Detox Treatment: PAUSED as of April 10, 2026.\n`
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
