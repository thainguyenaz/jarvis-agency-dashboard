import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { performance, campaigns } = await req.json()

  const prompt = `You are Agent 07, the Google Paid Media Buyer for Desert Recovery Centers (DRC),
a luxury behavioral health treatment center in Arizona. You are in Phase 1: MONITOR AND ADVISE ONLY.

Current Google Ads Performance Data:
- Total Spend (30d): $${performance?.spend?.toFixed(2) || 'unknown'}
- Total Clicks: ${performance?.clicks || 'unknown'}
- CPC: $${performance?.cpc?.toFixed(2) || 'unknown'}
- Conversions: ${Math.round(performance?.conversions || 0)}
- CPL (Cost Per Lead): $${performance?.cost_per_conversion?.toFixed(2) || 'unknown'}

Target CPL: <$150 (current is significantly above target)
Industry benchmark CPL for behavioral health: $150-300

Campaigns: ${campaigns.length} active campaigns

Guardrails you must respect:
- Max 2 changes per campaign per week
- Max bid adjustment: 20% (safe threshold: 15%)
- Never recommend changes during learning phase
- Budget increases >30% require Thai approval
- Bid strategy changes always require Thai approval

Analyze this data and provide:
1. PERFORMANCE ASSESSMENT — Is this account healthy? What are the top 3 concerns?
2. CPL ANALYSIS — Why is CPL at this level and what's driving it?
3. TOP 3 RECOMMENDATIONS — Specific, actionable changes ranked by impact
4. GUARDRAIL FLAGS — Which recommendations require Thai approval before execution?
5. WHAT TO WATCH — What metrics to monitor this week?

Format your entire response in clean paragraphs only. No markdown tables, no bullet points, no headers with ###. Write as a senior media buyer briefing a CEO verbally.

Be direct and specific. No generic advice. Reference the actual numbers.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const data = await response.json()
    return NextResponse.json({
      analysis: data.content?.[0]?.text || 'Analysis failed'
    })
  } catch {
    return NextResponse.json({ analysis: 'Error connecting to Claude API' }, { status: 500 })
  }
}
