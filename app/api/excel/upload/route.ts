import { NextRequest, NextResponse } from 'next/server'
import { runExcelAgent } from '@/lib/agents/excelAgent'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const eventDetailsRaw = formData.get('eventDetails') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ]
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      return NextResponse.json({ error: 'Invalid file type. Upload .xlsx, .xls, or .csv' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const parseResult = await runExcelAgent(buffer)

    // If eventDetails provided, also create an event record linked to the parse
    let eventId: string | undefined
    if (eventDetailsRaw) {
      try {
        const eventDetails = JSON.parse(eventDetailsRaw)
        const supabase = createServiceClient()

        const payload = {
          name: eventDetails.name ?? parseResult.eventName ?? 'Unnamed Event',
          type: eventDetails.type ?? 'business',
          country: eventDetails.country ?? 'Unknown',
          city: eventDetails.city ?? 'Unknown',
          venue_name: eventDetails.venue_name ?? parseResult.venueName,
          source: 'excel',
          status: 'pending',
          score: 0,
          risk_score: 0,
        }

        const { data, error } = await supabase.from('events').insert(payload).select().single()
        if (!error && data) eventId = data.id
      } catch {
        // Non-fatal — parse still returns
      }
    }

    return NextResponse.json({
      parseResult,
      eventId,
      preview: parseResult.rows.slice(0, 10),
      totalRows: parseResult.rows.length,
    })
  } catch (err) {
    console.error('[POST /api/excel/upload]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
