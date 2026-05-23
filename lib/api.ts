import type { Event, Hotel, Report, ApprovalDecision, PipelineResult } from '@/lib/types'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? ''

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText)
    throw new Error(`API ${path} failed (${res.status}): ${err}`)
  }
  return res.json() as Promise<T>
}

// Events
export const getEvents = () => apiFetch<Event[]>('/api/events')
export const getEvent = (id: string) => apiFetch<Event>(`/api/events/${id}`)
export const getEventReport = (id: string) => apiFetch<Report>(`/api/events/${id}/report`)

// Hotels
export const getHotels = (eventId: string) => apiFetch<Hotel[]>(`/api/hotels?event_id=${eventId}`)

// Reports
export const getReports = () => apiFetch<Report[]>('/api/reports')
export const getReportPdfUrl = (id: string) => `${BASE}/api/reports/${id}/export`

// Pipeline
export const triggerPipeline = (body: {
  eventDetails: Partial<Event>
  eventId?: string
}) =>
  apiFetch<PipelineResult>('/api/run', {
    method: 'POST',
    body: JSON.stringify(body),
  })

// Excel upload — multipart
export async function uploadExcel(
  file: File,
  eventDetails?: Partial<Event>
): Promise<{ parseResult: unknown; eventId?: string }> {
  const form = new FormData()
  form.append('file', file)
  if (eventDetails) form.append('eventDetails', JSON.stringify(eventDetails))

  const res = await fetch(`${BASE}/api/excel/upload`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText)
    throw new Error(`Upload failed (${res.status}): ${err}`)
  }
  return res.json()
}

// Approval decisions
export const getApprovalDecision = (eventId: string) =>
  apiFetch<ApprovalDecision>(`/api/events/${eventId}/decision`)
