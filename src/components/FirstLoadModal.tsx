'use client'

import { useEffect, useState } from 'react'

const SEEN_KEY = 'bootwatch_seen_intro'

export default function FirstLoadModal() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(SEEN_KEY)) setVisible(true)
    } catch {}
  }, [])

  const dismiss = () => {
    try { localStorage.setItem(SEEN_KEY, '1') } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={dismiss}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(2px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Card */}
      <div style={{
        position: 'fixed', zIndex: 1001,
        bottom: 0, left: 0, right: 0,
        background: '#fff',
        borderRadius: '24px 24px 0 0',
        padding: '28px 24px 36px',
        maxWidth: 520,
        margin: '0 auto',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
        animation: 'slideUp 0.3s cubic-bezier(0.4,0,0.2,1)',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 99, background: '#e5e7eb', margin: '0 auto 24px' }} />

        {/* Logo + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#E24B4A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', border: '3px solid #fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#111' }}>ATL BootWatch</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Crowdsourced boot protection for Atlanta</div>
          </div>
        </div>

        <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.6, marginBottom: 20 }}>
          Getting booted in Atlanta is frustrating - and often avoidable. BootWatch lets Atlanta drivers share real-time boot sightings, look up risky lots before parking, and hold enforcement companies accountable.
        </p>

        {/* Feature tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[
            { emoji: '🗺️', title: 'Map', desc: 'See live boot reports near you' },
            { emoji: '🔍', title: 'Search', desc: 'Check any lot before you park' },
            { emoji: '📣', title: 'Report', desc: 'Submit a boot in 30 seconds' },
          ].map(({ emoji, title, desc }) => (
            <div key={title} style={{ background: '#f9fafb', borderRadius: 14, padding: '12px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 3 }}>{title}</div>
              <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.4 }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* How data works */}
        <div style={{ background: '#f9fafb', borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 10 }}>📊 How the data works</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { emoji: '⏱️', text: 'Map pins show reports from the last 72 hours - older reports are automatically removed to keep the map current.' },
              { emoji: '👥', text: 'All reports are crowdsourced by real Atlanta drivers like you. The more people report, the more accurate it gets.' },
              { emoji: '🔥', text: 'The heatmap shows boot density - red zones have the most reported boots in the past 72 hours.' },
              { emoji: '⭐', text: 'Lot risk scores update automatically every time a new report comes in for that location.' },
            ].map(({ emoji, text }) => (
              <div key={emoji} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{emoji}</span>
                <span style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Built by + donate */}
        <div style={{ background: '#EFF6FF', borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1e40af', marginBottom: 6 }}>❤️ Built for Atlanta drivers</div>
          <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, marginBottom: 12 }}>
            BootWatch was built to give Atlanta drivers a fighting chance against aggressive parking enforcement. It's free, ad-free, and always will be.
          </div>
          <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, marginBottom: 12 }}>
            Running the map costs real money - Google Maps API, database hosting, and server costs add up. If BootWatch has ever saved you from a boot, consider helping keep it alive.
          </div>
          <a
            href="https://buymeacoffee.com/michaelchendevs" // 
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '12px',
              background: '#FFDD00', color: '#111',
              fontSize: 14, fontWeight: 700,
              border: 'none', borderRadius: 12, cursor: 'pointer',
              textDecoration: 'none',
              boxSizing: 'border-box',
            }}
          >
            ☕ Support the cause 
          </a>
        </div>

        <button
          onClick={dismiss}
          style={{
            width: '100%', padding: '15px',
            background: '#E24B4A', color: '#fff',
            fontSize: 16, fontWeight: 700,
            border: 'none', borderRadius: 14, cursor: 'pointer',
          }}
        >
          Got it - show me the map
        </button>

        <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 12 }}>
          100% free · No account needed · Built with ❤️ in Atlanta
        </p>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </>
  )
}