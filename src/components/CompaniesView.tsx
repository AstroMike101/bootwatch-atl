'use client'

import { useEffect, useState } from 'react'
import { fetchCompanies, fetchRecentReports, timeAgo, formatFee } from '@/lib/data'
import type { Company, Report } from '@/types'

const SEED: Company[] = [
  { id: '1', name: 'ATL Boot Co', initials: 'AB', type: 'Private enforcement', phone: null, website: null, avg_fee: 150, total_boots: 247, total_complaints: 89, rating: 1.4, legal_flags: 3, tags: ['24/7', 'High volume', 'Fee disputes'], created_at: '' },
  { id: '2', name: 'Parking Vision LLC', initials: 'PV', type: 'Lot management', phone: null, website: null, avg_fee: 125, total_boots: 134, total_complaints: 41, rating: 2.1, legal_flags: 1, tags: ['Midtown', 'Buckhead'], created_at: '' },
  { id: '3', name: 'City Parking Inc', initials: 'CP', type: 'City contracted', phone: null, website: null, avg_fee: 100, total_boots: 88, total_complaints: 18, rating: 3.2, legal_flags: 0, tags: ['City contract', 'More lenient'], created_at: '' },
  { id: '4', name: 'Premier Parking Enforcement', initials: 'PP', type: 'Private enforcement', phone: null, website: null, avg_fee: 175, total_boots: 196, total_complaints: 72, rating: 1.8, legal_flags: 2, tags: ['Buckhead', 'High fee', 'Aggressive'], created_at: '' },
]

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

// ── Company detail view ──────────────────────────────────────────────────────

function CompanyDetail({ co, onBack, allReports }: { co: Company; onBack: () => void; allReports: Report[] }) {
  const risk = riskColor(co.legal_flags, co.total_boots)
  const companyReports = allReports.filter(r =>
    r.company_name?.toLowerCase() === co.name.toLowerCase()
  ).slice(0, 20)

  const disputeSteps = [
    'Take photos of ALL signage (or lack of it) before paying.',
    'Atlanta law requires signs to be clearly visible before booting is legal.',
    'Request an itemized receipt — companies must provide one.',
    'If signs were missing or unclear, file a complaint with the City of Atlanta Office of Consumer Affairs.',
    'For fees over $150, consider disputing via Magistrate Court (filing fee ~$50).',
  ]

  return (
    <div style={{ padding: '16px 16px 40px', maxWidth: 480, margin: '0 auto' }}>
      {/* Back */}
      <button onClick={onBack} style={{ border: 'none', background: 'none', fontSize: 13, color: '#185FA5', cursor: 'pointer', padding: '0 0 16px', display: 'flex', alignItems: 'center', gap: 4 }}>
        ← All companies
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: risk.bg, color: risk.text,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 700, flexShrink: 0,
        }}>{co.initials}</div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#111' }}>{co.name}</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{co.type}</div>
          <div style={{ marginTop: 4 }}><Stars rating={co.rating} /></div>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: risk.bg, color: risk.text, flexShrink: 0 }}>
          {risk.label}
        </span>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
        {[
          { label: 'Total boots', value: co.total_boots, color: '#791F1F', bg: '#FCEBEB' },
          { label: 'Complaints', value: co.total_complaints, color: '#633806', bg: '#FAEEDA' },
          { label: 'Avg fee', value: `$${co.avg_fee ?? '—'}`, color: '#0C447C', bg: '#E6F1FB' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 11, color }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Activity bar */}
      <div style={{ background: '#f9fafb', borderRadius: 12, padding: 14, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Boot volume</span>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>{co.total_boots} total</span>
        </div>
        <RiskBar value={co.total_boots} max={300} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Complaint rate</span>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>{co.total_boots > 0 ? Math.round((co.total_complaints / co.total_boots) * 100) : 0}%</span>
        </div>
        <RiskBar value={co.total_complaints} max={co.total_boots || 1} />
      </div>

      {/* Tags */}
      {co.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {co.tags.map(tag => (
            <span key={tag} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 99, background: '#E6F1FB', color: '#0C447C', fontWeight: 500 }}>{tag}</span>
          ))}
        </div>
      )}

      {/* Legal flags */}
      {co.legal_flags > 0 && (
        <div style={{ background: '#FCEBEB', borderRadius: 12, padding: 12, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 18 }}>⚖️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#791F1F', marginBottom: 2 }}>
              {co.legal_flags} legal flag{co.legal_flags > 1 ? 's' : ''} on record
            </div>
            <div style={{ fontSize: 12, color: '#991F1F' }}>
              This company has been flagged for potential violations. Review your rights below before paying.
            </div>
          </div>
        </div>
      )}

      {/* Contact */}
      {(co.phone || co.website) && (
        <div style={{ background: '#f9fafb', borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Contact</div>
          {co.phone && (
            <a href={`tel:${co.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#185FA5', textDecoration: 'none', marginBottom: co.website ? 8 : 0 }}>
              📞 {co.phone}
            </a>
          )}
          {co.website && (
            <a href={co.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#185FA5', textDecoration: 'none' }}>
              🌐 {co.website.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>
      )}

      {/* Know your rights */}
      <div style={{ background: '#FAEEDA', borderRadius: 12, padding: 14, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#633806', marginBottom: 10 }}>📋 Know your rights</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {disputeSteps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#854F0B', background: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
              <span style={{ fontSize: 12, color: '#633806', lineHeight: 1.5 }}>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent reports */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 12 }}>
          Recent reports
          <span style={{ fontSize: 12, fontWeight: 400, color: '#9ca3af', marginLeft: 6 }}>
            ({companyReports.length} in last 72h)
          </span>
        </div>
        {companyReports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: '#9ca3af' }}>
            No recent reports for this company
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {companyReports.map(r => (
              <div key={r.id} style={{ background: '#f9fafb', borderRadius: 12, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                    background: r.type === 'boot' ? '#FCEBEB' : '#FAEEDA',
                    color: r.type === 'boot' ? '#791F1F' : '#633806',
                  }}>
                    {r.type === 'boot' ? '🔒 Boot' : r.type === 'warning' ? '⚠️ Warning' : '🚗 Truck spotted'}
                  </span>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>{timeAgo(r.created_at)}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{r.lot_name ?? r.address}</div>
                {r.lot_name && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{r.address}</div>}
                {r.fee && <div style={{ fontSize: 12, color: '#374151', marginTop: 4 }}>Fee charged: <strong>{formatFee(r.fee)}</strong></div>}
                {r.notes && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4, fontStyle: 'italic' }}>"{r.notes}"</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Company list view ────────────────────────────────────────────────────────

export default function CompaniesView() {
  const [companies, setCompanies] = useState<Company[]>(SEED)
  const [allReports, setAllReports] = useState<Report[]>([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Company | null>(null)

  useEffect(() => {
    fetchCompanies().then(data => { if (data.length > 0) setCompanies(data) }).catch(() => {})
    fetchRecentReports(500).then(setAllReports).catch(() => {})
  }, [])

  if (selected) {
    return <CompanyDetail co={selected} onBack={() => setSelected(null)} allReports={allReports} />
  }

  const filtered = companies.filter(c =>
    !query || c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
  )

  const totalBoots = companies.reduce((s, c) => s + c.total_boots, 0)
  const avgFee = Math.round(companies.reduce((s, c) => s + (c.avg_fee ?? 0), 0) / companies.length)
  const worstCompany = [...companies].sort((a, b) => b.total_boots - a.total_boots)[0]

  return (
    <div style={{ padding: '20px 16px', maxWidth: 480, margin: '0 auto', paddingBottom: 32 }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Booting companies</h1>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>Tap a company to see recent activity, contact info, and your rights.</p>

      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search companies or neighborhoods…"
        style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 10, background: '#f9fafb', outline: 'none', marginBottom: 16, color: '#111' }}
      />

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        <div style={{ background: '#f9fafb', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{companies.length}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Companies</div>
        </div>
        <div style={{ background: '#FCEBEB', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#791F1F' }}>{totalBoots}</div>
          <div style={{ fontSize: 11, color: '#991F1F' }}>Total boots</div>
        </div>
        <div style={{ background: '#FAEEDA', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#633806' }}>${avgFee}</div>
          <div style={{ fontSize: 11, color: '#854F0B' }}>Avg fee</div>
        </div>
      </div>

      {/* Most active alert */}
      {worstCompany && (
        <div style={{ background: '#FCEBEB', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 20 }}>🚨</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#791F1F' }}>Most active this week</div>
            <div style={{ fontSize: 13, color: '#991F1F' }}>{worstCompany.name} — {worstCompany.total_boots} boots reported</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(co => {
          const risk = riskColor(co.legal_flags, co.total_boots)
          const recentCount = allReports.filter(r => r.company_name?.toLowerCase() === co.name.toLowerCase()).length
          return (
            <button key={co.id} onClick={() => setSelected(co)} style={{
              width: '100%', textAlign: 'left', padding: 16,
              background: '#fff', border: '1px solid #f3f4f6', borderRadius: 16,
              cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: risk.bg, color: risk.text,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, flexShrink: 0,
                }}>{co.initials}</div>
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
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: '#d1d5db' }}>
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                {[['Boots', co.total_boots], ['Complaints', co.total_complaints], ['Avg fee', `$${co.avg_fee ?? '—'}`]].map(([label, val]) => (
                  <div key={label as string} style={{ background: '#f9fafb', borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{val}</div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Boot volume bar */}
              <div style={{ marginTop: 10 }}>
                <RiskBar value={co.total_boots} max={300} />
              </div>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, fontSize: 14, color: '#9ca3af' }}>No companies match your search</div>
      )}
    </div>
  )
}