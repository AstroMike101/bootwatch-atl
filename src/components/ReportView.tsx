'use client'

import { useState, useRef, useEffect } from 'react'
import { mapsLoader } from '@/lib/maps'
import { submitReport, uploadReportPhoto } from '@/lib/data'
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

const COOLDOWN_MS = 10 * 60 * 1000
const COOLDOWN_KEY = 'bootwatch_last_report'

function getCooldownRemaining(): number {
  try {
    const last = localStorage.getItem(COOLDOWN_KEY)
    if (!last) return 0
    const remaining = COOLDOWN_MS - (Date.now() - parseInt(last))
    return remaining > 0 ? remaining : 0
  } catch { return 0 }
}

function formatCooldown(ms: number): string {
  const mins = Math.ceil(ms / 60000)
  return `${mins} min${mins !== 1 ? 's' : ''}`
}

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
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [cooldownMs, setCooldownMs] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const autocomplete = useRef<google.maps.places.Autocomplete | null>(null)

  useEffect(() => {
    setCooldownMs(getCooldownRemaining())
    const interval = setInterval(() => {
      const r = getCooldownRemaining()
      setCooldownMs(r)
      if (r === 0) clearInterval(interval)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 3) // max 3 photos
    setPhotos(files)
    const previews = files.map(f => URL.createObjectURL(f))
    setPhotoPreviews(previews)
  }

  const removePhoto = (i: number) => {
    setPhotos(p => p.filter((_, idx) => idx !== i))
    setPhotoPreviews(p => p.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async () => {
    if (!lat || !lng || cooldownMs > 0) return
    setSubmitting(true)
    setUploading(photos.length > 0)
    setError('')
    try {
      // Upload photos first
      let photo_urls: string[] = []
      if (photos.length > 0) {
        photo_urls = await Promise.all(photos.map(uploadReportPhoto))
      }
      setUploading(false)

      const report: NewReport = {
        type, address, lat, lng,
        lot_name: lotName.trim() || undefined,
        company_name: company || undefined,
        fee: fee ? parseInt(fee.replace(/\D/g, '')) || undefined : undefined,
        notes: notes.trim() || undefined,
        photo_urls: photo_urls.length > 0 ? photo_urls : undefined,
      }
      await submitReport(report)
      try { localStorage.setItem(COOLDOWN_KEY, Date.now().toString()) } catch {}
      setStep('done')
    } catch (err: unknown) {
      setUploading(false)
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('Rate limit')) {
        setError('Too many reports in this area recently. Please wait an hour before submitting again.')
      } else if (msg.includes('Duplicate')) {
        setError('This location was already reported recently. Thanks for staying alert!')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const canGoNext = address.trim() !== '' && lat !== null && lng !== null

  const wrap: React.CSSProperties = { maxWidth: 560, margin: '0 auto', padding: '32px 24px 60px' }
  const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }
  const input: React.CSSProperties = { width: '100%', padding: '11px 14px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff', outline: 'none', color: '#111', boxSizing: 'border-box' }
  const select: React.CSSProperties = { ...input, appearance: 'none' }
  const btn: React.CSSProperties = { width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, borderRadius: 14, border: 'none', cursor: 'pointer', background: '#E24B4A', color: '#fff' }
  const btnSecondary: React.CSSProperties = { padding: '14px', fontSize: 14, fontWeight: 500, borderRadius: 14, border: '1px solid #e5e7eb', cursor: 'pointer', background: '#fff', color: '#6b7280', flex: 1 }

  if (step === 'done') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: 40, textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <svg width="30" height="30" viewBox="0 0 28 28" fill="none">
          <path d="M6 14l6 6 10-10" stroke="#27500A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Report submitted!</h2>
      <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 6, maxWidth: 360 }}>Your report is live on the map. Thanks for helping keep Atlanta informed.</p>
      <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 32 }}>You can submit another report in 10 minutes.</p>
      <button onClick={onDone} style={{ ...btn, maxWidth: 300 }}>Back to map</button>
    </div>
  )

  if (cooldownMs > 0 && step === 1) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: 40, textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, fontSize: 30 }}>⏳</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Thanks for your report!</h2>
      <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 16, maxWidth: 360 }}>To keep the map accurate, you can submit another report in:</p>
      <div style={{ fontSize: 36, fontWeight: 700, color: '#E24B4A', marginBottom: 32 }}>{formatCooldown(cooldownMs)}</div>
      <button onClick={onCancel} style={{ ...btn, background: '#f3f4f6', color: '#374151', maxWidth: 300 }}>Back to map</button>
    </div>
  )

  return (
    <div style={wrap}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Report a booting</h1>
        <button onClick={onCancel} style={{ border: 'none', background: 'none', fontSize: 14, color: '#9ca3af', cursor: 'pointer' }}>Cancel</button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
        <div style={{ flex: 1, height: 4, borderRadius: 99, background: '#E24B4A' }} />
        <div style={{ flex: 1, height: 4, borderRadius: 99, background: step === 2 ? '#E24B4A' : '#e5e7eb' }} />
      </div>

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <span style={label}>What happened?</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {([
                { id: 'boot', emoji: '🔒', label: 'Boot on car' },
                { id: 'warning', emoji: '⚠️', label: 'Warning sticker' },
                { id: 'truck', emoji: '🚗', label: 'Boot truck' },
              ] as { id: ReportType; emoji: string; label: string }[]).map(t => (
                <button key={t.id} onClick={() => setType(t.id)} style={{
                  padding: '14px 8px', borderRadius: 14,
                  border: `2px solid ${type === t.id ? '#E24B4A' : '#e5e7eb'}`,
                  background: type === t.id ? '#FCEBEB' : '#f9fafb',
                  color: type === t.id ? '#791F1F' : '#6b7280',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ fontSize: 26 }}>{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span style={label}>Location</span>
            <button onClick={detectLocation} disabled={locating} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 14px', border: '1px solid #e5e7eb', borderRadius: 12,
              background: '#f9fafb', cursor: 'pointer', marginBottom: 10, textAlign: 'left', boxSizing: 'border-box',
            }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: lat ? '#22c55e' : '#d1d5db', flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: '#6b7280', flex: 1 }}>
                {locating ? 'Detecting…' : lat ? address : 'Use my current location'}
              </span>
              {locating && <div style={{ width: 14, height: 14, border: '2px solid #d1d5db', borderTopColor: '#185FA5', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
            </button>
            {locateError && <p style={{ fontSize: 12, color: '#E24B4A', marginBottom: 8 }}>{locateError}</p>}
            <input ref={inputRef} value={address} onChange={e => { setAddress(e.target.value); setLat(null); setLng(null) }} placeholder="Or search address / lot name…" style={input} />
          </div>

          <div>
            <span style={label}>Lot name <span style={{ textTransform: 'none', fontWeight: 400, color: '#9ca3af' }}>(optional)</span></span>
            <input value={lotName} onChange={e => setLotName(e.target.value)} placeholder="e.g. Krog Street Market lot" style={input} />
          </div>

          <button onClick={() => setStep(2)} disabled={!canGoNext} style={{ ...btn, opacity: canGoNext ? 1 : 0.4 }}>
            Next →
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <span style={label}>Booting company</span>
            <select value={company} onChange={e => setCompany(e.target.value)} style={select}>
              <option value="">Not sure</option>
              {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <span style={label}>Fee charged <span style={{ textTransform: 'none', fontWeight: 400, color: '#9ca3af' }}>(optional)</span></span>
            <input value={fee} onChange={e => setFee(e.target.value)} placeholder="e.g. 150" type="number" inputMode="numeric" style={input} />
          </div>

          <div>
            <span style={label}>Notes <span style={{ textTransform: 'none', fontWeight: 400, color: '#9ca3af' }}>(optional)</span></span>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Signage issues, time of day, anything useful…" rows={4} style={{ ...input, resize: 'none' }} />
          </div>

          {/* Photo upload */}
          <div>
            <span style={label}>Photos <span style={{ textTransform: 'none', fontWeight: 400, color: '#9ca3af' }}>(optional, up to 3)</span></span>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoChange} style={{ display: 'none' }} />

            {photoPreviews.length > 0 && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                {photoPreviews.map((url, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10 }} />
                    <button onClick={() => removePhoto(i)} style={{
                      position: 'absolute', top: -6, right: -6,
                      width: 20, height: 20, borderRadius: '50%',
                      background: '#E24B4A', color: '#fff', border: 'none',
                      fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>×</button>
                  </div>
                ))}
              </div>
            )}

            {photos.length < 3 && (
              <button onClick={() => fileInputRef.current?.click()} style={{
                width: '100%', padding: '12px', borderRadius: 12,
                border: '2px dashed #e5e7eb', background: '#f9fafb',
                fontSize: 14, color: '#6b7280', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                📷 {photos.length === 0 ? 'Add photos of the boot or signage' : 'Add another photo'}
              </button>
            )}
            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>Photos help verify reports and support disputes</p>
          </div>

          {error && (
            <div style={{ background: '#FCEBEB', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#791F1F' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep(1)} style={btnSecondary}>← Back</button>
            <button onClick={handleSubmit} disabled={submitting || cooldownMs > 0} style={{ ...btn, flex: 2, opacity: (submitting || cooldownMs > 0) ? 0.6 : 1 }}>
              {uploading ? 'Uploading photos…' : submitting ? 'Submitting…' : 'Submit report'}
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}