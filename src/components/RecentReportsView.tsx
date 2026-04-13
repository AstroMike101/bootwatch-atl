'use client'

import { useEffect, useState } from 'react'
import { fetchRecentReports, timeAgo, formatFee } from '@/lib/data'
import type { Report } from '@/types'

export default function RecentReportsView() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'boot' | 'warning' | 'truck'>('all')

  useEffect(() => {
    fetchRecentReports(200)
      .then(data => { setReports(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const displayed = filter === 'all' ? reports : reports.filter(r => r.type === filter)

  const counts = {
    boot: reports.filter(r => r.type === 'boot').length,
    warning: reports.filter(r => r.type === 'warning').length,
    truck: reports.filter(r => r.type === 'truck').length,
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 24px 60px' }}>

      {/* Header */}
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Recent reports</h1>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>Last 72 hours across Atlanta</p>

      {/* Summary pills */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ background: '#FCEBEB', borderRadius: 12, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#791F1F' }}>{counts.boot}</span>
          <span style={{ fontSize: 13, color: '#991F1F' }}>boots</span>
        </div>
        <div style={{ background: '#FAEEDA', borderRadius: 12, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#633806' }}>{counts.warning}</span>
          <span style={{ fontSize: 13, color: '#854F0B' }}>warnings</span>
        </div>
        <div style={{ background: '#E6F1FB', borderRadius: 12, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#0C447C' }}>{counts.truck}</span>
          <span style={{ fontSize: 13, color: '#185FA5' }}>trucks spotted</span>
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {([
          { id: 'all', label: 'All' },
          { id: 'boot', label: '🔒 Boots' },
          { id: 'warning', label: '⚠️ Warnings' },
          { id: 'truck', label: '🚗 Trucks' },
        ] as { id: typeof filter; label: string }[]).map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            fontSize: 13, fontWeight: 600, padding: '7px 16px', borderRadius: 99,
            border: 'none', cursor: 'pointer',
            background: filter === f.id
              ? f.id === 'boot' ? '#E24B4A'
              : f.id === 'warning' ? '#BA7517'
              : f.id === 'truck' ? '#185FA5'
              : '#1f2937'
              : '#f3f4f6',
            color: filter === f.id ? '#fff' : '#6b7280',
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 64, fontSize: 14, color: '#9ca3af' }}>Loading reports…</div>
      )}

      {/* Empty */}
      {!loading && displayed.length === 0 && (
        <div style={{ textAlign: 'center', padding: 64, fontSize: 14, color: '#9ca3af' }}>No reports yet — be the first!</div>
      )}

      {/* Cards grid — 1 col mobile, 2 col tablet, 3 col desktop */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {displayed.map(r => (
          <div key={r.id} style={{
            background: '#fff',
            borderRadius: 16,
            border: '1px solid #f0f0f0',
            padding: 18,
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            {/* Top row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 99,
                background: r.type === 'boot' ? '#FCEBEB' : r.type === 'warning' ? '#FAEEDA' : '#E6F1FB',
                color: r.type === 'boot' ? '#791F1F' : r.type === 'warning' ? '#633806' : '#0C447C',
              }}>
                {r.type === 'boot' ? '🔒 Boot' : r.type === 'warning' ? '⚠️ Warning' : '🚗 Boot truck'}
              </span>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{timeAgo(r.created_at)}</span>
            </div>

            {/* Location */}
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>
                {r.lot_name ?? r.address}
              </div>
              {r.lot_name && (
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{r.address}</div>
              )}
            </div>

            {/* Meta */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {r.company_name && (
                <span style={{ fontSize: 12, color: '#6b7280', background: '#f9fafb', padding: '3px 10px', borderRadius: 99 }}>
                  {r.company_name}
                </span>
              )}
              {r.fee && (
                <span style={{ fontSize: 12, fontWeight: 600, color: '#791F1F', background: '#FCEBEB', padding: '3px 10px', borderRadius: 99 }}>
                  {formatFee(r.fee)}
                </span>
              )}
            </div>

            {/* Notes */}
            {r.notes && (
              <div style={{ fontSize: 13, color: '#6b7280', fontStyle: 'italic', background: '#f9fafb', borderRadius: 10, padding: '8px 12px', lineHeight: 1.5 }}>
                "{r.notes}"
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}