import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { ReportDocument } from '@/components/ReportDocument'
import type { Report } from '@/lib/types'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServiceClient()

    const { data: report, error } = await supabase
      .from('reports')
      .select('*, events(*)')
      .eq('id', params.id)
      .single()

    if (error || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Cast to any to bridge React.createElement return type vs @react-pdf/renderer's expected type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(ReportDocument, { report: report as Report & { events?: Record<string, unknown> } }) as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer: any = await renderToBuffer(element)

    return new NextResponse(pdfBuffer as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="report-${params.id}.pdf"`,
      },
    })
  } catch (err) {
    console.error('[GET /api/reports/[id]/export]', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
