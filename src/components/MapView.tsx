'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { mapsLoader } from '@/lib/maps'
import { fetchRecentReports, timeAgo, formatFee } from '@/lib/data'
import type { Report } from '@/types'

const ATLANTA = { lat: 33.749, lng: -84.388 }

export default function MapView() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const userMarkerRef = useRef<google.maps.Marker | null>(null)
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [selected, setSelected] = useState<Report | null>(null)
  const [locating, setLocating] = useState(false)
  const [filter, setFilter] = useState<'all' | 'boot' | 'warning'>('all')
  const [mapReady, setMapReady] = useState(false)
  const [heatmapOn, setHeatmapOn] = useState(false)

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
          fillColor: report.type === 'boot' ? '#E24B4A' : '#BA7517',
          fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2.5,
        },
        title: report.lot_name ?? report.address,
      })
      marker.addListener('click', () => setSelected(report))
      markersRef.current.push(marker)
    })
  }, [filter])

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
      fetchRecentReports(150).then(data => {
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

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {!mapReady && (
        <div style={{ position: 'absolute', inset: 0, background: '#f5f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#9ca3af' }}>
          Loading map…
        </div>
      )}

      {mapReady && (
        <>
          {/* Filter pills — top left */}
          <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
            {(['all', 'boot', 'warning'] as const).map(f => (
              <button key={f} onPointerUp={() => setFilter(f)} style={{
                fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 99,
                border: 'none', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                background: filter === f ? (f === 'boot' ? '#E24B4A' : f === 'warning' ? '#BA7517' : '#1f2937') : '#fff',
                color: filter === f ? '#fff' : '#6b7280',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>
                {f === 'all' ? 'All' : f === 'boot' ? 'Boots' : 'Warnings'}
              </button>
            ))}
            <button onPointerUp={() => setHeatmapOn(h => !h)} style={{
              fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 99,
              border: 'none', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
              background: heatmapOn ? '#7C3AED' : '#fff',
              color: heatmapOn ? '#fff' : '#6b7280',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
              🔥 Heatmap
            </button>
          </div>

          {/* Legend — top right */}
          <div style={{
            position: 'absolute', top: 12, right: 12, background: '#fff', borderRadius: 12,
            padding: '8px 12px', fontSize: 12, color: '#6b7280',
            display: 'flex', flexDirection: 'column', gap: 6,
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#E24B4A', display: 'inline-block' }} /> Boot
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#BA7517', display: 'inline-block' }} /> Warning
            </span>
          </div>

          {/* Locate me — bottom right */}
          <button
            onPointerUp={() => mapInstance.current && goToUserLocation(mapInstance.current)}
            style={{
              position: 'absolute', bottom: 20, right: 16,
              width: 50, height: 50, borderRadius: '50%',
              background: '#fff', border: '1px solid #e5e7eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
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

          {/* Selected pin popup */}
          {selected && (
            <div style={{
              position: 'absolute', bottom: 20, left: 12, right: 72,
              background: '#fff', borderRadius: 16, padding: 14,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
                  background: selected.type === 'boot' ? '#FCEBEB' : '#FAEEDA',
                  color: selected.type === 'boot' ? '#791F1F' : '#633806',
                }}>
                  {selected.type === 'boot' ? '🔒 Boot' : selected.type === 'warning' ? '⚠️ Warning' : '🚗 Truck'}
                </span>
                <button onPointerUp={() => setSelected(null)} style={{ border: 'none', background: 'none', color: '#9ca3af', fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{selected.lot_name ?? selected.address}</div>
              {selected.lot_name && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{selected.address}</div>}
              <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 12, color: '#6b7280', flexWrap: 'wrap' }}>
                {selected.company_name && <span>By <strong style={{ color: '#374151' }}>{selected.company_name}</strong></span>}
                {selected.fee && <span>Fee: <strong style={{ color: '#374151' }}>{formatFee(selected.fee)}</strong></span>}
                <span>{timeAgo(selected.created_at)}</span>
              </div>
              {selected.notes && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>"{selected.notes}"</div>
              )}
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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