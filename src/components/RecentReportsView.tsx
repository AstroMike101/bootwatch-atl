'use client'

import { useEffect, useState } from 'react'
import { fetchRecentReports, timeAgo, formatFee } from '@/lib/data'
import type { Report } from '@/types'

// ── Breakpoint hook ───────────────────────────────────────────────────────────

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false) // safe SSR default
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isDesktop
}

// ── Photo strip + lightbox ────────────────────────────────────────────────────

function PhotoStrip({ urls }: { urls: string[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null)
  if (!urls || urls.length === 0) return null
  return (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {urls.map((url, i) => (
          <img
            key={i}
            src={url}
            alt="Report photo"
            onClick={e => { e.stopPropagation(); setLightbox(url) }}
            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10, cursor: 'zoom-in', border: '1px solid #f0f0f0' }}
          />
        ))}
      </div>
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
        >
          <img src={lightbox} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }} />
        </div>
      )}
    </>
  )
}

// ── Shared type badge helper ──────────────────────────────────────────────────

function typeMeta(type: string) {
  if (type === 'boot') return { bg: '#FCEBEB', color: '#791F1F', label: '🔒 Boot' }
  if (type === 'warning') return { bg: '#FAEEDA', color: '#633806', label: '⚠️ Warning' }
  return { bg: '#E6F1FB', color: '#0C447C', label: '🚗 Boot truck' }
}

// ── Report card ───────────────────────────────────────────────────────────────
// On desktop: clicking sets selected, detail shown in side panel
// On mobile:  clicking toggles inline expanded detail, no side panel

function ReportCard({ r, selected, isDesktop, onSelect }: {
  r: Report
  selected: boolean
  isDesktop: boolean
  onSelect: () => void
}) {
  const { bg, color, label } = typeMeta(r.type)
  const expandedOnMobile = !isDesktop && selected

  return (
    <div
      onClick={onSelect}
      style={{
        background: selected ? '#fef9f9' : '#fff',
        borderRadius: 16,
        border: `1.5px solid ${selected ? '#E24B4A' : '#f0f0f0'}`,
        padding: 18,
        boxShadow: selected ? '0 0 0 3px rgba(226,75,74,0.08)' : '0 1px 4px rgba(0,0,0,0.05)',
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column', gap: 10,
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      {/* Badge + time */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: bg, color }}>{label}</span>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>{timeAgo(r.created_at)}</span>
      </div>

      {/* Location */}
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111', lineHeight: 1.3 }}>{r.lot_name ?? r.address}</div>
        {r.lot_name && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{r.address}</div>}
      </div>

      {/* Meta pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {r.company_name && (
          <span style={{ fontSize: 12, color: '#6b7280', background: '#f9fafb', padding: '3px 10px', borderRadius: 99, border: '1px solid #f0f0f0' }}>
            {r.company_name}
          </span>
        )}
        {r.fee && (
          <span style={{ fontSize: 12, fontWeight: 700, color: '#791F1F', background: '#FCEBEB', padding: '3px 10px', borderRadius: 99 }}>
            {formatFee(r.fee)}
          </span>
        )}
        {r.photo_urls && r.photo_urls.length > 0 && (
          <span style={{ fontSize: 12, color: '#185FA5', background: '#E6F1FB', padding: '3px 10px', borderRadius: 99 }}>
            📷 {r.photo_urls.length} photo{r.photo_urls.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Notes */}
      {r.notes && (
        <div style={{ fontSize: 13, color: '#6b7280', fontStyle: 'italic', background: '#f9fafb', borderRadius: 10, padding: '8px 12px', lineHeight: 1.5 }}>
          "{r.notes}"
        </div>
      )}

      {/* Desktop: always show photos on card */}
      {isDesktop && <PhotoStrip urls={r.photo_urls ?? []} />}

      {/* Mobile only: expanded inline detail when selected */}
      {expandedOnMobile && (
        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Company', value: r.company_name ?? 'Unknown' },
              { label: 'Fee', value: formatFee(r.fee) },
              { label: 'Reported', value: timeAgo(r.created_at) },
              { label: 'Type', value: r.type },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: '#f9fafb', borderRadius: 10, padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{value}</div>
              </div>
            ))}
          </div>
          <PhotoStrip urls={r.photo_urls ?? []} />
          <div style={{ background: '#FAEEDA', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#633806', lineHeight: 1.5 }}>
            <strong>Know your rights:</strong> Atlanta law requires clear signage before booting. Take photos before paying.
          </div>
        </div>
      )}
    </div>
  )
}

// ── Desktop side panel ────────────────────────────────────────────────────────

function DetailPanel({ r, onClose }: { r: Report; onClose: () => void }) {
  const { bg, color, label } = typeMeta(r.type)
  return (
    <div style={{
      background: '#fff', borderRadius: 20,
      border: '1px solid #f0f0f0',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      padding: 24,
      position: 'sticky', top: 24,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 700, padding: '5px 12px', borderRadius: 99, background: bg, color }}>{label}</span>
        <button onClick={e => { e.stopPropagation(); onClose() }} style={{ border: 'none', background: 'none', color: '#9ca3af', fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
      </div>

      <div style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 4 }}>{r.lot_name ?? r.address}</div>
      {r.lot_name && <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>{r.address}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Company', value: r.company_name ?? 'Unknown' },
          { label: 'Fee charged', value: formatFee(r.fee) },
          { label: 'Reported', value: timeAgo(r.created_at) },
          { label: 'Type', value: r.type },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: '#f9fafb', borderRadius: 12, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{value}</div>
          </div>
        ))}
      </div>

      {r.notes && (
        <div style={{ background: '#f9fafb', borderRadius: 12, padding: '12px 14px', marginBottom: 16, fontSize: 14, color: '#6b7280', fontStyle: 'italic', lineHeight: 1.6 }}>
          "{r.notes}"
        </div>
      )}

      {r.photo_urls && r.photo_urls.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Photos</div>
          <PhotoStrip urls={r.photo_urls} />
        </div>
      )}

      <div style={{ background: '#FAEEDA', borderRadius: 12, padding: '10px 14px', fontSize: 12, color: '#633806', lineHeight: 1.5 }}>
        <strong>Know your rights:</strong> Atlanta law requires clear signage before booting. Take photos of all signs (or lack of) before paying.
      </div>
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function RecentReportsView() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'boot' | 'warning' | 'truck'>('all')
  const [selected, setSelected] = useState<Report | null>(null)
  const isDesktop = useIsDesktop()

  useEffect(() => {
    fetchRecentReports(200)
      .then(data => { setReports(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Clear selected if screen shrinks to mobile while panel is open
  useEffect(() => {
    if (!isDesktop) setSelected(null)
  }, [isDesktop])

  const displayed = filter === 'all' ? reports : reports.filter(r => r.type === filter)
  const counts = {
    boot: reports.filter(r => r.type === 'boot').length,
    warning: reports.filter(r => r.type === 'warning').length,
    truck: reports.filter(r => r.type === 'truck').length,
  }

  const handleSelect = (r: Report) => {
    // On mobile: toggle inline expand, never set selected for panel
    if (!isDesktop) {
      setSelected(s => s?.id === r.id ? null : r)
      return
    }
    // On desktop: set selected to open side panel
    setSelected(s => s?.id === r.id ? null : r)
  }

  const panelOpen = isDesktop && selected !== null

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 60px' }}>

        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Recent reports</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>Last 72 hours across Atlanta</p>

        {/* Summary */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { count: counts.boot, label: 'boots', bg: '#FCEBEB', color: '#791F1F', sub: '#991F1F' },
            { count: counts.warning, label: 'warnings', bg: '#FAEEDA', color: '#633806', sub: '#854F0B' },
            { count: counts.truck, label: 'trucks spotted', bg: '#E6F1FB', color: '#0C447C', sub: '#185FA5' },
          ].map(({ count, label, bg, color, sub }) => (
            <div key={label} style={{ background: bg, borderRadius: 14, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color }}>{count}</span>
              <span style={{ fontSize: 13, color: sub }}>{label}</span>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', background: '#f9fafb', borderRadius: 14, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#111' }}>{reports.length}</span>
            <span style={{ fontSize: 13, color: '#6b7280' }}>total</span>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {([
            { id: 'all', label: 'All reports' },
            { id: 'boot', label: '🔒 Boots' },
            { id: 'warning', label: '⚠️ Warnings' },
            { id: 'truck', label: '🚗 Trucks' },
          ] as { id: typeof filter; label: string }[]).map(f => (
            <button key={f.id} onClick={() => { setFilter(f.id); setSelected(null) }} style={{
              fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 99,
              border: 'none', cursor: 'pointer',
              background: filter === f.id
                ? f.id === 'boot' ? '#E24B4A' : f.id === 'warning' ? '#BA7517' : f.id === 'truck' ? '#185FA5' : '#1f2937'
                : '#f3f4f6',
              color: filter === f.id ? '#fff' : '#6b7280',
            }}>
              {f.label}
            </button>
          ))}
        </div>

        {loading && <div style={{ textAlign: 'center', padding: 80, fontSize: 14, color: '#9ca3af' }}>Loading reports…</div>}
        {!loading && displayed.length === 0 && <div style={{ textAlign: 'center', padding: 80, fontSize: 14, color: '#9ca3af' }}>No reports yet — be the first!</div>}

        {!loading && displayed.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: panelOpen ? 'minmax(0, 1fr) 380px' : '1fr',
            gap: 24,
            alignItems: 'start',
          }}>
            {/* Card grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: panelOpen
                ? 'repeat(auto-fill, minmax(240px, 1fr))'
                : 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 14,
              alignItems: 'start',
            }}>
              {displayed.map(r => (
                <ReportCard
                  key={r.id}
                  r={r}
                  selected={selected?.id === r.id}
                  isDesktop={isDesktop}
                  onSelect={() => handleSelect(r)}
                />
              ))}
            </div>

            {/* Side panel — only rendered when panelOpen (isDesktop && selected) */}
            {panelOpen && selected && (
              <DetailPanel r={selected} onClose={() => setSelected(null)} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}