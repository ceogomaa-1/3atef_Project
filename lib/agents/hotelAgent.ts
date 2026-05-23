import type { ScrapedHotel } from '@/lib/types'

interface ScrapeInput {
  city: string
  country: string
  venueName?: string
  venueAddress?: string
  checkIn?: string
  checkOut?: string
  hotelNames?: string[]
}

// Booking.com search URL builder
function buildBookingUrl(params: ScrapeInput): string {
  const { city, country, checkIn, checkOut } = params
  const dest = encodeURIComponent(`${city}, ${country}`)
  const checkin = checkIn ?? new Date().toISOString().split('T')[0]
  const checkout = checkOut ?? new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]

  return (
    `https://www.booking.com/searchresults.html?dest_id=&dest_type=city&ss=${dest}` +
    `&checkin=${checkin}&checkout=${checkout}&group_adults=1&no_rooms=1&group_children=0`
  )
}

export async function runHotelAgent(params: ScrapeInput): Promise<ScrapedHotel[]> {
  const searchUrl = buildBookingUrl(params)

  try {
    // Dynamic import so this module loads fine in environments without Playwright
    const { chromium } = await import('playwright')

    const browser = await chromium.launch({
      headless: process.env.SCRAPER_HEADLESS !== 'false',
    })

    const page = await browser.newPage()
    await page.setExtraHTTPHeaders({
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    })

    const timeout = parseInt(process.env.SCRAPER_TIMEOUT ?? '30000', 10)
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout })

    // Wait for hotel cards to appear
    await page.waitForSelector('[data-testid="property-card"]', { timeout: 15000 }).catch(() => {})

    const hotels = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid="property-card"]')
      const results: ScrapedHotel[] = []

      cards.forEach((card) => {
        try {
          const nameEl = card.querySelector('[data-testid="title"]')
          const priceEl = card.querySelector('[data-testid="price-and-discounted-price"]') ??
            card.querySelector('.bui-price-display__value') ??
            card.querySelector('[class*="price"]')
          const ratingEl = card.querySelector('[data-testid="review-score"]')
          const addressEl = card.querySelector('[data-testid="address"]')
          const linkEl = card.querySelector('a[href*="booking.com"]') ?? card.querySelector('a')

          const name = nameEl?.textContent?.trim()
          if (!name) return

          const priceText = priceEl?.textContent?.replace(/[^0-9.]/g, '') ?? ''
          const price = parseFloat(priceText)
          if (isNaN(price) || price <= 0) return

          const ratingText = ratingEl?.textContent?.match(/\d+\.?\d*/)?.[0] ?? ''
          const rating = parseFloat(ratingText) || undefined

          results.push({
            name,
            address: addressEl?.textContent?.trim(),
            rating,
            price,
            bookingUrl: (linkEl as HTMLAnchorElement)?.href,
          })
        } catch {
          // Skip malformed card
        }
      })

      return results
    }) as ScrapedHotel[]

    await browser.close()
    return hotels.slice(0, 20)
  } catch (err) {
    console.error('[hotelAgent] Playwright scrape failed:', err)
    // Return empty — pipeline will handle gracefully
    return []
  }
}
