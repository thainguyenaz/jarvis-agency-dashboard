import { NextRequest, NextResponse } from 'next/server'

// Gracefully handle environments where SQLite is unavailable
async function getDb() {
  try {
    const mod = await import('@/lib/chat-db')
    return { getConversations: mod.getConversations, createConversation: mod.createConversation, available: true }
  } catch {
    return { available: false } as const
  }
}

export async function GET(req: NextRequest) {
  const db = await getDb()
  if (!db.available) {
    return NextResponse.json({ conversations: [], error: 'History unavailable in this environment' })
  }
  try {
    const agentId = req.nextUrl.searchParams.get('agentId') || undefined
    const conversations = db.getConversations(agentId)
    return NextResponse.json({ conversations })
  } catch {
    return NextResponse.json({ conversations: [] })
  }
}

export async function POST(req: NextRequest) {
  const db = await getDb()
  if (!db.available) {
    return NextResponse.json({ id: `temp-${Date.now()}`, stored: false })
  }
  try {
    const { agentId, agentName, firstMessage } = await req.json()
    const { v4: uuid } = await import('uuid')
    const id = uuid()
    db.createConversation(id, agentId, agentName, firstMessage)
    return NextResponse.json({ id, stored: true })
  } catch {
    return NextResponse.json({ id: `temp-${Date.now()}`, stored: false })
  }
}
