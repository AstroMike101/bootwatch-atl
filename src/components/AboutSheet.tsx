'use client'

import { useState } from 'react'

export default function AboutSheet() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* ⓘ button — sits in the header */}
      <button
        onClick={() => setOpen(true)}
        style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '1.5px solid #e5e7eb',
          background: '#f9fafb',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: 14, color: '#6b7280',
          flexShrink: 0,
        }}
        aria-label="About BootWatch"
      >
        ⓘ
      </button>

      {!open ? null : (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(2px)',
              animation: 'fadeIn 0.2s ease',
            }}
          />

          {/* Sheet */}
          <div style={{
            position: 'fixed', zIndex: 1001,
            bottom: 0, left: 0, right: 0,
            background: '#fff',
            borderRadius: '24px 24px 0 0',
            padding: '28px 24px 48px',
            maxWidth: 520,
            margin: '0 auto',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
            animation: 'slideUp 0.3s cubic-bezier(0.4,0,0.2,1)',
            maxHeight: '85vh',
            overflowY: 'auto',
          }}>
            {/* Handle */}
            <div style={{ width: 40, height: 4, borderRadius: 99, background: '#e5e7eb', margin: '0 auto 24px' }} />

            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              style={{ position: 'absolute', top: 20, right: 20, border: 'none', background: 'none', fontSize: 22, color: '#9ca3af', cursor: 'pointer', lineHeight: 1 }}
            >×</button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#E24B4A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '3px solid #fff' }} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#111' }}>BootWatch ATL</div>
              </div>
            </div>

            {/* Story */}
            <div style={{ background: '#f9fafb', borderRadius: 14, padding: '16px', marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 8 }}>Why I built this</div>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>
                Atlanta's booting industry operates in the shadows — predatory enforcement, missing signage, and fees that feel impossible to dispute. I built BootWatch to give Atlanta drivers the information they need to protect themselves, and to create a public record of where and how booting companies operate across the city.
              </p>
            </div>

            {/* Contact */}
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 12 }}>Get in touch</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              <a
                href="mailto:michaelchendevs@gmail.com"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '13px 16px', borderRadius: 12,
                  background: '#f9fafb', border: '1px solid #f0f0f0',
                  textDecoration: 'none', color: '#111',
                  fontSize: 14, fontWeight: 500,
                }}
              >
                <span style={{ fontSize: 20 }}>✉️</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Email</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>michaelchendevs@gmail.com</div>
                </div>
              </a>

              <a
                href="https://michaelchen.live"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '13px 16px', borderRadius: 12,
                  background: '#f9fafb', border: '1px solid #f0f0f0',
                  textDecoration: 'none', color: '#111',
                  fontSize: 14, fontWeight: 500,
                }}
              >
                <span style={{ fontSize: 20 }}>🌐</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Website</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>michaelchen.live</div>
                </div>
              </a>
            </div>

            {/* Donate */}
            <div style={{ background: '#EFF6FF', borderRadius: 14, padding: '16px', marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1e40af', marginBottom: 6 }}>☕ Support BootWatch</div>
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 12 }}>
                BootWatch is free and ad-free. Keeping it running — maps, database, hosting — costs real money. If it's ever saved you from a boot, consider buying me a coffee.
              </p>
              <a
                href="https://buymeacoffee.com/michaelchendevs"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '12px',
                  background: '#FFDD00', color: '#111',
                  fontSize: 14, fontWeight: 700,
                  borderRadius: 12, textDecoration: 'none',
                  boxSizing: 'border-box',
                }}
              >
                ☕ Buy me a coffee
              </a>
            </div>

            <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', margin: 0 }}>
              © {new Date().getFullYear()} Michael Chen · michaelchen.live
            </p>
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </>
  )
}