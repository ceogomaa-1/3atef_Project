export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/server'
import { EventTable } from '@/components/EventTable'
import { ApprovalStatus } from '@/components/ApprovalStatus'
import type { Event } from '@/lib/types'

async function getStats() {
  const supabase = createServiceClient()
  const { data: events } = await supabase.from('events').select('status, score, risk_score')

  if (!events) return { total: 0, approved: 0, rejected: 0, pending: 0, avgScore: 0 }

  const approved = events.filter((e) => e.status === 'approved').length
  const rejected = events.filter((e) => e.status === 'rejected').length
  const pending = events.filter((e) => e.status === 'pending').length
  const avgScore =
    events.length > 0
      ? events.reduce((s, e) => s + (e.score ?? 0), 0) / events.length
      : 0

  return { total: events.length, approved, rejected, pending, avgScore }
}

async function getRecentEvents(): Promise<Event[]> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('events')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(10)
  return data ?? []
}

export default async function DashboardPage() {
  const [stats, events] = await Promise.all([getStats(), getRecentEvents()])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Dashboard</h1>
        <p className="text-sm text-[#888] mt-1">AI-powered event & hotel intelligence</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Events" value={stats.total} />
        <StatCard label="Approved" value={stats.approved} accent="blue" />
        <StatCard label="Rejected" value={stats.rejected} accent="red" />
        <StatCard label="Avg Score" value={`${stats.avgScore.toFixed(0)}`} subtitle="/100" />
      </div>

      {/* Recent Events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#f5f5f5]">Recent Events</h2>
          <div className="flex gap-3 text-sm text-[#888]">
            <span>
              <ApprovalStatus status="approved" size="sm" /> {stats.approved}
            </span>
            <span>
              <ApprovalStatus status="rejected" size="sm" /> {stats.rejected}
            </span>
            <span>
              <ApprovalStatus status="pending" size="sm" /> {stats.pending}
            </span>
          </div>
        </div>
        <EventTable events={events} />
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  subtitle,
  accent,
}: {
  label: string
  value: string | number
  subtitle?: string
  accent?: 'blue' | 'red'
}) {
  const valueColor = accent === 'blue' ? 'text-blue-400' : accent === 'red' ? 'text-red-400' : 'text-[#f5f5f5]'
  return (
    <div className="rounded-lg border border-white/8 bg-[#111] p-5">
      <div className="text-xs text-[#888] mb-2">{label}</div>
      <div className={`text-3xl font-bold tabular-nums ${valueColor}`}>
        {value}
        {subtitle && <span className="text-base font-normal text-[#888] ml-1">{subtitle}</span>}
      </div>
    </div>
  )
}
