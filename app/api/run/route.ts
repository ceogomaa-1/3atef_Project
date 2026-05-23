import { NextRequest, NextResponse } from 'next/server'
import { runPipeline } from '@/lib/core/pipeline'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { eventDetails, eventId } = body

    if (!eventDetails) {
      return NextResponse.json({ error: 'eventDetails is required' }, { status: 400 })
    }

    if (eventId) {
      eventDetails.id = eventId
    }

    const result = await runPipeline({ eventDetails })
    return NextResponse.json(result)
  } catch (err) {
    console.error('[POST /api/run]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Pipeline failed' },
      { status: 500 }
    )
  }
}
