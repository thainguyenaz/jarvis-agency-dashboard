import { NextRequest, NextResponse } from 'next/server'
import { getMessages, saveMessage, deleteConversation } from '@/lib/chat-db'
import { v4 as uuid } from 'uuid'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const messages = getMessages(params.id)
  return NextResponse.json({ messages })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { role, content } = await req.json()
  const id = uuid()
  saveMessage(id, params.id, role, content)
  return NextResponse.json({ id })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  deleteConversation(params.id)
  return NextResponse.json({ deleted: true })
}
