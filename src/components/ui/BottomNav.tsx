'use client'

import type { Tab } from '@/app/page'

interface Props {
  current: Tab
  onChange: (tab: Tab) => void
}

export default function BottomNav({ current, onChange }: Props) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'map', label: 'Map' },
    { id: 'companies', label: 'Companies' },
    { id: 'report', label: 'Report' },
  ]

  return (
    <nav style={{
      display: 'flex', borderTop: '1px solid #f3f4f6',
      background: '#fff', flexShrink: 0,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {tabs.map((t) => {
        const active = current === t.id
        const isReport = t.id === 'report'
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 3, padding: '10px 0',
              border: 'none', background: 'transparent', cursor: 'pointer',
              color: active ? '#E24B4A' : '#9ca3af',
              transition: 'color 0.15s',
            }}
          >
            {t.id === 'map' && (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 2C8.24 2 6 4.24 6 7c0 4.5 5 13 5 13s5-8.5 5-13c0-2.76-2.24-5-5-5z"
                  stroke="currentColor" strokeWidth="1.6" fill={active ? '#E24B4A' : 'none'}/>
                <circle cx="11" cy="7" r="2" fill={active ? '#fff' : 'currentColor'}/>
              </svg>
            )}
            {t.id === 'companies' && (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="3" y="7" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" fill={active ? '#E24B4A' : 'none'}/>
                <path d="M7 7V6a4 4 0 018 0v1" stroke="currentColor" strokeWidth="1.6"/>
                <circle cx="11" cy="13" r="2" fill={active ? '#fff' : 'currentColor'}/>
              </svg>
            )}
            {t.id === 'report' && (
              <div style={{ position: 'relative' }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.6" fill={active ? '#E24B4A' : 'none'}/>
                  <path d="M11 7v4M11 15h.01" stroke={active ? '#fff' : 'currentColor'} strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
                {!active && (
                  <div style={{
                    position: 'absolute', top: -2, right: -2,
                    width: 7, height: 7, borderRadius: '50%',
                    background: '#E24B4A', border: '1.5px solid #fff',
                  }} />
                )}
              </div>
            )}
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
