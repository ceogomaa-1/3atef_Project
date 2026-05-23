'use client'

import { useEffect, useState } from 'react'
import { HotelComparisonTable } from '@/components/HotelComparisonTable'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getEvents, getHotels } from '@/lib/api'
import type { Event, Hotel } from '@/lib/types'

export default function HotelsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getEvents().then((data) => {
      setEvents(data)
      if (data.length > 0) setSelectedEventId(data[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selectedEventId) return
    setLoading(true)
    getHotels(selectedEventId)
      .then(setHotels)
      .finally(() => setLoading(false))
  }, [selectedEventId])

  const selectedEvent = events.find((e) => e.id === selectedEventId)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Hotel Comparison</h1>
        <p className="text-sm text-[#888] mt-1">Live market vs vendor pricing by event</p>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm text-[#888]">Event:</span>
        <Select value={selectedEventId} onValueChange={setSelectedEventId}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Select an event" />
          </SelectTrigger>
          <SelectContent>
            {events.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name} — {e.city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedEvent && (
          <span className="text-xs text-[#888]">
            {hotels.length} hotels · {hotels.filter((h) => h.is_cheaper_than_vendor).length} cheaper than vendor
          </span>
        )}
      </div>

      {loading ? (
        <div className="rounded-lg border border-white/8 bg-[#111] p-12 text-center text-[#888]">
          Loading hotel data…
        </div>
      ) : (
        <HotelComparisonTable hotels={hotels} />
      )}
    </div>
  )
}
