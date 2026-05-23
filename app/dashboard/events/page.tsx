'use client'

import { useEffect, useState } from 'react'
import { Filter } from 'lucide-react'
import { EventTable } from '@/components/EventTable'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { getEvents } from '@/lib/api'
import type { Event } from '@/lib/types'

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [filtered, setFiltered] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    try {
      const data = await getEvents()
      setEvents(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let result = events
    if (statusFilter !== 'all') result = result.filter((e) => e.status === statusFilter)
    if (typeFilter !== 'all') result = result.filter((e) => e.type === typeFilter)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.city.toLowerCase().includes(q) ||
          e.country.toLowerCase().includes(q)
      )
    }
    setFiltered(result)
  }, [events, statusFilter, typeFilter, search])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Events</h1>
        <p className="text-sm text-[#888] mt-1">{events.length} total events</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <Filter className="h-4 w-4 text-[#555]" />
        <Input
          placeholder="Search events…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-56"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="medical">Medical</SelectItem>
            <SelectItem value="pharma">Pharma</SelectItem>
            <SelectItem value="tech">Tech</SelectItem>
            <SelectItem value="industrial">Industrial</SelectItem>
            <SelectItem value="business">Business</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="rounded-lg border border-white/8 bg-[#111] p-12 text-center text-[#888]">
          Loading events…
        </div>
      ) : (
        <EventTable events={filtered} onRefresh={load} />
      )}
    </div>
  )
}
