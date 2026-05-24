export type EventStatus = 'pending' | 'approved' | 'rejected'
export type EventType = 'medical' | 'pharma' | 'tech' | 'industrial' | 'business'
export type ReportType = 'approved_events' | 'rejected_events' | 'competitor_analysis' | 'risk_summary'
export type PriceSource = 'booking.com' | 'expedia' | 'vendor' | 'competitor'
export type DecisionBy = 'system' | 'manual'

export interface Event {
  id: string
  name: string
  type: EventType
  country: string
  city: string
  venue_name?: string
  venue_address?: string
  start_date?: string
  end_date?: string
  source: 'excel' | 'manual' | 'web_scrape'
  status: EventStatus
  score: number
  risk_score: number
  created_at: string
  updated_at: string
}

export interface Hotel {
  id: string
  event_id: string
  name: string
  address?: string
  distance_from_venue_km?: number
  rating?: number
  room_type?: string
  market_price?: number
  vendor_price?: number
  competitor_price?: number
  price_difference?: number
  is_cheaper_than_vendor: boolean
  refund_policy?: string
  cancellation_penalty?: string
  no_show_policy?: string
  availability: boolean
  booking_url?: string
  collected_at: string
}

export interface PriceSnapshot {
  id: string
  hotel_id: string
  price: number
  source: PriceSource
  captured_at: string
}

export interface ApprovalDecision {
  id: string
  event_id: string
  decision: 'approved' | 'rejected'
  hotels_cheaper_count: number
  min_price_difference?: number
  rule_triggered: string
  decided_at: string
  decided_by: DecisionBy
}

export interface Report {
  id: string
  event_id: string
  report_type: ReportType
  content?: Record<string, unknown>
  pdf_url?: string
  generated_at: string
}

export interface ApprovalResult {
  decision: 'approved' | 'rejected'
  hotelsQualified: number
  hotelsData: Hotel[]
  minPriceDifference: number
  ruleTriggered: string
}

export interface ScoreResult {
  profitabilityScore: number
  riskScore: number
  breakdown: Record<string, number>
}

export interface ExcelRow {
  hotelName: string
  vendorPrice: number
  competitorPrice?: number
  roomType?: string
  address?: string
  bookingUrl?: string
  bookingPolicy?: string
}

export interface ExcelParseResult {
  rows: ExcelRow[]
  eventName?: string
  eventDates?: string
  venueName?: string
}

export interface PipelineInput {
  eventDetails: Partial<Event>
  excelBuffer?: Buffer
  excelParseResult?: ExcelParseResult
}

export interface PipelineResult {
  event: Event
  hotels: Hotel[]
  decision: ApprovalDecision
  report: Report
}

export interface ScrapedHotel {
  name: string
  address?: string
  distanceKm?: number
  rating?: number
  roomType?: string
  price: number
  bookingUrl?: string
  refundPolicy?: string
  cancellationPenalty?: string
  noShowPolicy?: string
  rawPolicy?: string
}

export interface PolicyAnalysis {
  refundPolicy: string
  cancellationPenalty: string
  noShowPolicy: string
  riskFlags: string[]
}
