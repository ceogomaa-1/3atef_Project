'use client'

import { useEffect, useState } from 'react'
import { ReportCard } from '@/components/ReportCard'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getReports } from '@/lib/api'
import type { Report } from '@/lib/types'

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getReports()
      .then(setReports)
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? reports : reports.filter((r) => r.report_type === filter)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Reports</h1>
        <p className="text-sm text-[#888] mt-1">{reports.length} total reports</p>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="approved_events">Approved Events</SelectItem>
            <SelectItem value="rejected_events">Rejected Events</SelectItem>
            <SelectItem value="competitor_analysis">Competitor Analysis</SelectItem>
            <SelectItem value="risk_summary">Risk Summary</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="rounded-lg border border-white/8 bg-[#111] p-12 text-center text-[#888]">
          Loading reports…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-white/8 bg-[#111] p-12 text-center text-[#888]">
          No reports yet. Run a pipeline to generate the first report.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <ReportCard key={report.id} report={report as Report & { events?: { name: string; type: string; city: string; country: string; status: string } }} />
          ))}
        </div>
      )}
    </div>
  )
}
