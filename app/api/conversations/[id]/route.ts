import { NextRequest, NextResponse } from 'next/server'

async function getDb() {
  try {
    const mod = await import('@/lib/chat-db')
    return { getMessages: mod.getMessages, saveMessage: mod.saveMessage, deleteConversation: mod.deleteConversation, available: true }
  } catch {
    return { available: false } as const
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = await getDb()
  if (!db.available) return NextResponse.json({ messages: [] })
  try {
    const messages = db.getMessages(params.id)
    return NextResponse.json({ messages })
  } catch {
    return NextResponse.json({ messages: [] })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = await getDb()
  if (!db.available) return NextResponse.json({ id: `temp-${Date.now()}`, stored: false })
  try {
    const { role, content } = await req.json()
    const { v4: uuid } = await import('uuid')
    const id = uuid()
    db.saveMessage(id, params.id, role, content)
    return NextResponse.json({ id, stored: true })
  } catch {
    return NextResponse.json({ id: `temp-${Date.now()}`, stored: false })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = await getDb()
  if (!db.available) return NextResponse.json({ deleted: false })
  try {
    db.deleteConversation(params.id)
    return NextResponse.json({ deleted: true })
  } catch {
    return NextResponse.json({ deleted: false })
  }
}
