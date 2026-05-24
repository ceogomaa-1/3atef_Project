import type { ExcelRow, ScrapedHotel, Hotel } from '@/lib/types'

interface PricingInput {
  eventId: string
  scrapedHotels: ScrapedHotel[]
  excelRows: ExcelRow[]
}

function matchHotel(scraped: ScrapedHotel, excel: ExcelRow): boolean {
  const a = scraped.name.toLowerCase()
  const b = excel.hotelName.toLowerCase()
  // Exact or partial match on first significant word
  const aWords = a.split(/\s+/).filter((w) => w.length > 3)
  return aWords.some((word) => b.includes(word)) || b.split(/\s+/).some((w) => w.length > 3 && a.includes(w))
}

export function enrichExcelRowsWithScrapedPrices(
  excelRows: ExcelRow[],
  scrapedHotels: ScrapedHotel[]
): ExcelRow[] {
  return excelRows.map((row) => {
    const match = scrapedHotels.find((hotel) => matchHotel(hotel, row))
    if (!match) return row

    return {
      ...row,
      competitorPrice: match.price,
      roomType: match.roomType ?? row.roomType,
      address: row.address ?? match.address,
      bookingUrl: match.bookingUrl,
      bookingPolicy: match.rawPolicy ?? match.refundPolicy,
    }
  })
}

export function runPricingAgent(input: PricingInput): Omit<Hotel, 'id' | 'collected_at'>[] {
  const { eventId, scrapedHotels, excelRows } = input
  const results: Omit<Hotel, 'id' | 'collected_at'>[] = []

  for (const scraped of scrapedHotels) {
    const excelMatch = excelRows.find((row) => matchHotel(scraped, row))

    const marketPrice = scraped.price
    const vendorPrice = excelMatch?.vendorPrice ?? undefined
    const competitorPrice = excelMatch?.competitorPrice ?? undefined
    const priceDiff =
      marketPrice !== undefined && vendorPrice !== undefined
        ? parseFloat((marketPrice - vendorPrice).toFixed(2))
        : undefined

    results.push({
      event_id: eventId,
      name: scraped.name,
      address: scraped.address ?? excelMatch?.address,
      distance_from_venue_km: scraped.distanceKm,
      rating: scraped.rating,
      room_type: scraped.roomType ?? excelMatch?.roomType,
      market_price: marketPrice,
      vendor_price: vendorPrice,
      competitor_price: competitorPrice,
      price_difference: priceDiff,
      is_cheaper_than_vendor: priceDiff !== undefined ? priceDiff <= -4.0 : false,
      refund_policy: scraped.refundPolicy,
      cancellation_penalty: scraped.cancellationPenalty,
      no_show_policy: scraped.noShowPolicy,
      availability: true,
      booking_url: scraped.bookingUrl,
    })
  }

  // Add excel-only rows that weren't in scraped results (vendor-only data)
  for (const row of excelRows) {
    const alreadyIncluded = results.some((r) =>
      r.name.toLowerCase().includes(row.hotelName.toLowerCase().split(' ')[0])
    )
    if (!alreadyIncluded) {
      results.push({
        event_id: eventId,
        name: row.hotelName,
        address: row.address,
        distance_from_venue_km: undefined,
        rating: undefined,
        room_type: row.roomType,
        market_price: undefined,
        vendor_price: row.vendorPrice,
        competitor_price: row.competitorPrice,
        price_difference: undefined,
        is_cheaper_than_vendor: false,
        refund_policy: row.bookingPolicy,
        cancellation_penalty: row.bookingPolicy ? 'Charge 100% of the booking amount.' : undefined,
        no_show_policy: row.bookingPolicy ? 'Hotel will invoice the total amount of this booking in case of no show.' : undefined,
        availability: true,
        booking_url: undefined,
      })
    }
  }

  return results
}
