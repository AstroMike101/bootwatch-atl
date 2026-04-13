'use client'

import { useEffect, useRef, useState } from 'react'
import {
  searchLots, fetchLotsNear, fetchHighRiskLots,
  fetchReportsByLot, fetchRecentReports, computeNeighborhoodStats,
  riskLabel, formatFee, timeAgo,
} from '@/lib/data'
import { mapsLoader } from '@/lib/maps'
import type { Lot, Report } from '@/types'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isDesktop
}

// ── Risk meter ────────────────────────────────────────────────────────────────

function RiskMeter({ score }: { score: number }) {
  const { label, color, bg, emoji } = riskLabel(score)
  return (
    <div style={{ background: bg, borderRadius: 14, padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 28 }}>{emoji}</span>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color }}>{label}</div>
          <div style={{ fontSize: 12, color, opacity: 0.8 }}>Risk score: {score}/100</div>
        </div>
      </div>
      <div style={{ height: 8, background: 'rgba(0,0,0,0.08)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

// ── Lot card (list item) ──────────────────────────────────────────────────────

function LotCard({ lot, onClick, selected }: { lot: Lot; onClick: () => void; selected: boolean }) {
  const { color, bg, emoji } = riskLabel(lot.risk_score)
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', padding: 16,
      background: selected ? bg : '#fff',
      border: `1.5px solid ${selected ? color : '#f0f0f0'}`,
      borderRadius: 14, cursor: 'pointer',
      boxShadow: selected ? `0 0 0 3px ${bg}` : '0 1px 4px rgba(0,0,0,0.05)',
      transition: 'all 0.15s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 4 }}>
            {lot.name ?? lot.address}
          </div>
          {lot.name && <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{lot.address}</div>}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {lot.company_name && (
              <span style={{ fontSize: 11, color: '#6b7280', background: '#f9fafb', padding: '2px 8px', borderRadius: 99, border: '1px solid #f0f0f0' }}>
                {lot.company_name}
              </span>
            )}
            <span style={{ fontSize: 11, color: '#791F1F', background: '#FCEBEB', padding: '2px 8px', borderRadius: 99 }}>
              {lot.total_boots} boots
            </span>
            {lot.avg_fee && (
              <span style={{ fontSize: 11, color: '#633806', background: '#FAEEDA', padding: '2px 8px', borderRadius: 99 }}>
                avg {formatFee(lot.avg_fee)}
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 20 }}>{emoji}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color, marginTop: 2, whiteSpace: 'nowrap' }}>{riskLabel(lot.risk_score).label}</div>
        </div>
      </div>
    </button>
  )
}

// ── Lot detail content (shared between panel and sheet) ───────────────────────

function LotDetailContent({ lot, reports, onClose }: { lot: Lot; reports: Report[]; onClose: () => void }) {
  const { color } = riskLabel(lot.risk_score)
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#111', marginBottom: 2 }}>{lot.name ?? lot.address}</div>
          {lot.name && <div style={{ fontSize: 13, color: '#6b7280' }}>{lot.address}</div>}
        </div>
        <button onClick={onClose} style={{ border: 'none', background: 'none', color: '#9ca3af', fontSize: 22, cursor: 'pointer', flexShrink: 0, lineHeight: 1, padding: 0 }}>×</button>
      </div>

      <RiskMeter score={lot.risk_score} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, margin: '16px 0' }}>
        {[
          { label: 'Boots', value: lot.total_boots, color: '#791F1F', bg: '#FCEBEB' },
          { label: 'Warnings', value: lot.total_warnings, color: '#633806', bg: '#FAEEDA' },
          { label: 'Avg fee', value: formatFee(lot.avg_fee), color: '#0C447C', bg: '#E6F1FB' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 11, color, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {lot.company_name && (
        <div style={{ background: '#f9fafb', borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#374151' }}>
          Enforced by <strong>{lot.company_name}</strong>
        </div>
      )}

      {lot.last_reported_at && (
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14 }}>
          Last reported {timeAgo(lot.last_reported_at)}
        </div>
      )}

      {reports.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 10 }}>Recent reports</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reports.slice(0, 5).map(r => (
              <div key={r.id} style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: r.type === 'boot' ? '#791F1F' : '#633806' }}>
                    {r.type === 'boot' ? '🔒 Boot' : r.type === 'warning' ? '⚠️ Warning' : '🚗 Truck'}
                    {r.fee ? ` · ${formatFee(r.fee)}` : ''}
                  </span>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>{timeAgo(r.created_at)}</span>
                </div>
                {r.notes && <div style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>"{r.notes}"</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: '#FAEEDA', borderRadius: 12, padding: '10px 14px', fontSize: 12, color: '#633806', lineHeight: 1.5 }}>
        <strong>Tip:</strong> If you park here, take a photo of all signage before leaving your car.
      </div>
    </>
  )
}

// ── Desktop side panel ────────────────────────────────────────────────────────

function LotDetailPanel({ lot, reports, onClose }: { lot: Lot; reports: Report[]; onClose: () => void }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 20,
      border: '1px solid #f0f0f0',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      padding: 24,
      position: 'sticky', top: 24,
      maxHeight: 'calc(100vh - 120px)',
      overflowY: 'auto',
    }}>
      <LotDetailContent lot={lot} reports={reports} onClose={onClose} />
    </div>
  )
}

// ── Mobile bottom sheet ───────────────────────────────────────────────────────

function LotDetailSheet({ lot, reports, onClose }: { lot: Lot; reports: Report[]; onClose: () => void }) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(1px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />
      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201,
        background: '#fff',
        borderRadius: '24px 24px 0 0',
        padding: '20px 20px 48px',
        maxHeight: '85vh',
        overflowY: 'auto',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
        animation: 'slideUp 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 99, background: '#e5e7eb', margin: '0 auto 20px' }} />
        <LotDetailContent lot={lot} reports={reports} onClose={onClose} />
      </div>
    </>
  )
}

// ── Neighborhood leaderboard ──────────────────────────────────────────────────

function NeighborhoodLeaderboard({ reports }: { reports: Report[] }) {
  const stats = computeNeighborhoodStats(reports)
  if (stats.length === 0) return null
  const maxBoots = Math.max(...stats.map(s => s.boots), 1)

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 4 }}>Neighborhood risk</div>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Boot reports in the last 72 hours · {reports.length} total</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {stats.map((s, i) => {
          const { color, bg, emoji } = riskLabel(s.riskScore)
          const pct = (s.boots / maxBoots) * 100
          return (
            <div key={s.name} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? '#FCEBEB' : '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: i === 0 ? '#E24B4A' : '#9ca3af', flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{s.name}</span>
                    <span style={{ fontSize: 13 }}>{emoji}</span>
                  </div>
                  <div style={{ height: 6, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99 }} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#791F1F', background: '#FCEBEB', padding: '3px 10px', borderRadius: 99 }}>
                  {s.boots} boots
                </span>
                {s.warnings > 0 && (
                  <span style={{ fontSize: 12, color: '#633806', background: '#FAEEDA', padding: '3px 10px', borderRadius: 99 }}>
                    {s.warnings} warnings
                  </span>
                )}
                {s.avgFee && (
                  <span style={{ fontSize: 12, color: '#6b7280', background: '#f9fafb', padding: '3px 10px', borderRadius: 99 }}>
                    avg {formatFee(s.avgFee)}
                  </span>
                )}
                {s.topLot && (
                  <span style={{ fontSize: 12, color: '#6b7280', background: '#f9fafb', padding: '3px 10px', borderRadius: 99 }}>
                    Hotspot: {s.topLot.length > 28 ? s.topLot.slice(0, 28) + '…' : s.topLot}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function SafetySearchView() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Lot[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null)
  const [lotReports, setLotReports] = useState<Report[]>([])
  const [highRisk, setHighRisk] = useState<Lot[]>([])
  const [recentReports, setRecentReports] = useState<Report[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const autocomplete = useRef<google.maps.places.Autocomplete | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isDesktop = useIsDesktop()

  useEffect(() => {
    fetchHighRiskLots(8).then(setHighRisk).catch(() => {})
    fetchRecentReports(500).then(setRecentReports).catch(() => {})
  }, [])

  useEffect(() => {
    mapsLoader.load().then(() => {
      if (!inputRef.current) return
      autocomplete.current = new google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'us' },
        fields: ['geometry', 'formatted_address', 'name'],
        bounds: new google.maps.LatLngBounds(
          { lat: 33.65, lng: -84.55 },
          { lat: 33.95, lng: -84.25 }
        ),
      })
      autocomplete.current.addListener('place_changed', async () => {
        const place = autocomplete.current!.getPlace()
        if (!place.geometry?.location) return
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()
        setSearching(true)
        setHasSearched(true)
        setSelectedLot(null)
        const nearby = await fetchLotsNear(lat, lng)
        setResults(nearby)
        setSearching(false)
      })
    })
  }, [])

  const handleQueryChange = (val: string) => {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.trim().length < 3) { setResults([]); setHasSearched(false); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      setHasSearched(true)
      setSelectedLot(null)
      const lots = await searchLots(val.trim())
      setResults(lots)
      setSearching(false)
    }, 350)
  }

  const handleSelectLot = async (lot: Lot) => {
    if (selectedLot?.id === lot.id) { setSelectedLot(null); setLotReports([]); return }
    setSelectedLot(lot)
    const reps = await fetchReportsByLot(lot.id)
    setLotReports(reps)
  }

  const closeDetail = () => { setSelectedLot(null); setLotReports([]) }
  const panelOpen = isDesktop && selectedLot !== null

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 60px' }}>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', marginBottom: 6 }}>Is it safe to park here?</h1>
        <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 28 }}>Search any Atlanta address or lot to see its boot history and risk score.</p>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 32 }}>
          <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18, pointerEvents: 'none' }}>🔍</div>
          <input
            ref={inputRef}
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            placeholder="Search address, lot name, or neighborhood…"
            style={{
              width: '100%', padding: '16px 16px 16px 48px',
              fontSize: 16, border: '2px solid #e5e7eb', borderRadius: 16,
              background: '#fff', outline: 'none', color: '#111',
              boxSizing: 'border-box', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.target.style.borderColor = '#E24B4A')}
            onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
          />
          {searching && (
            <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, border: '2px solid #E24B4A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          )}
        </div>

        {/* Grid: results + desktop panel */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: panelOpen ? 'minmax(0,1fr) 380px' : '1fr',
          gap: 24, alignItems: 'start',
        }}>
          <div>
            {/* Search results */}
            {hasSearched && (
              <div style={{ marginBottom: 40 }}>
                {results.length === 0 && !searching && (
                  <div style={{ background: '#EAF3DE', borderRadius: 16, padding: '20px 24px', display: 'flex', gap: 14, alignItems: 'center' }}>
                    <span style={{ fontSize: 28 }}>✅</span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#27500A' }}>No boot reports found nearby</div>
                      <div style={{ fontSize: 13, color: '#3a6b12', marginTop: 3 }}>This location has no boot reports in our database. Always check signage before parking.</div>
                    </div>
                  </div>
                )}
                {results.length > 0 && (
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', marginBottom: 12 }}>
                      {results.length} lot{results.length > 1 ? 's' : ''} found near this location
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {results.map(lot => (
                        <LotCard key={lot.id} lot={lot} selected={selectedLot?.id === lot.id} onClick={() => handleSelectLot(lot)} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* High risk lots default state */}
            {!hasSearched && highRisk.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 4 }}>⚠️ High risk lots right now</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>These lots have the most recent boot activity</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {highRisk.map(lot => (
                    <LotCard key={lot.id} lot={lot} selected={selectedLot?.id === lot.id} onClick={() => handleSelectLot(lot)} />
                  ))}
                </div>
              </div>
            )}

            <NeighborhoodLeaderboard reports={recentReports} />
          </div>

          {/* Desktop side panel */}
          {panelOpen && selectedLot && (
            <LotDetailPanel lot={selectedLot} reports={lotReports} onClose={closeDetail} />
          )}
        </div>
      </div>

      {/* Mobile bottom sheet */}
      {!isDesktop && selectedLot && (
        <LotDetailSheet lot={selectedLot} reports={lotReports} onClose={closeDetail} />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </div>
  )
}