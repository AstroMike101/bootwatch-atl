'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { mapsLoader } from '@/lib/maps'
import { fetchRecentReports, fetchLotById, fetchReportsByLot, timeAgo, formatFee, riskLabel } from '@/lib/data'
import type { Report, Lot } from '@/types'

const ATLANTA = { lat: 33.749, lng: -84.388 }

export default function MapView() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const userMarkerRef = useRef<google.maps.Marker | null>(null)
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null)

  const [reports, setReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null)
  const [lotReports, setLotReports] = useState<Report[]>([])
  const [lotLoading, setLotLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [filter, setFilter] = useState<'all' | 'boot' | 'warning'>('all')
  const [mapReady, setMapReady] = useState(false)
  const [heatmapOn, setHeatmapOn] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)

  const placeUserMarker = (map: google.maps.Map, lat: number, lng: number) => {
    if (userMarkerRef.current) userMarkerRef.current.setMap(null)
    userMarkerRef.current = new google.maps.Marker({
      position: { lat, lng }, map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10, fillColor: '#185FA5', fillOpacity: 1,
        strokeColor: '#fff', strokeWeight: 3,
      },
      zIndex: 999,
    })
  }

  const goToUserLocation = useCallback((map: google.maps.Map) => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        map.setCenter({ lat, lng })
        map.setZoom(15)
        placeUserMarker(map, lat, lng)
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  const handlePinClick = useCallback(async (report: Report) => {
    setSelectedReport(report)
    setPanelOpen(true)
    setSelectedLot(null)
    setLotReports([])

    if (report.lot_id) {
      setLotLoading(true)
      const [lot, reps] = await Promise.all([
        fetchLotById(report.lot_id),
        fetchReportsByLot(report.lot_id),
      ])
      setSelectedLot(lot)
      setLotReports(reps)
      setLotLoading(false)
    }
  }, [])

  const placeMarkers = useCallback((data: Report[]) => {
    const map = mapInstance.current
    if (!map) return
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []
    const visible = filter === 'all' ? data : data.filter(r => r.type === filter)
    visible.forEach((report) => {
      const marker = new google.maps.Marker({
        position: { lat: report.lat, lng: report.lng }, map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: report.type === 'boot' ? '#E24B4A' : report.type === 'warning' ? '#BA7517' : '#185FA5',
          fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2.5,
        },
        title: report.lot_name ?? report.address,
      })
      marker.addListener('click', () => {
        mapInstance.current?.panTo({ lat: report.lat, lng: report.lng })
        handlePinClick(report)
      })
      markersRef.current.push(marker)
    })
  }, [filter, handlePinClick])

  const buildHeatmap = useCallback((data: Report[]) => {
    const map = mapInstance.current
    if (!map) return
    const points = data.filter(r => r.type === 'boot').map(r => new google.maps.LatLng(r.lat, r.lng))
    if (heatmapRef.current) heatmapRef.current.setMap(null)
    heatmapRef.current = new google.maps.visualization.HeatmapLayer({
      data: points, map: null, radius: 40, opacity: 0.7,
      gradient: ['rgba(0,0,0,0)', 'rgba(255,220,100,0.6)', 'rgba(255,160,50,0.8)', 'rgba(226,75,74,0.9)', 'rgba(150,20,20,1)'],
    })
  }, [])

  useEffect(() => {
    mapsLoader.load().then(() => {
      if (!mapRef.current || mapInstance.current) return
      const map = new google.maps.Map(mapRef.current, {
        center: ATLANTA, zoom: 13,
        disableDefaultUI: true, clickableIcons: false,
        gestureHandling: 'greedy', styles: MAP_STYLES,
      })
      mapInstance.current = map
      setMapReady(true)
      goToUserLocation(map)
      fetchRecentReports(200).then(data => {
        setReports(data)
        placeMarkers(data)
        buildHeatmap(data)
      })
    })
  }, [goToUserLocation, placeMarkers, buildHeatmap])

  useEffect(() => { placeMarkers(reports) }, [filter, reports, placeMarkers])

  useEffect(() => {
    if (!heatmapRef.current || !mapInstance.current) return
    heatmapRef.current.setMap(heatmapOn ? mapInstance.current : null)
    markersRef.current.forEach(m => m.setOpacity(heatmapOn ? 0.2 : 1))
  }, [heatmapOn])

  const closePanel = () => {
    setPanelOpen(false)
    setSelectedReport(null)
    setSelectedLot(null)
    setLotReports([])
  }

  const risk = selectedLot ? riskLabel(selectedLot.risk_score) : null

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex' }}>

      {/* Map */}
      <div ref={mapRef} style={{ flex: 1, height: '100%' }} />

      {!mapReady && (
        <div style={{ position: 'absolute', inset: 0, background: '#f5f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#9ca3af' }}>
          Loading map…
        </div>
      )}

      {mapReady && (
        <>
          {/* Filter pills */}
          <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6, zIndex: 10 }}>
            {(['all', 'boot', 'warning'] as const).map(f => (
              <button key={f} onPointerUp={() => setFilter(f)} style={{
                fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 99,
                border: 'none', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                background: filter === f ? (f === 'boot' ? '#E24B4A' : f === 'warning' ? '#BA7517' : '#1f2937') : '#fff',
                color: filter === f ? '#fff' : '#6b7280',
                touchAction: 'manipulation',
              }}>
                {f === 'all' ? 'All' : f === 'boot' ? 'Boots' : 'Warnings'}
              </button>
            ))}
            <button onPointerUp={() => setHeatmapOn(h => !h)} style={{
              fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 99,
              border: 'none', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
              background: heatmapOn ? '#7C3AED' : '#fff',
              color: heatmapOn ? '#fff' : '#6b7280',
              touchAction: 'manipulation',
            }}>
              🔥 Heatmap
            </button>
          </div>

          {/* Legend */}
          <div style={{
            position: 'absolute', top: 12, right: 12, zIndex: 10,
            background: '#fff', borderRadius: 12, padding: '8px 12px',
            fontSize: 12, color: '#6b7280', display: 'flex', flexDirection: 'column', gap: 6,
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#E24B4A', display: 'inline-block' }} /> Boot
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#BA7517', display: 'inline-block' }} /> Warning
            </span>
          </div>

          {/* Locate me */}
          <button
            onPointerUp={() => mapInstance.current && goToUserLocation(mapInstance.current)}
            style={{
              position: 'absolute', bottom: 20, right: 16, zIndex: 10,
              width: 50, height: 50, borderRadius: '50%',
              background: '#fff', border: '1px solid #e5e7eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              touchAction: 'manipulation',
            }}
          >
            {locating
              ? <div style={{ width: 18, height: 18, border: '2px solid #185FA5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              : (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <circle cx="11" cy="11" r="4" fill="#185FA5" />
                  <circle cx="11" cy="11" r="8.5" stroke="#185FA5" strokeWidth="1.5" fill="none" />
                  <line x1="11" y1="0" x2="11" y2="4" stroke="#185FA5" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="11" y1="18" x2="11" y2="22" stroke="#185FA5" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="0" y1="11" x2="4" y2="11" stroke="#185FA5" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="18" y1="11" x2="22" y2="11" stroke="#185FA5" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
          </button>

          {/* ── Lot / Report detail panel ── */}
          {panelOpen && selectedReport && (
            <div style={{
              position: 'absolute',
              // On mobile: bottom sheet. On desktop: right side panel
              bottom: 0, right: 0,
              width: 'min(100%, 400px)',
              maxHeight: '75%',
              background: '#fff',
              borderRadius: '20px 20px 0 0',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.13)',
              display: 'flex', flexDirection: 'column',
              zIndex: 20,
              animation: 'slideUp 0.22s ease-out',
            }}>
              {/* Handle + close */}
              <div style={{ padding: '12px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div style={{ width: 36, height: 4, borderRadius: 99, background: '#e5e7eb', margin: '0 auto' }} />
              </div>
              <div style={{ padding: '0 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>
                  {selectedLot?.name ?? selectedReport.lot_name ?? 'Parking lot'}
                </span>
                <button onPointerUp={closePanel} style={{ border: 'none', background: 'none', color: '#9ca3af', fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
              </div>

              <div style={{ overflowY: 'auto', flex: 1, padding: '0 16px 24px' }}>

                {/* Lot risk score */}
                {selectedLot && risk && (
                  <div style={{ background: risk.bg, borderRadius: 14, padding: 14, marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: risk.color }}>
                          {risk.label} · Score {selectedLot.risk_score}/100
                        </div>
                        <div style={{ fontSize: 12, color: risk.color, opacity: 0.8, marginTop: 2 }}>
                          Based on report history and recency
                        </div>
                      </div>
                    </div>
                    {/* Score bar */}
                    <div style={{ height: 6, background: 'rgba(0,0,0,0.1)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${selectedLot.risk_score}%`, background: risk.color, borderRadius: 99, transition: 'width 0.4s ease' }} />
                    </div>

                    {/* Lot stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
                      {[
                        { label: 'Total boots', value: selectedLot.total_boots },
                        { label: 'Warnings', value: selectedLot.total_warnings },
                        { label: 'Avg fee', value: formatFee(selectedLot.avg_fee) },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 10, padding: '8px 6px', textAlign: 'center' }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: risk.color }}>{value}</div>
                          <div style={{ fontSize: 10, color: risk.color, opacity: 0.8 }}>{label}</div>
                        </div>
                      ))}
                    </div>

                    {selectedLot.company_name && (
                      <div style={{ marginTop: 10, fontSize: 12, color: risk.color }}>
                        Enforced by <strong>{selectedLot.company_name}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* This specific report */}
                <div style={{ background: '#f9fafb', borderRadius: 14, padding: 14, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
                      background: selectedReport.type === 'boot' ? '#FCEBEB' : '#FAEEDA',
                      color: selectedReport.type === 'boot' ? '#791F1F' : '#633806',
                    }}>
                      {selectedReport.type === 'boot' ? '🔒 Boot' : selectedReport.type === 'warning' ? '⚠️ Warning' : '🚗 Truck'}
                    </span>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{timeAgo(selectedReport.created_at)}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>{selectedReport.address}</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 12, color: '#6b7280', flexWrap: 'wrap' }}>
                    {selectedReport.company_name && <span>By <strong style={{ color: '#374151' }}>{selectedReport.company_name}</strong></span>}
                    {selectedReport.fee && <span>Fee: <strong style={{ color: '#374151' }}>{formatFee(selectedReport.fee)}</strong></span>}
                  </div>
                  {selectedReport.notes && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280', fontStyle: 'italic', background: '#fff', borderRadius: 8, padding: '6px 10px' }}>
                      "{selectedReport.notes}"
                    </div>
                  )}

                  {/* Photos */}
                  {selectedReport.photo_urls && selectedReport.photo_urls.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                      {selectedReport.photo_urls.map((url, i) => (
                        <img key={i} src={url} alt="Report photo" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, cursor: 'pointer' }}
                          onClick={() => window.open(url, '_blank')} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Loading lot */}
                {lotLoading && (
                  <div style={{ textAlign: 'center', padding: 20, fontSize: 13, color: '#9ca3af' }}>Loading lot history…</div>
                )}

                {/* Other recent reports at this lot */}
                {!lotLoading && lotReports.length > 1 && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 10 }}>
                      All reports at this lot
                      <span style={{ fontSize: 12, fontWeight: 400, color: '#9ca3af', marginLeft: 6 }}>({lotReports.length} total)</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {lotReports.filter(r => r.id !== selectedReport.id).slice(0, 5).map(r => (
                        <div key={r.id} style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                              background: r.type === 'boot' ? '#FCEBEB' : '#FAEEDA',
                              color: r.type === 'boot' ? '#791F1F' : '#633806',
                            }}>
                              {r.type === 'boot' ? '🔒 Boot' : r.type === 'warning' ? '⚠️ Warning' : '🚗 Truck'}
                            </span>
                            {r.fee && <span style={{ fontSize: 12, color: '#374151', marginLeft: 8 }}>{formatFee(r.fee)}</span>}
                            {r.notes && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4, fontStyle: 'italic' }}>"{r.notes}"</div>}
                          </div>
                          <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>{timeAgo(r.created_at)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No lot data */}
                {!lotLoading && !selectedLot && (
                  <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 13, color: '#9ca3af' }}>
                    No lot history available yet
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @media (min-width: 768px) {
          .lot-panel {
            border-radius: 20px !important;
            top: 12px !important;
            bottom: 12px !important;
            right: 12px !important;
            max-height: calc(100% - 24px) !important;
          }
        }
      `}</style>
    </div>
  )
}

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f0' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f0' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e0e0e0' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9d8e8' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
]