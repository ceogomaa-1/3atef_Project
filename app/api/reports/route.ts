import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')

    let query = supabase
      .from('reports')
      .select('*, events(name, type, city, country, status)')
      .order('generated_at', { ascending: false })

    if (type) query = query.eq('report_type', type)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json(data)
  } catch (err) {
    console.error('[GET /api/reports]', err)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
