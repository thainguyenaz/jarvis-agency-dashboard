import { NextRequest, NextResponse } from 'next/server'
import { getConversations, createConversation } from '@/lib/chat-db'
import { v4 as uuid } from 'uuid'

export async function GET(req: NextRequest) {
  const agentId = req.nextUrl.searchParams.get('agentId') || undefined
  const conversations = getConversations(agentId)
  return NextResponse.json({ conversations })
}

export async function POST(req: NextRequest) {
  const { agentId, agentName, firstMessage } = await req.json()
  const id = uuid()
  createConversation(id, agentId, agentName, firstMessage)
  return NextResponse.json({ id })
}
