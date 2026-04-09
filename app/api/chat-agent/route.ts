import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { message, context, history } = await req.json()

  const systemPrompt = `You are Agent 07, the Google Paid Media Buyer for Desert Recovery Centers (DRC).
You are advising Thai Nguyen (CEO) on Google Ads strategy.
Current data context: ${JSON.stringify(context)}
You are in Phase 1: MONITOR AND ADVISE ONLY. You cannot make changes.
All recommendations must flag if Thai approval is required.
Guardrails: max 2 changes/campaign/week, max 20% bid adjustment,
budget increases >30% need approval, no changes during learning phase.
Be direct, specific, and reference actual numbers. Keep responses concise.`

  const messages = [
    ...history.map((h: any) => ({
      role: h.role === 'user' ? 'user' : 'assistant',
      content: h.content
    })),
    { role: 'user', content: message }
  ]

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
        max_tokens: 800,
        system: systemPrompt,
        messages
      })
    })

    const data = await response.json()
    return NextResponse.json({
      reply: data.content?.[0]?.text || 'No response'
    })
  } catch {
    return NextResponse.json({ reply: 'Agent connection failed' }, { status: 500 })
  }
}
