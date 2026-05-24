import { createServiceClient } from '@/lib/supabase/server'
import { runExcelAgent } from '@/lib/agents/excelAgent'
import { runHotelAgent } from '@/lib/agents/hotelAgent'
import { runPricingAgent } from '@/lib/agents/pricingAgent'
import { runPolicyAgent } from '@/lib/agents/policyAgent'
import { runReportingAgent } from '@/lib/agents/reportingAgent'
import { runApprovalEngine } from '@/lib/core/approvalEngine'
import { runScoringEngine } from '@/lib/core/scoringEngine'
import type { Event, Hotel, PipelineInput, PipelineResult } from '@/lib/types'

export async function runPipeline(input: PipelineInput): Promise<PipelineResult> {
  const supabase = createServiceClient()

  // Step 1: Parse Excel if buffer provided
  let excelData = input.excelParseResult
  if (!excelData && input.excelBuffer) {
    excelData = await runExcelAgent(input.excelBuffer)
  }

  // Step 2: Build event record
  const eventPayload: Partial<Event> = {
    ...input.eventDetails,
    source: input.excelBuffer ? 'excel' : (input.eventDetails.source ?? 'manual'),
    status: 'pending',
    score: 0,
    risk_score: 0,
  }

  if (excelData?.eventName && !eventPayload.name) {
    eventPayload.name = excelData.eventName
  }
  if (excelData?.venueName && !eventPayload.venue_name) {
    eventPayload.venue_name = excelData.venueName
  }

  // Step 3: Upsert event
  let event: Event
  if (eventPayload.id) {
    const { data, error } = await supabase
      .from('events')
      .update({ ...eventPayload, updated_at: new Date().toISOString() })
      .eq('id', eventPayload.id)
      .select()
      .single()
    if (error) throw new Error(`Event update failed: ${error.message}`)
    event = data
  } else {
    const { data, error } = await supabase
      .from('events')
      .insert(eventPayload)
      .select()
      .single()
    if (error) throw new Error(`Event insert failed: ${error.message}`)
    event = data
  }

  // Step 4: Scrape live hotel prices
  const scrapedHotels = await runHotelAgent({
    city: event.city,
    country: event.country,
    venueName: event.venue_name,
    venueAddress: event.venue_address,
    checkIn: event.start_date,
    checkOut: event.end_date,
    hotelNames: excelData?.rows.map((r) => r.hotelName),
    requireStrictPolicy: true,
  })

  // Step 5: Compare pricing
  const pricingRows = runPricingAgent({
    eventId: event.id,
    scrapedHotels,
    excelRows: excelData?.rows ?? [],
  })

  // Step 6: Analyze booking policies (GPT-4o)
  const policyMap = await runPolicyAgent(
    pricingRows.map((h) => ({
      name: h.name,
      rawPolicy: [h.refund_policy, h.cancellation_penalty, h.no_show_policy].filter(Boolean).join(' '),
    }))
  )

  // Merge policy data into pricing rows
  const enrichedRows = pricingRows.map((h) => {
    const policy = policyMap.get(h.name)
    const analysisMissing = !policy || policy.refundPolicy === 'Analysis unavailable'
    return {
      ...h,
      refund_policy: analysisMissing ? h.refund_policy : policy.refundPolicy,
      cancellation_penalty: analysisMissing ? h.cancellation_penalty : policy.cancellationPenalty,
      no_show_policy: analysisMissing ? h.no_show_policy : policy.noShowPolicy,
    }
  })

  // Step 7: Save hotels to DB (delete old ones first)
  await supabase.from('hotels').delete().eq('event_id', event.id)
  const { data: savedHotels, error: hotelError } = await supabase
    .from('hotels')
    .insert(enrichedRows)
    .select()
  if (hotelError) throw new Error(`Hotels insert failed: ${hotelError.message}`)

  const hotels: Hotel[] = savedHotels

  // Step 8: Run approval engine
  const approvalResult = runApprovalEngine(hotels)

  // Step 9: Run scoring engine
  const scoreResult = runScoringEngine(event, hotels)

  // Step 10: Update event with score + status
  const { data: updatedEvent } = await supabase
    .from('events')
    .update({
      status: approvalResult.decision,
      score: scoreResult.profitabilityScore,
      risk_score: scoreResult.riskScore,
      updated_at: new Date().toISOString(),
    })
    .eq('id', event.id)
    .select()
    .single()

  event = updatedEvent ?? event

  // Step 11: Save approval decision
  const { data: savedDecision, error: decisionError } = await supabase
    .from('approval_decisions')
    .insert({
      event_id: event.id,
      decision: approvalResult.decision,
      hotels_cheaper_count: approvalResult.hotelsQualified,
      min_price_difference: approvalResult.minPriceDifference,
      rule_triggered: approvalResult.ruleTriggered,
      decided_by: 'system',
    })
    .select()
    .single()
  if (decisionError) throw new Error(`Approval decision failed: ${decisionError.message}`)

  // Step 12: Generate report
  const reportData = runReportingAgent({ event, hotels, decision: approvalResult, scores: scoreResult })

  const { data: savedReport, error: reportError } = await supabase
    .from('reports')
    .insert(reportData)
    .select()
    .single()
  if (reportError) throw new Error(`Report save failed: ${reportError.message}`)

  return {
    event,
    hotels,
    decision: savedDecision,
    report: savedReport,
  }
}
