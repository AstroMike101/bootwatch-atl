'use client'

import { useState } from 'react'
import MapView from '@/components/MapView'
import CompaniesView from '@/components/CompaniesView'
import ReportView from '@/components/ReportView'
import RecentReportsView from '@/components/RecentReportsView'
import SafetySearchView from '@/components/SafetySearchView'
import BottomNav from '@/components/ui/BottomNav'

export type Tab = 'map' | 'search' | 'reports' | 'companies' | 'report'

export default function Home() {
  const [tab, setTab] = useState<Tab>('map')

  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: '#fff' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', padding: '0 16px',
        height: 52, borderBottom: '1px solid #f3f4f6', background: '#fff',
        flexShrink: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#E24B4A' }} />
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px' }}>BootWatch ATL</span>
        </div>
        {tab !== 'report' && (
          <button
            onClick={() => setTab('report')}
            style={{
              marginLeft: 'auto', fontSize: 13, fontWeight: 600,
              padding: '7px 16px', background: '#E24B4A', color: '#fff',
              border: 'none', borderRadius: 10, cursor: 'pointer',
            }}
          >
            + Report
          </button>
        )}
      </header>

      {/* Views */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, display: tab === 'map' ? 'block' : 'none' }}>
          <MapView />
        </div>
        <div style={{ position: 'absolute', inset: 0, display: tab === 'search' ? 'block' : 'none' }}>
          <SafetySearchView />
        </div>
        <div style={{ position: 'absolute', inset: 0, display: tab === 'reports' ? 'block' : 'none' }}>
          <RecentReportsView />
        </div>
        <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', display: tab === 'companies' ? 'block' : 'none' }}>
          <CompaniesView />
        </div>
        <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', display: tab === 'report' ? 'block' : 'none' }}>
          <ReportView onDone={() => setTab('map')} onCancel={() => setTab('map')} />
        </div>
      </div>

      <BottomNav current={tab} onChange={setTab} />
    </main>
  )
}