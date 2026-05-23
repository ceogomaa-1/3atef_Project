export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Play, MapPin, Calendar, Building2 } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/server'
import { HotelComparisonTable } from '@/components/HotelComparisonTable'
import { ApprovalStatus } from '@/components/ApprovalStatus'
import { ScoreBadge } from '@/components/ScoreBadge'
import { RiskIndicator } from '@/components/RiskIndicator'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Hotel, ApprovalDecision, Report } from '@/lib/types'

async function getEventData(id: string) {
  const supabase = createServiceClient()

  const [eventRes, hotelsRes, decisionRes, reportRes] = await Promise.all([
    supabase.from('events').select('*').eq('id', id).single(),
    supabase.from('hotels').select('*').eq('event_id', id).order('price_difference', { ascending: true, nullsFirst: false }),
    supabase.from('approval_decisions').select('*').eq('event_id', id).order('decided_at', { ascending: false }).limit(1).single(),
    supabase.from('reports').select('*').eq('event_id', id).order('generated_at', { ascending: false }).limit(1).single(),
  ])

  return {
    event: eventRes.data,
    hotels: (hotelsRes.data ?? []) as Hotel[],
    decision: decisionRes.data as ApprovalDecision | null,
    report: reportRes.data as Report | null,
  }
}

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const { event, hotels, decision, report } = await getEventData(params.id)

  if (!event) notFound()

  const cheaperCount = hotels.filter((h) => h.is_cheaper_than_vendor).length
  const avgMarket = hotels.filter((h) => h.market_price).reduce((s, h) => s + h.market_price!, 0) / (hotels.filter((h) => h.market_price).length || 1)

  return (
    <div className="p-8">
      {/* Back */}
      <Link href="/dashboard/events" className="inline-flex items-center gap-1.5 text-sm text-[#888] hover:text-[#f5f5f5] mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Events
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-[#f5f5f5]">{event.name}</h1>
            <ApprovalStatus status={event.status} size="md" />
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-[#888]">
            {event.venue_name && (
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {event.venue_name}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {event.city}, {event.country}
            </span>
            {event.start_date && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(event.start_date)}
                {event.end_date && <> – {formatDate(event.end_date)}</>}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {report && (
            <a href={`/api/reports/${report.id}/export`} download>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </a>
          )}
          <form action={`/api/run`} method="POST">
            <Button size="sm">
              <Play className="h-4 w-4 mr-2" />
              Re-run Pipeline
            </Button>
          </form>
        </div>
      </div>

      {/* Score panel */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader><CardTitle>Profitability</CardTitle></CardHeader>
          <CardContent>
            <ScoreBadge score={event.score} className="text-lg px-3 py-1" />
            <p className="text-xs text-[#888] mt-2">Higher = more savings vs vendor</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Risk Level</CardTitle></CardHeader>
          <CardContent>
            <RiskIndicator score={event.risk_score} />
            <p className="text-xs text-[#888] mt-2">Based on cancellation & refund policies</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pricing Summary</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-[#888]">Hotels analyzed</span>
              <span className="font-medium">{hotels.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">Cheaper than vendor</span>
              <span className="font-medium text-green-400">{cheaperCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">Avg market price</span>
              <span className="font-mono">{formatCurrency(avgMarket)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approval Decision */}
      {decision && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              Approval Decision
              <ApprovalStatus status={decision.decision} />
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-6 text-sm">
            <div>
              <div className="text-[#888] text-xs mb-1">Rule Triggered</div>
              <div className="font-mono text-xs text-[#f5f5f5] bg-white/5 rounded px-2 py-1">
                {decision.rule_triggered}
              </div>
            </div>
            <div>
              <div className="text-[#888] text-xs mb-1">Hotels Qualified</div>
              <div className="text-2xl font-bold tabular-nums">{decision.hotels_cheaper_count}</div>
              <div className="text-xs text-[#888]">needed ≥3 with &gt;$4 diff</div>
            </div>
            <div>
              <div className="text-[#888] text-xs mb-1">Min Price Difference</div>
              <div className="text-xl font-bold font-mono text-green-400">
                {decision.min_price_difference != null ? `$${decision.min_price_difference.toFixed(2)}` : '—'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hotel Comparison */}
      <div>
        <h2 className="text-base font-semibold text-[#f5f5f5] mb-4">
          Hotel Comparison
          <span className="ml-2 text-xs text-[#888] font-normal">
            {cheaperCount} cheaper than vendor
          </span>
        </h2>
        <HotelComparisonTable hotels={hotels} />
      </div>
    </div>
  )
}
