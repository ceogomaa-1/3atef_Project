import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get('event_id')

    if (!eventId) {
      return NextResponse.json({ error: 'event_id is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .eq('event_id', eventId)
      .order('price_difference', { ascending: true, nullsFirst: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    console.error('[GET /api/hotels]', err)
    return NextResponse.json({ error: 'Failed to fetch hotels' }, { status: 500 })
  }
}
