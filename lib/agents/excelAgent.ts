import * as XLSX from 'xlsx'
import type { ExcelParseResult, ExcelRow } from '@/lib/types'

const VENDOR_PRICE_KEYS = ['vendor price', 'vendor_price', 'vendorprice', 'our price', 'contract price']
const COMPETITOR_PRICE_KEYS = ['competitor price', 'competitor_price', 'market price', 'competition']
const HOTEL_NAME_KEYS = ['hotel name', 'hotel_name', 'hotelname', 'hotel', 'property']
const ROOM_TYPE_KEYS = ['room type', 'room_type', 'roomtype', 'room']
const ADDRESS_KEYS = ['address', 'location']

function normalizeKey(key: string): string {
  return key.toLowerCase().trim()
}

function findColumn(headers: string[], candidates: string[]): number {
  for (const candidate of candidates) {
    const idx = headers.findIndex((h) => normalizeKey(h).includes(candidate))
    if (idx !== -1) return idx
  }
  return -1
}

export async function runExcelAgent(buffer: Buffer): Promise<ExcelParseResult> {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]

  const rawData: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as string[][]

  if (rawData.length < 2) {
    return { rows: [] }
  }

  // Try to find event metadata in first few rows
  let eventName: string | undefined
  let venueName: string | undefined
  let eventDates: string | undefined
  let headerRowIdx = 0

  for (let i = 0; i < Math.min(5, rawData.length); i++) {
    const rowStr = rawData[i].join(' ').toLowerCase()
    if (rowStr.includes('event') && !eventName) {
      const match = rawData[i].find((cell) => typeof cell === 'string' && cell.length > 3)
      if (match) eventName = String(match)
    }
    if (rowStr.includes('venue') && !venueName) {
      const match = rawData[i].find((cell) => typeof cell === 'string' && cell.length > 3)
      if (match) venueName = String(match)
    }
    if ((rowStr.includes('date') || rowStr.includes('2024') || rowStr.includes('2025')) && !eventDates) {
      const match = rawData[i].find((cell) => typeof cell === 'string' && cell.length > 3)
      if (match) eventDates = String(match)
    }
    // Header row has "hotel" or "price" in it
    if (rowStr.includes('hotel') || rowStr.includes('price') || rowStr.includes('vendor')) {
      headerRowIdx = i
      break
    }
  }

  const headers = rawData[headerRowIdx].map(String)
  const hotelCol = findColumn(headers, HOTEL_NAME_KEYS)
  const vendorCol = findColumn(headers, VENDOR_PRICE_KEYS)
  const competitorCol = findColumn(headers, COMPETITOR_PRICE_KEYS)
  const roomCol = findColumn(headers, ROOM_TYPE_KEYS)
  const addressCol = findColumn(headers, ADDRESS_KEYS)

  const rows: ExcelRow[] = []

  for (let i = headerRowIdx + 1; i < rawData.length; i++) {
    const row = rawData[i]
    if (!row || row.every((cell) => cell === '' || cell === null || cell === undefined)) continue

    const hotelName = hotelCol >= 0 ? String(row[hotelCol] ?? '').trim() : ''
    if (!hotelName) continue

    const vendorPrice = vendorCol >= 0 ? parseFloat(String(row[vendorCol] ?? '0')) : 0
    const competitorPrice = competitorCol >= 0 ? parseFloat(String(row[competitorCol] ?? '0')) || undefined : undefined
    const roomType = roomCol >= 0 ? String(row[roomCol] ?? '').trim() || undefined : undefined
    const address = addressCol >= 0 ? String(row[addressCol] ?? '').trim() || undefined : undefined

    rows.push({
      hotelName,
      vendorPrice: isNaN(vendorPrice) ? 0 : vendorPrice,
      competitorPrice: competitorPrice && isNaN(competitorPrice) ? undefined : competitorPrice,
      roomType,
      address,
    })
  }

  return { rows, eventName, venueName, eventDates }
}
