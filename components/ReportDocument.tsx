import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Report } from '@/lib/types'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 4, color: '#111' },
  subtitle: { fontSize: 11, color: '#666', marginBottom: 24 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#111', borderBottom: '1pt solid #e5e5e5', paddingBottom: 4, marginBottom: 10 },
  row: { flexDirection: 'row', marginBottom: 6 },
  label: { fontSize: 10, color: '#666', width: '40%' },
  value: { fontSize: 10, color: '#111', flex: 1 },
  badge: { fontSize: 9, padding: '2 6', borderRadius: 4, alignSelf: 'flex-start' },
  approved: { backgroundColor: '#dbeafe', color: '#1d4ed8' },
  rejected: { backgroundColor: '#fee2e2', color: '#dc2626' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f5f5f5', padding: '6 4', marginBottom: 2 },
  tableRow: { flexDirection: 'row', padding: '5 4', borderBottom: '0.5pt solid #f0f0f0' },
  col1: { flex: 2, fontSize: 9 },
  col2: { flex: 1, fontSize: 9, textAlign: 'right' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, color: '#aaa', textAlign: 'center' },
})

interface ReportDocumentProps {
  report: Report & { events?: Record<string, unknown> }
}

export function ReportDocument({ report }: ReportDocumentProps) {
  const c = report.content as Record<string, unknown> | undefined
  const summary = (c?.summary ?? {}) as Record<string, unknown>
  const pricing = (c?.pricing ?? {}) as Record<string, unknown>
  const approval = (c?.approval ?? {}) as Record<string, unknown>
  const scores = (c?.scores ?? {}) as Record<string, unknown>
  const hotels = (c?.hotels ?? []) as Record<string, unknown>[]

  const isApproved = approval.decision === 'approved'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Text style={styles.title}>Event Intelligence Report</Text>
        <Text style={styles.subtitle}>
          3atef AI Agent · Generated {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
        </Text>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Event Summary</Text>
          <Row label="Event Name" value={String(summary.eventName ?? '—')} />
          <Row label="Type" value={String(summary.eventType ?? '—')} />
          <Row label="Location" value={String(summary.location ?? '—')} />
          <Row label="Venue" value={String(summary.venue ?? '—')} />
          <Row label="Dates" value={String(summary.dates ?? '—')} />
          <View style={[styles.row, { marginTop: 4 }]}>
            <Text style={styles.label}>Decision</Text>
            <Text style={[styles.badge, isApproved ? styles.approved : styles.rejected]}>
              {isApproved ? 'APPROVED' : 'REJECTED'}
            </Text>
          </View>
        </View>

        {/* Pricing Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing Analysis</Text>
          <Row label="Hotels Analyzed" value={String(pricing.totalHotelsAnalyzed ?? 0)} />
          <Row label="Hotels Cheaper than Vendor" value={String(pricing.hotelsCheaperThanVendor ?? 0)} />
          <Row label="Avg Market Price" value={`$${Number(pricing.averageMarketPrice ?? 0).toFixed(2)}`} />
          <Row label="Avg Vendor Price" value={`$${Number(pricing.averageVendorPrice ?? 0).toFixed(2)}`} />
          <Row label="Avg Savings Opportunity" value={`$${Number(pricing.averageSavingsOpportunity ?? 0).toFixed(2)}`} />
        </View>

        {/* Approval */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Approval Decision</Text>
          <Row label="Rule Triggered" value={String(approval.ruleTriggered ?? '—')} />
          <Row label="Hotels Qualified" value={String(approval.hotelsQualified ?? 0)} />
          <Row label="Min Price Difference" value={`$${Number(approval.minPriceDifference ?? 0).toFixed(2)}`} />
        </View>

        {/* Scores */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scores</Text>
          <Row label="Profitability Score" value={`${Number(scores.profitabilityScore ?? 0).toFixed(0)} / 100`} />
          <Row label="Risk Score" value={String(scores.riskScore ?? 0)} />
        </View>

        {/* Hotel Table */}
        {hotels.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hotel Comparison</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.col1, { fontWeight: 'bold', color: '#666' }]}>Hotel</Text>
              <Text style={[styles.col2, { fontWeight: 'bold', color: '#666' }]}>Market</Text>
              <Text style={[styles.col2, { fontWeight: 'bold', color: '#666' }]}>Vendor</Text>
              <Text style={[styles.col2, { fontWeight: 'bold', color: '#666' }]}>Diff</Text>
            </View>
            {hotels.slice(0, 15).map((h, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.col1}>{String(h.name ?? '—')}</Text>
                <Text style={styles.col2}>
                  {h.marketPrice != null ? `$${Number(h.marketPrice).toFixed(2)}` : '—'}
                </Text>
                <Text style={styles.col2}>
                  {h.vendorPrice != null ? `$${Number(h.vendorPrice).toFixed(2)}` : '—'}
                </Text>
                <Text style={[styles.col2, { color: Number(h.priceDifference ?? 0) <= -4 ? '#16a34a' : '#dc2626' }]}>
                  {h.priceDifference != null ? `$${Number(h.priceDifference).toFixed(2)}` : '—'}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.footer}>
          Generated by 3atef AI Event Intelligence Agent · Confidential
        </Text>
      </Page>
    </Document>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  )
}
