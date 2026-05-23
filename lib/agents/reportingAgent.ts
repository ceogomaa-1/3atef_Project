import type { Event, Hotel, ApprovalResult, ScoreResult, Report } from '@/lib/types'

interface ReportInput {
  event: Event
  hotels: Hotel[]
  decision: ApprovalResult
  scores: ScoreResult
}

export function runReportingAgent(input: ReportInput): Omit<Report, 'id' | 'generated_at' | 'pdf_url'> {
  const { event, hotels, decision, scores } = input

  const cheaperHotels = hotels.filter((h) => h.is_cheaper_than_vendor)
  const avgMarket =
    hotels.filter((h) => h.market_price).reduce((sum, h) => sum + (h.market_price ?? 0), 0) /
    (hotels.filter((h) => h.market_price).length || 1)

  const avgVendor =
    hotels.filter((h) => h.vendor_price).reduce((sum, h) => sum + (h.vendor_price ?? 0), 0) /
    (hotels.filter((h) => h.vendor_price).length || 1)

  const content = {
    summary: {
      eventName: event.name,
      eventType: event.type,
      location: `${event.city}, ${event.country}`,
      venue: event.venue_name,
      dates: `${event.start_date ?? 'TBD'} – ${event.end_date ?? 'TBD'}`,
      decision: decision.decision,
      ruleTriggered: decision.ruleTriggered,
    },
    pricing: {
      totalHotelsAnalyzed: hotels.length,
      hotelsWithMarketPrice: hotels.filter((h) => h.market_price).length,
      hotelsWithVendorPrice: hotels.filter((h) => h.vendor_price).length,
      hotelsCheaperThanVendor: cheaperHotels.length,
      averageMarketPrice: parseFloat(avgMarket.toFixed(2)),
      averageVendorPrice: parseFloat(avgVendor.toFixed(2)),
      averageSavingsOpportunity: parseFloat((avgMarket - avgVendor).toFixed(2)),
    },
    approval: {
      decision: decision.decision,
      hotelsQualified: decision.hotelsQualified,
      minPriceDifference: decision.minPriceDifference,
      ruleTriggered: decision.ruleTriggered,
      qualifyingHotels: cheaperHotels.map((h) => ({
        name: h.name,
        marketPrice: h.market_price,
        vendorPrice: h.vendor_price,
        difference: h.price_difference,
      })),
    },
    scores: {
      profitabilityScore: scores.profitabilityScore,
      riskScore: scores.riskScore,
      breakdown: scores.breakdown,
    },
    hotels: hotels.map((h) => ({
      name: h.name,
      distance: h.distance_from_venue_km,
      rating: h.rating,
      marketPrice: h.market_price,
      vendorPrice: h.vendor_price,
      competitorPrice: h.competitor_price,
      priceDifference: h.price_difference,
      isCheaper: h.is_cheaper_than_vendor,
      availability: h.availability,
      refundPolicy: h.refund_policy,
      cancellationPenalty: h.cancellation_penalty,
      noShowPolicy: h.no_show_policy,
    })),
    generatedAt: new Date().toISOString(),
  }

  const reportType = decision.decision === 'approved' ? 'approved_events' : 'rejected_events'

  return {
    event_id: event.id,
    report_type: reportType,
    content,
  }
}
