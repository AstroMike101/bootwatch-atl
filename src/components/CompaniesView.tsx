'use client'

import { useEffect, useRef, useState } from 'react'
import { fetchCompanies, fetchRecentReports, timeAgo, formatFee } from '@/lib/data'
import type { Company, Report } from '@/types'

function riskColor(flags: number, boots: number) {
  if (flags >= 2 || boots > 200) return { bg: '#FCEBEB', text: '#791F1F', label: 'High risk' }
  if (flags >= 1 || boots > 100) return { bg: '#FAEEDA', text: '#633806', label: 'Moderate' }
  return { bg: '#EAF3DE', text: '#27500A', label: 'Low risk' }
}

function RiskBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100)
  const color = pct > 66 ? '#E24B4A' : pct > 33 ? '#BA7517' : '#22c55e'
  return (
    <div style={{ height: 6, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.4s ease' }} />
    </div>
  )
}

function Stars({ rating }: { rating: number | null }) {
  if (!rating) return <span style={{ fontSize: 12, color: '#9ca3af' }}>No ratings yet</span>
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="13" height="13" viewBox="0 0 13 13">
          <path d="M6.5 1l1.4 2.8 3.1.45-2.25 2.19.53 3.09L6.5 8.1l-2.78 1.47.53-3.09L2 4.25l3.1-.45z"
            fill={i <= Math.round(rating) ? '#BA7517' : 'none'} stroke="#BA7517" strokeWidth="0.8" />
        </svg>
      ))}
      <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 3 }}>{rating.toFixed(1)}</span>
    </div>
  )
}

// ── Company detail ────────────────────────────────────────────────────────────

function CompanyDetail({ co, onBack, allReports }: { co: Company; onBack: () => void; allReports: Report[] }) {
  const risk = riskColor(co.legal_flags, co.total_boots)
  const companyReports = allReports
    .filter(r => r.company_name?.toLowerCase() === co.name.toLowerCase())
    .slice(0, 20)

  const disputeSteps = [
    'Take photos of ALL signage (or lack of it) before paying.',
    'Atlanta law requires signs to be clearly visible before booting is legal.',
    'Request an itemized receipt — companies must provide one.',
    'If signs were missing or unclear, file a complaint with the City of Atlanta Office of Consumer Affairs.',
    'For fees over $150, consider disputing via Magistrate Court (filing fee ~$50).',
  ]

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 24px 60px' }}>
      <button onClick={onBack} style={{ border: 'none', background: 'none', fontSize: 13, color: '#185FA5', cursor: 'pointer', padding: '0 0 20px', display: 'flex', alignItems: 'center', gap: 4 }}>
        ← All companies
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: risk.bg, color: risk.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, flexShrink: 0 }}>
          {co.initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111' }}>{co.name}</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{co.type}</div>
          <div style={{ marginTop: 6 }}><Stars rating={co.rating} /></div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 99, background: risk.bg, color: risk.text, flexShrink: 0 }}>
          {risk.label}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total boots', value: co.total_boots, color: '#791F1F', bg: '#FCEBEB' },
          { label: 'Complaints', value: co.total_complaints, color: '#633806', bg: '#FAEEDA' },
          { label: 'Avg fee', value: `$${co.avg_fee ?? '—'}`, color: '#0C447C', bg: '#E6F1FB' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: 14, padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 12, color, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div style={{ background: '#f9fafb', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Activity</div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>Boot volume</span>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{co.total_boots} total</span>
            </div>
            <RiskBar value={co.total_boots} max={300} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>Complaint rate</span>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>
                {co.total_boots > 0 ? Math.round((co.total_complaints / co.total_boots) * 100) : 0}%
              </span>
            </div>
            <RiskBar value={co.total_complaints} max={co.total_boots || 1} />
          </div>
        </div>

        <div style={{ background: '#f9fafb', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Info</div>
          {co.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {co.tags.map(tag => (
                <span key={tag} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: '#E6F1FB', color: '#0C447C', fontWeight: 500 }}>{tag}</span>
              ))}
            </div>
          )}
          {co.phone && (
            <a href={`tel:${co.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#185FA5', textDecoration: 'none', marginBottom: 8 }}>
              📞 {co.phone}
            </a>
          )}
          {co.website && (
            <a href={co.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#185FA5', textDecoration: 'none' }}>
              🌐 {co.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          {!co.phone && !co.website && (
            <span style={{ fontSize: 13, color: '#9ca3af' }}>No contact info on file</span>
          )}
        </div>
      </div>

      {co.legal_flags > 0 && (
        <div style={{ background: '#FCEBEB', borderRadius: 14, padding: 14, marginBottom: 16, display: 'flex', gap: 10 }}>
          <span style={{ fontSize: 20 }}>⚖️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#791F1F', marginBottom: 2 }}>
              {co.legal_flags} legal flag{co.legal_flags > 1 ? 's' : ''} on record
            </div>
            <div style={{ fontSize: 12, color: '#991F1F' }}>
              This company has been flagged for potential violations. Review your rights before paying.
            </div>
          </div>
        </div>
      )}

      <div style={{ background: '#FAEEDA', borderRadius: 14, padding: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#633806', marginBottom: 12 }}>📋 Know your rights</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {disputeSteps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#854F0B', background: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
              <span style={{ fontSize: 13, color: '#633806', lineHeight: 1.5 }}>{step}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 14 }}>
        Recent reports
        <span style={{ fontSize: 13, fontWeight: 400, color: '#9ca3af', marginLeft: 8 }}>({companyReports.length} in last 72h)</span>
      </div>

      {companyReports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 14, color: '#9ca3af' }}>No recent reports for this company</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {companyReports.map(r => (
            <div key={r.id} style={{ background: '#f9fafb', borderRadius: 14, padding: 14, border: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: r.type === 'boot' ? '#FCEBEB' : '#FAEEDA', color: r.type === 'boot' ? '#791F1F' : '#633806' }}>
                  {r.type === 'boot' ? '🔒 Boot' : r.type === 'warning' ? '⚠️ Warning' : '🚗 Truck'}
                </span>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>{timeAgo(r.created_at)}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{r.lot_name ?? r.address}</div>
              {r.lot_name && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{r.address}</div>}
              {r.fee && <div style={{ fontSize: 12, color: '#374151', marginTop: 6 }}>Fee: <strong>{formatFee(r.fee)}</strong></div>}
              {r.notes && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6, fontStyle: 'italic' }}>"{r.notes}"</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Company list ──────────────────────────────────────────────────────────────

export default function CompaniesView() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [allReports, setAllReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Company | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      fetchCompanies(),
      fetchRecentReports(500),
    ]).then(([cos, reps]) => {
      setCompanies(cos)
      setAllReports(reps)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleSelect = (co: Company) => {
    setSelected(co)
    scrollRef.current?.scrollTo({ top: 0 })
  }

  const handleBack = () => {
    setSelected(null)
    scrollRef.current?.scrollTo({ top: 0 })
  }

  const filtered = companies.filter(c =>
    !query ||
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
  )

  const totalBoots = companies.reduce((s, c) => s + c.total_boots, 0)
  const avgFee = companies.length ? Math.round(companies.reduce((s, c) => s + (c.avg_fee ?? 0), 0) / companies.length) : 0
  const worstCompany = [...companies].sort((a, b) => b.total_boots - a.total_boots)[0]

  return (
    <div ref={scrollRef} style={{ height: '100%', overflowY: 'auto' }}>

      {selected ? (
        <CompanyDetail co={selected} onBack={handleBack} allReports={allReports} />
      ) : (
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 24px 60px' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Booting companies</h1>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>Tap a company to see recent activity, contact info, and your rights.</p>

          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search companies or neighborhoods…"
            style={{ width: '100%', padding: '11px 14px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 12, background: '#f9fafb', outline: 'none', marginBottom: 20, color: '#111', boxSizing: 'border-box' }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            <div style={{ background: '#f9fafb', borderRadius: 14, padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{companies.length}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Companies</div>
            </div>
            <div style={{ background: '#FCEBEB', borderRadius: 14, padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#791F1F' }}>{totalBoots}</div>
              <div style={{ fontSize: 12, color: '#991F1F', marginTop: 2 }}>Total boots</div>
            </div>
            <div style={{ background: '#FAEEDA', borderRadius: 14, padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#633806' }}>${avgFee}</div>
              <div style={{ fontSize: 12, color: '#854F0B', marginTop: 2 }}>Avg fee</div>
            </div>
          </div>

          {worstCompany && (
            <div style={{ background: '#FCEBEB', borderRadius: 14, padding: '12px 16px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 22 }}>🚨</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#791F1F' }}>Most active this week</div>
                <div style={{ fontSize: 14, color: '#991F1F' }}>{worstCompany.name} — {worstCompany.total_boots} boots reported</div>
              </div>
            </div>
          )}

          {loading && <div style={{ textAlign: 'center', padding: 48, fontSize: 14, color: '#9ca3af' }}>Loading companies…</div>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {filtered.map(co => {
              const risk = riskColor(co.legal_flags, co.total_boots)
              const recentCount = allReports.filter(r => r.company_name?.toLowerCase() === co.name.toLowerCase()).length
              return (
                <button key={co.id} onClick={() => handleSelect(co)} style={{
                  textAlign: 'left', padding: 18,
                  background: '#fff', border: '1px solid #f0f0f0',
                  borderRadius: 16, cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: risk.bg, color: risk.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                      {co.initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{co.name}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: risk.bg, color: risk.text }}>{risk.label}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{co.type}</div>
                    </div>
                    {recentCount > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: '#FCEBEB', color: '#791F1F', flexShrink: 0 }}>
                        {recentCount} recent
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {[['Boots', co.total_boots], ['Complaints', co.total_complaints], ['Avg fee', `$${co.avg_fee ?? '—'}`]].map(([label, val]) => (
                      <div key={label as string} style={{ background: '#f9fafb', borderRadius: 10, padding: '8px 6px', textAlign: 'center' }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{val}</div>
                        <div style={{ fontSize: 10, color: '#6b7280', marginTop: 1 }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  <RiskBar value={co.total_boots} max={300} />
                </button>
              )
            })}
          </div>

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 48, fontSize: 14, color: '#9ca3af' }}>No companies match your search</div>
          )}
        </div>
      )}
    </div>
  )
}