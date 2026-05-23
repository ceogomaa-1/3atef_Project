import type { Hotel, ApprovalResult } from '@/lib/types'

const PRICE_THRESHOLD = -4.0
const MIN_QUALIFYING_HOTELS = 3

export function runApprovalEngine(hotels: Hotel[]): ApprovalResult {
  const qualified = hotels.filter(
    (h) =>
      h.price_difference !== undefined &&
      h.price_difference !== null &&
      h.price_difference <= PRICE_THRESHOLD
  )

  const minDiff =
    qualified.length > 0
      ? Math.min(...qualified.map((h) => h.price_difference!))
      : 0

  const approved = qualified.length >= MIN_QUALIFYING_HOTELS

  return {
    decision: approved ? 'approved' : 'rejected',
    hotelsQualified: qualified.length,
    hotelsData: qualified,
    minPriceDifference: minDiff,
    ruleTriggered: approved ? '3_hotels_4_dollar_rule' : 'insufficient_cheaper_hotels',
  }
}
