import { NextRequest, NextResponse } from 'next/server'
import { runExcelAgent } from '@/lib/agents/excelAgent'
import { runHotelAgent } from '@/lib/agents/hotelAgent'
import { enrichExcelRowsWithScrapedPrices } from '@/lib/agents/pricingAgent'
import { createServiceClient } from '@/lib/supabase/server'
import type { Event } from '@/lib/types'

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
    let eventDetails: Partial<Event> | undefined

    if (eventDetailsRaw) {
      try {
        eventDetails = JSON.parse(eventDetailsRaw)
      } catch {
        eventDetails = undefined
      }
    }

    if (eventDetails?.city && eventDetails?.country && parseResult.rows.length > 0) {
      const scrapedHotels = await runHotelAgent({
        city: eventDetails.city,
        country: eventDetails.country,
        venueName: eventDetails.venue_name ?? parseResult.venueName,
        checkIn: eventDetails.start_date,
        checkOut: eventDetails.end_date,
        hotelNames: parseResult.rows.map((row) => row.hotelName),
        requireStrictPolicy: true,
      })

      parseResult.rows = enrichExcelRowsWithScrapedPrices(parseResult.rows, scrapedHotels)
    }

    // If eventDetails provided, also create an event record linked to the parse
    let eventId: string | undefined
    if (eventDetails) {
      try {
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
