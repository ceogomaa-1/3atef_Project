import type { Event, Hotel, ScoreResult } from '@/lib/types'

const RISK_WEIGHTS: Record<string, number> = {
  'NO REFUND': 30,
  '100% PENALTY': 25,
  'NO MODIFICATIONS': 20,
  'NON-REFUNDABLE': 30,
  'NO DATE CHANGE': 15,
}

const EVENT_TYPE_WEIGHTS: Record<string, number> = {
  medical: 1.3,
  pharma: 1.2,
  tech: 1.0,
  industrial: 1.0,
  business: 0.9,
}

function calcRiskScore(hotels: Hotel[]): { total: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {}
  let total = 0

  for (const hotel of hotels) {
    const policyText = [
      hotel.refund_policy ?? '',
      hotel.cancellation_penalty ?? '',
      hotel.no_show_policy ?? '',
    ]
      .join(' ')
      .toUpperCase()

    for (const [keyword, weight] of Object.entries(RISK_WEIGHTS)) {
      if (policyText.includes(keyword)) {
        breakdown[keyword] = (breakdown[keyword] ?? 0) + weight
        total += weight
      }
    }

    if (!hotel.availability) {
      breakdown['UNAVAILABLE'] = (breakdown['UNAVAILABLE'] ?? 0) + 20
      total += 20
    }
  }

  return { total, breakdown }
}

function calcProfitabilityScore(event: Event, hotels: Hotel[]): { score: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {}

  const diffs = hotels
    .filter((h) => h.price_difference !== undefined && h.price_difference !== null)
    .map((h) => h.price_difference!)

  if (diffs.length === 0) return { score: 0, breakdown }

  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length
  // Normalize: diff of -20 or more = 100 points; 0 or positive = 0 points
  const diffScore = Math.max(0, Math.min(100, (-avgDiff / 20) * 100))
  breakdown['avg_price_difference'] = diffScore

  const typeWeight = EVENT_TYPE_WEIGHTS[event.type] ?? 1.0
  const typeBonus = (typeWeight - 1.0) * 20
  breakdown['event_type_bonus'] = typeBonus

  const availableRatio = hotels.filter((h) => h.availability).length / hotels.length
  const availScore = availableRatio * 20
  breakdown['availability_factor'] = availScore

  const competitorDiffs = hotels
    .filter((h) => h.competitor_price !== undefined && h.vendor_price !== undefined)
    .map((h) => h.vendor_price! - h.competitor_price!)
  const competitorBonus =
    competitorDiffs.length > 0
      ? Math.max(0, Math.min(10, (competitorDiffs.reduce((a, b) => a + b, 0) / competitorDiffs.length) * 2))
      : 0
  breakdown['competitor_gap'] = competitorBonus

  const raw = diffScore + typeBonus + availScore + competitorBonus
  const score = Math.max(0, Math.min(100, raw))

  return { score: Math.round(score * 10) / 10, breakdown }
}

export function runScoringEngine(event: Event, hotels: Hotel[]): ScoreResult {
  const { total: riskScore, breakdown: riskBreakdown } = calcRiskScore(hotels)
  const { score: profitabilityScore, breakdown: profBreakdown } = calcProfitabilityScore(event, hotels)

  return {
    profitabilityScore,
    riskScore,
    breakdown: { ...riskBreakdown, ...profBreakdown },
  }
}
