'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadDropzone } from '@/components/UploadDropzone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { triggerPipeline } from '@/lib/api'
import type { Event, ExcelRow } from '@/lib/types'

interface UploadResult {
  parseResult: { rows: ExcelRow[]; eventName?: string; venueName?: string }
  eventId?: string
  preview: ExcelRow[]
  totalRows: number
}

export default function UploadPage() {
  const router = useRouter()
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [running, setRunning] = useState(false)
  const [eventName, setEventName] = useState('')
  const [eventType, setEventType] = useState('medical')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')

  const eventDetails: Partial<Event> = {
    name: eventName,
    type: eventType as Event['type'],
    city,
    country,
  }

  async function handleRun() {
    if (!uploadResult?.eventId) return
    setRunning(true)
    try {
      const result = await triggerPipeline({
        eventDetails: {
          id: uploadResult.eventId,
          name: eventName || uploadResult.parseResult.eventName,
          type: eventType as Event['type'],
          city,
          country,
        },
        eventId: uploadResult.eventId,
        excelParseResult: uploadResult.parseResult,
      })
      router.push(`/dashboard/events/${result.event.id}`)
    } catch (err) {
      alert(`Pipeline failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Upload Excel</h1>
        <p className="text-sm text-[#888] mt-1">
          Upload your vendor hotel pricing sheet to start the intelligence pipeline
        </p>
      </div>

      {/* Event metadata form */}
      <Card className="mb-6">
        <CardHeader><CardTitle>Event Details (Optional)</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-[#888]">Event Name</label>
            <Input placeholder="e.g. Arab Health 2025" value={eventName} onChange={(e) => setEventName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-[#888]">Event Type</label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="pharma">Pharma</SelectItem>
                <SelectItem value="tech">Tech</SelectItem>
                <SelectItem value="industrial">Industrial</SelectItem>
                <SelectItem value="business">Business</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-[#888]">City</label>
            <Input placeholder="e.g. Dubai" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-[#888]">Country</label>
            <Input placeholder="e.g. UAE" value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Dropzone */}
      <Card className="mb-6">
        <CardHeader><CardTitle>Excel File</CardTitle></CardHeader>
        <CardContent>
          <UploadDropzone onUploaded={setUploadResult} eventDetails={eventDetails} />
        </CardContent>
      </Card>

      {/* Run pipeline */}
      {uploadResult?.eventId && (
        <div className="space-y-3">
          <div className="text-sm text-green-400">
            File parsed — {uploadResult.totalRows} hotel rows found.
          </div>
          <Button
            onClick={handleRun}
            disabled={running || !city || !country}
            className="w-full"
            size="lg"
          >
            {running ? 'Running Pipeline…' : 'Run Full Intelligence Pipeline'}
          </Button>
          {(!city || !country) && (
            <p className="text-xs text-[#888]">Fill in city and country above to enable the pipeline.</p>
          )}
        </div>
      )}
    </div>
  )
}
