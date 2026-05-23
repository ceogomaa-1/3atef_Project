import Link from 'next/link'
import { FileText, Download, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ApprovalStatus } from '@/components/ApprovalStatus'
import { formatDate } from '@/lib/utils'
import { getReportPdfUrl } from '@/lib/api'
import type { Report } from '@/lib/types'

interface ReportCardProps {
  report: Report & { events?: { name: string; type: string; city: string; country: string; status: string } }
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  approved_events: 'Approved Event',
  rejected_events: 'Rejected Event',
  competitor_analysis: 'Competitor Analysis',
  risk_summary: 'Risk Summary',
}

export function ReportCard({ report }: ReportCardProps) {
  const event = report.events
  const label = REPORT_TYPE_LABELS[report.report_type] ?? report.report_type

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded bg-blue-500/10 p-2">
              <FileText className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <div className="font-medium text-[#f5f5f5] text-sm">
                {event?.name ?? 'Unknown Event'}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#888]">
                <span>{label}</span>
                {event?.status && (
                  <ApprovalStatus status={event.status as 'approved' | 'rejected' | 'pending'} size="sm" />
                )}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-[#555]">
                <Calendar className="h-3 w-3" />
                {formatDate(report.generated_at)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/dashboard/events/${report.event_id}`}>
              <Button size="sm" variant="ghost" className="text-xs">
                View
              </Button>
            </Link>
            <a href={getReportPdfUrl(report.id)} download>
              <Button size="sm" variant="outline" className="text-xs">
                <Download className="h-3 w-3 mr-1" />
                PDF
              </Button>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
