import { NextRequest, NextResponse } from 'next/server'

const VPS_BASE = 'http://93.188.166.239:3002'

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  const url = `${VPS_BASE}/${path}${req.nextUrl.search}`
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    const auth = req.headers.get('authorization')
    if (auth) headers['Authorization'] = auth
    const res = await fetch(url, { headers })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { error: 'VPS connection failed', detail: String(err) },
      { status: 502 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  const url = `${VPS_BASE}/${path}`
  try {
    const body = await req.text()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    const auth = req.headers.get('authorization')
    if (auth) headers['Authorization'] = auth
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { error: 'VPS connection failed', detail: String(err) },
      { status: 502 }
    )
  }
}
