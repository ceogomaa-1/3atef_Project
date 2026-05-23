import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('event_id', params.id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Report not found' }, { status: 404 })

    return NextResponse.json(data)
  } catch (err) {
    console.error('[GET /api/events/[id]/report]', err)
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 })
  }
}
