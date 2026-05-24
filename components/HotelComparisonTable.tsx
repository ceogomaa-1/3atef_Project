import { TrendingDown, TrendingUp, Minus, ExternalLink, Star } from 'lucide-react'
import { formatCurrency, formatDiff, cn } from '@/lib/utils'
import type { Hotel } from '@/lib/types'

interface HotelComparisonTableProps {
  hotels: Hotel[]
}

export function HotelComparisonTable({ hotels }: HotelComparisonTableProps) {
  if (hotels.length === 0) {
    return (
      <div className="rounded-lg border border-white/8 bg-[#111] p-8 text-center text-[#888] text-sm">
        No hotel data available. Run the pipeline to fetch hotel pricing.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-white/8 bg-[#111] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/8">
            <th className="px-4 py-3 text-left text-xs font-medium text-[#888] uppercase tracking-wider">Hotel</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#888] uppercase tracking-wider">Distance</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-[#888] uppercase tracking-wider">Market</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-[#888] uppercase tracking-wider">Vendor</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-[#888] uppercase tracking-wider">Competitor</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-[#888] uppercase tracking-wider">Diff</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#888] uppercase tracking-wider">Policy Risk</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-[#888] uppercase tracking-wider">Avail</th>
          </tr>
        </thead>
        <tbody>
          {hotels.map((hotel, idx) => (
            <tr
              key={hotel.id}
              className={cn(
                'border-b border-white/5 hover:bg-white/3 transition-colors',
                hotel.is_cheaper_than_vendor && 'bg-blue-500/5',
                idx === hotels.length - 1 && 'border-b-0'
              )}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div>
                    <div className="font-medium text-[#f5f5f5] flex items-center gap-1.5">
                      {hotel.name}
                      {hotel.booking_url && (
                        <a href={hotel.booking_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 text-[#888] hover:text-blue-400" />
                        </a>
                      )}
                    </div>
                    {hotel.rating && (
                      <div className="flex items-center gap-0.5 mt-0.5">
                        <Star className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-[#888]">{hotel.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-[#888]">
                {hotel.distance_from_venue_km != null ? `${hotel.distance_from_venue_km.toFixed(1)} km` : '—'}
              </td>
              <td className="px-4 py-3 text-right font-mono text-[#f5f5f5]">
                {formatCurrency(hotel.market_price)}
              </td>
              <td className="px-4 py-3 text-right font-mono text-[#f5f5f5]">
                {formatCurrency(hotel.vendor_price)}
              </td>
              <td className="px-4 py-3 text-right font-mono text-[#888]">
                {formatCurrency(hotel.competitor_price)}
              </td>
              <td className="px-4 py-3 text-right">
                {hotel.price_difference != null ? (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 font-mono text-xs',
                      hotel.price_difference <= -4 ? 'text-green-400' : hotel.price_difference < 0 ? 'text-yellow-400' : 'text-red-400'
                    )}
                  >
                    {hotel.price_difference <= -4 ? (
                      <TrendingDown className="h-3 w-3" />
                    ) : hotel.price_difference < 0 ? (
                      <Minus className="h-3 w-3" />
                    ) : (
                      <TrendingUp className="h-3 w-3" />
                    )}
                    {formatDiff(hotel.price_difference)}
                  </span>
                ) : (
                  <span className="text-[#555]">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <PolicyRiskCell hotel={hotel} />
              </td>
              <td className="px-4 py-3 text-center">
                <span
                  className={cn(
                    'inline-block h-2 w-2 rounded-full',
                    hotel.availability ? 'bg-green-500' : 'bg-red-500'
                  )}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PolicyRiskCell({ hotel }: { hotel: Hotel }) {
  const flags: string[] = []
  const text = [hotel.refund_policy, hotel.cancellation_penalty, hotel.no_show_policy]
    .filter(Boolean)
    .join(' ')
    .toUpperCase()

  if (text.includes('NO REFUND') || text.includes('NON-REFUNDABLE')) flags.push('NR')
  if (text.includes('100%')) flags.push('100%')
  if (text.includes('NO MODIFICATION') || text.includes('NO DATE CHANGE') || text.includes('NO NAME CHANGE')) flags.push('RIGID')

  if (flags.length === 0) {
    return <span className="text-xs text-[#555]">—</span>
  }

  return (
    <div className="flex flex-wrap gap-1">
      {flags.map((f) => (
        <span key={f} className="text-[10px] font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded px-1">
          {f}
        </span>
      ))}
    </div>
  )
}
