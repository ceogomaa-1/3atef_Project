import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(req.url)

    let query = supabase.from('events').select('*').order('created_at', { ascending: false })

    const status = searchParams.get('status')
    if (status && status !== 'all') query = query.eq('status', status)

    const type = searchParams.get('type')
    if (type) query = query.eq('type', type)

    const from = searchParams.get('from')
    if (from) query = query.gte('start_date', from)

    const to = searchParams.get('to')
    if (to) query = query.lte('end_date', to)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json(data)
  } catch (err) {
    console.error('[GET /api/events]', err)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await req.json()

    const { data, error } = await supabase.from('events').insert(body).select().single()
    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('[POST /api/events]', err)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
