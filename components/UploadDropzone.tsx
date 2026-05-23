'use client'

import { useState, useRef, DragEvent } from 'react'
import { Upload, FileSpreadsheet, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadExcel } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { ExcelRow } from '@/lib/types'

interface UploadResult {
  parseResult: { rows: ExcelRow[]; eventName?: string; venueName?: string }
  eventId?: string
  preview: ExcelRow[]
  totalRows: number
}

interface UploadDropzoneProps {
  onUploaded?: (result: UploadResult) => void
}

export function UploadDropzone({ onUploaded }: UploadDropzoneProps) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) selectFile(dropped)
  }

  function selectFile(f: File) {
    if (!f.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('Only .xlsx, .xls, or .csv files are accepted')
      return
    }
    setFile(f)
    setError(null)
    setResult(null)
  }

  async function handleUpload() {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const res = await uploadExcel(file)
      setResult(res as UploadResult)
      onUploaded?.(res as UploadResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setFile(null)
    setResult(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors cursor-pointer',
          dragging ? 'border-blue-500 bg-blue-500/5' : 'border-white/15 bg-[#111] hover:border-white/25',
          result && 'border-green-500/40 bg-green-500/5'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && selectFile(e.target.files[0])}
        />
        {file ? (
          <div className="text-center">
            <FileSpreadsheet className="mx-auto h-10 w-10 text-green-400 mb-3" />
            <div className="text-[#f5f5f5] font-medium">{file.name}</div>
            <div className="text-xs text-[#888] mt-1">{(file.size / 1024).toFixed(0)} KB</div>
            <button
              onClick={(e) => { e.stopPropagation(); reset() }}
              className="mt-2 text-xs text-[#888] hover:text-red-400"
            >
              <X className="inline h-3 w-3 mr-0.5" />Remove
            </button>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="mx-auto h-10 w-10 text-[#555] mb-3" />
            <div className="text-[#f5f5f5] font-medium">Drop Excel file here</div>
            <div className="text-xs text-[#888] mt-1">or click to browse — .xlsx, .xls, .csv supported</div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {file && !result && (
        <Button onClick={handleUpload} disabled={loading} className="w-full">
          {loading ? 'Parsing…' : 'Upload & Parse'}
        </Button>
      )}

      {/* Preview table */}
      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#888]">
              Parsed {result.totalRows} rows
              {result.parseResult.eventName && ` — ${result.parseResult.eventName}`}
            </span>
            <Button size="sm" variant="ghost" onClick={reset}>Clear</Button>
          </div>
          <div className="rounded-lg border border-white/8 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/8 bg-white/3">
                  <th className="px-3 py-2 text-left text-[#888]">Hotel</th>
                  <th className="px-3 py-2 text-right text-[#888]">Vendor Price</th>
                  <th className="px-3 py-2 text-right text-[#888]">Competitor</th>
                  <th className="px-3 py-2 text-left text-[#888]">Room Type</th>
                </tr>
              </thead>
              <tbody>
                {result.preview.map((row, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-b-0">
                    <td className="px-3 py-2 text-[#f5f5f5]">{row.hotelName}</td>
                    <td className="px-3 py-2 text-right font-mono text-[#f5f5f5]">
                      ${row.vendorPrice.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-[#888]">
                      {row.competitorPrice != null ? `$${row.competitorPrice.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-3 py-2 text-[#888]">{row.roomType ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.eventId && (
            <p className="text-xs text-green-400">
              Event created — ID: {result.eventId}. Go to Events to run the full pipeline.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
