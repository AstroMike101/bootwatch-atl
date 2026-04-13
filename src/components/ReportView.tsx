'use client'

import { useState, useRef, useEffect } from 'react'
import { mapsLoader } from '@/lib/maps'
import { submitReport } from '@/lib/data'
import type { NewReport, ReportType } from '@/types'

const COMPANIES = [
  'ATL Boot Co',
  'Parking Vision LLC',
  'City Parking Inc',
  'Premier Parking Enforcement',
  'Standard Parking',
  'ABM Parking',
  'Lanier Parking',
  'Other',
]

interface Props {
  onDone: () => void
  onCancel: () => void
}

export default function ReportView({ onDone, onCancel }: Props) {
  const [step, setStep] = useState<1 | 2 | 'done'>(1)
  const [type, setType] = useState<ReportType>('boot')
  const [address, setAddress] = useState('')
  const [lotName, setLotName] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState('')
  const [company, setCompany] = useState('')
  const [fee, setFee] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const autocomplete = useRef<google.maps.places.Autocomplete | null>(null)

  useEffect(() => {
    if (step !== 1 || !inputRef.current) return
    mapsLoader.load().then(() => {
      if (!inputRef.current) return
      autocomplete.current = new google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'us' },
        fields: ['geometry', 'formatted_address', 'name'],
      })
      autocomplete.current.addListener('place_changed', () => {
        const place = autocomplete.current!.getPlace()
        if (place.geometry?.location) {
          setLat(place.geometry.location.lat())
          setLng(place.geometry.location.lng())
          setAddress(place.formatted_address ?? place.name ?? '')
        }
      })
    })
  }, [step])

  const detectLocation = () => {
    if (!navigator.geolocation) { setLocateError('Geolocation not available'); return }
    setLocating(true)
    setLocateError('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setLat(latitude)
        setLng(longitude)
        try {
          await mapsLoader.load()
          const geocoder = new google.maps.Geocoder()
          const result = await geocoder.geocode({ location: { lat: latitude, lng: longitude } })
          if (result.results[0]) setAddress(result.results[0].formatted_address)
        } catch { setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`) }
        setLocating(false)
      },
      () => { setLocateError('Could not get location — please type your address below.'); setLocating(false) },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleSubmit = async () => {
    if (!lat || !lng) return
    setSubmitting(true)
    setError('')
    try {
      const report: NewReport = {
        type, address, lat, lng,
        lot_name: lotName.trim() || undefined,
        company_name: company || undefined,
        fee: fee ? parseInt(fee.replace(/\D/g, '')) || undefined : undefined,
        notes: notes.trim() || undefined,
      }
      await submitReport(report)
      setStep('done')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const canGoNext = address.trim() !== '' && lat !== null && lng !== null

  const s: Record<string, React.CSSProperties> = {
    wrap: { padding: '20px 16px', maxWidth: 480, margin: '0 auto' },
    label: { fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.05em', display: 'block', marginBottom: 6 },
    input: { width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff', outline: 'none', color: '#111' },
    select: { width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff', outline: 'none', color: '#111', appearance: 'none' as const },
    btn: { width: '100%', padding: '13px', fontSize: 15, fontWeight: 700, borderRadius: 12, border: 'none', cursor: 'pointer', background: '#E24B4A', color: '#fff' },
    btnSecondary: { padding: '13px', fontSize: 14, fontWeight: 500, borderRadius: 12, border: '1px solid #e5e7eb', cursor: 'pointer', background: '#fff', color: '#6b7280', flex: 1 },
  }

  if (step === 'done') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: 32, textAlign: 'center' }}>
      <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M6 14l6 6 10-10" stroke="#27500A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Report submitted!</h2>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>Your report is live on the map. Thanks for helping keep Atlanta informed.</p>
      <button onClick={onDone} style={{ ...s.btn, maxWidth: 280 }}>Back to map</button>
    </div>
  )

  return (
    <div style={s.wrap}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>Report a booting</h1>
        <button onClick={onCancel} style={{ border: 'none', background: 'none', fontSize: 14, color: '#9ca3af', cursor: 'pointer' }}>Cancel</button>
      </div>

      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        <div style={{ flex: 1, height: 3, borderRadius: 99, background: '#E24B4A' }} />
        <div style={{ flex: 1, height: 3, borderRadius: 99, background: step === 2 ? '#E24B4A' : '#e5e7eb' }} />
      </div>

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Type */}
          <div>
            <span style={s.label}>What happened?</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {([
                { id: 'boot', emoji: '🔒', label: 'Boot on car' },
                { id: 'warning', emoji: '⚠️', label: 'Warning sticker' },
                { id: 'truck', emoji: '🚗', label: 'Boot truck' },
              ] as { id: ReportType; emoji: string; label: string }[]).map(t => (
                <button key={t.id} onClick={() => setType(t.id)} style={{
                  padding: '10px 6px', borderRadius: 12, border: `1.5px solid ${type === t.id ? '#E24B4A' : '#e5e7eb'}`,
                  background: type === t.id ? '#FCEBEB' : '#f9fafb',
                  color: type === t.id ? '#791F1F' : '#6b7280',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                  <span style={{ fontSize: 22 }}>{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <span style={s.label}>Location</span>
            <button onClick={detectLocation} disabled={locating} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10,
              background: '#f9fafb', cursor: 'pointer', marginBottom: 8, textAlign: 'left',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: lat ? '#22c55e' : '#d1d5db', flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: '#6b7280', flex: 1 }}>
                {locating ? 'Detecting…' : lat ? address : 'Use my current location'}
              </span>
              {locating && <div style={{ width: 14, height: 14, border: '2px solid #d1d5db', borderTopColor: '#185FA5', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
            </button>
            {locateError && <p style={{ fontSize: 12, color: '#E24B4A', marginBottom: 6 }}>{locateError}</p>}
            <input
              ref={inputRef}
              value={address}
              onChange={e => { setAddress(e.target.value); setLat(null); setLng(null) }}
              placeholder="Or search address / lot name…"
              style={s.input}
            />
          </div>

          {/* Lot name */}
          <div>
            <span style={s.label}>Lot name <span style={{ textTransform: 'none', fontWeight: 400, color: '#9ca3af' }}>(optional)</span></span>
            <input value={lotName} onChange={e => setLotName(e.target.value)} placeholder="e.g. Krog Street Market lot" style={s.input} />
          </div>

          <button onClick={() => setStep(2)} disabled={!canGoNext} style={{ ...s.btn, opacity: canGoNext ? 1 : 0.4 }}>
            Next →
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <span style={s.label}>Booting company</span>
            <select value={company} onChange={e => setCompany(e.target.value)} style={s.select}>
              <option value="">Not sure</option>
              {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <span style={s.label}>Fee charged <span style={{ textTransform: 'none', fontWeight: 400, color: '#9ca3af' }}>(optional)</span></span>
            <input value={fee} onChange={e => setFee(e.target.value)} placeholder="e.g. 150" type="number" inputMode="numeric" style={s.input} />
          </div>

          <div>
            <span style={s.label}>Notes <span style={{ textTransform: 'none', fontWeight: 400, color: '#9ca3af' }}>(optional)</span></span>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Signage issues, time of day, anything useful…"
              rows={3}
              style={{ ...s.input, resize: 'none' }}
            />
          </div>

          {error && <p style={{ fontSize: 13, color: '#E24B4A' }}>{error}</p>}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setStep(1)} style={s.btnSecondary}>← Back</button>
            <button onClick={handleSubmit} disabled={submitting} style={{ ...s.btn, flex: 2, opacity: submitting ? 0.6 : 1 }}>
              {submitting ? 'Submitting…' : 'Submit report'}
            </button>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}