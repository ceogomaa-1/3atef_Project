'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Play, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ApprovalStatus } from '@/components/ApprovalStatus'
import { ScoreBadge } from '@/components/ScoreBadge'
import { RiskIndicator } from '@/components/RiskIndicator'
import { formatDate } from '@/lib/utils'
import { triggerPipeline } from '@/lib/api'
import type { Event } from '@/lib/types'

interface EventTableProps {
  events: Event[]
  onRefresh?: () => void
}

export function EventTable({ events, onRefresh }: EventTableProps) {
  const [running, setRunning] = useState<string | null>(null)

  async function handleRun(event: Event) {
    setRunning(event.id)
    try {
      await triggerPipeline({ eventDetails: event, eventId: event.id })
      onRefresh?.()
    } catch (err) {
      alert(`Pipeline failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setRunning(null)
    }
  }

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-white/8 bg-[#111] p-12 text-center text-[#888]">
        No events found. Upload an Excel file or add an event to get started.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-white/8 bg-[#111] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/8">
            <th className="px-4 py-3 text-left text-xs font-medium text-[#888] uppercase tracking-wider">Event</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#888] uppercase tracking-wider">Type</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#888] uppercase tracking-wider">Dates</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#888] uppercase tracking-wider">Location</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#888] uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#888] uppercase tracking-wider">Score</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#888] uppercase tracking-wider">Risk</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-[#888] uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event, idx) => (
            <tr
              key={event.id}
              className={`border-b border-white/5 hover:bg-white/3 transition-colors ${idx === events.length - 1 ? 'border-b-0' : ''}`}
            >
              <td className="px-4 py-3">
                <div className="font-medium text-[#f5f5f5] truncate max-w-[200px]">{event.name}</div>
                <div className="text-xs text-[#888] mt-0.5">{event.venue_name}</div>
              </td>
              <td className="px-4 py-3">
                <span className="capitalize text-[#aaa] text-xs">{event.type}</span>
              </td>
              <td className="px-4 py-3 text-[#aaa] text-xs whitespace-nowrap">
                {formatDate(event.start_date)}
                {event.end_date && <> – {formatDate(event.end_date)}</>}
              </td>
              <td className="px-4 py-3 text-[#aaa] text-xs">
                {event.city}, {event.country}
              </td>
              <td className="px-4 py-3">
                <ApprovalStatus status={event.status} />
              </td>
              <td className="px-4 py-3">
                <ScoreBadge score={event.score} />
              </td>
              <td className="px-4 py-3">
                <RiskIndicator score={event.risk_score} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRun(event)}
                    disabled={running === event.id}
                    className="text-xs"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    {running === event.id ? 'Running…' : 'Run'}
                  </Button>
                  <Link href={`/dashboard/events/${event.id}`}>
                    <Button size="icon" variant="ghost">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
