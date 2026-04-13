import { supabase } from '@/lib/supabase'
import type { Report, Company, Lot, NewReport } from '@/types'

// ── Reports ──────────────────────────────────────────────────────────────────

export async function fetchRecentReports(limit = 100): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .gte('created_at', new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function fetchReportsByLot(lotId: string, limit = 20): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('lot_id', lotId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

// ── Lots ─────────────────────────────────────────────────────────────────────

export async function fetchLots(): Promise<Lot[]> {
  const { data, error } = await supabase
    .from('lots')
    .select('*')
    .order('risk_score', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchLotById(id: string): Promise<Lot | null> {
  const { data, error } = await supabase
    .from('lots')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function fetchHighRiskLots(limit = 10): Promise<Lot[]> {
  const { data, error } = await supabase
    .from('lots')
    .select('*')
    .gte('risk_score', 10)
    .order('risk_score', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

// Search lots by address text — used for "Is it safe to park here?"
export async function searchLots(query: string): Promise<Lot[]> {
  const { data, error } = await supabase
    .from('lots')
    .select('*')
    .or(`address.ilike.%${query}%,name.ilike.%${query}%`)
    .order('risk_score', { ascending: false })
    .limit(8)
  if (error) throw error
  return data ?? []
}

// Search lots near a lat/lng — used after geocoding a typed address
export async function fetchLotsNear(lat: number, lng: number, radiusDeg = 0.005): Promise<Lot[]> {
  const { data, error } = await supabase
    .from('lots')
    .select('*')
    .gte('lat', lat - radiusDeg)
    .lte('lat', lat + radiusDeg)
    .gte('lng', lng - radiusDeg)
    .lte('lng', lng + radiusDeg)
    .order('risk_score', { ascending: false })
    .limit(5)
  if (error) throw error
  return data ?? []
}

// ── Neighborhoods ─────────────────────────────────────────────────────────────
// Atlanta neighborhoods defined by rough bounding boxes
// We classify each lot into a neighborhood client-side

export interface NeighborhoodStats {
  name: string
  boots: number
  warnings: number
  avgFee: number | null
  topLot: string | null
  riskScore: number // avg risk score of lots in neighborhood
}

const NEIGHBORHOODS: { name: string; latMin: number; latMax: number; lngMin: number; lngMax: number }[] = [
  { name: 'Downtown',        latMin: 33.740, latMax: 33.758, lngMin: -84.400, lngMax: -84.375 },
  { name: 'Midtown',         latMin: 33.758, latMax: 33.785, lngMin: -84.400, lngMax: -84.370 },
  { name: 'Buckhead',        latMin: 33.820, latMax: 33.870, lngMin: -84.395, lngMax: -84.345 },
  { name: 'Old Fourth Ward', latMin: 33.748, latMax: 33.768, lngMin: -84.380, lngMax: -84.350 },
  { name: 'Inman Park',      latMin: 33.752, latMax: 33.768, lngMin: -84.365, lngMax: -84.345 },
  { name: 'Virginia Highland',latMin: 33.765, latMax: 33.785, lngMin: -84.368, lngMax: -84.342 },
  { name: 'West Midtown',    latMin: 33.778, latMax: 33.800, lngMin: -84.425, lngMax: -84.395 },
  { name: 'Grant Park',      latMin: 33.730, latMax: 33.752, lngMin: -84.385, lngMax: -84.355 },
  { name: 'Cabbagetown',     latMin: 33.742, latMax: 33.758, lngMin: -84.368, lngMax: -84.350 },
  { name: 'Little Five Points',latMin: 33.757, latMax: 33.768, lngMin: -84.358, lngMax: -84.344 },
]

export function classifyNeighborhood(lat: number, lng: number): string {
  for (const n of NEIGHBORHOODS) {
    if (lat >= n.latMin && lat <= n.latMax && lng >= n.lngMin && lng <= n.lngMax) {
      return n.name
    }
  }
  return 'Other Atlanta'
}

export function computeNeighborhoodStats(lots: Lot[]): NeighborhoodStats[] {
  const map = new Map<string, { boots: number; warnings: number; fees: number[]; lots: Lot[] }>()

  for (const lot of lots) {
    const hood = classifyNeighborhood(Number(lot.lat), Number(lot.lng))
    if (!map.has(hood)) map.set(hood, { boots: 0, warnings: 0, fees: [], lots: [] })
    const entry = map.get(hood)!
    entry.boots += lot.total_boots
    entry.warnings += lot.total_warnings
    entry.lots.push(lot)
    if (lot.avg_fee) entry.fees.push(lot.avg_fee)
  }

  const stats: NeighborhoodStats[] = []
  map.forEach((val, name) => {
    const topLot = val.lots.sort((a, b) => b.risk_score - a.risk_score)[0]
    const avgRisk = Math.round(val.lots.reduce((s, l) => s + l.risk_score, 0) / val.lots.length)
    stats.push({
      name,
      boots: val.boots,
      warnings: val.warnings,
      avgFee: val.fees.length ? Math.round(val.fees.reduce((a, b) => a + b, 0) / val.fees.length) : null,
      topLot: topLot?.name ?? topLot?.address ?? null,
      riskScore: avgRisk,
    })
  })

  return stats.filter(s => s.boots + s.warnings > 0).sort((a, b) => b.boots - a.boots)
}

// ── Companies ─────────────────────────────────────────────────────────────────

export async function fetchCompanies(): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('total_boots', { ascending: false })
  if (error) throw error
  return data ?? []
}

// ── Photo upload ──────────────────────────────────────────────────────────────

export async function uploadReportPhoto(file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from('report-photos')
    .upload(filename, file, { contentType: file.type, upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('report-photos').getPublicUrl(filename)
  return data.publicUrl
}

// ── Submit report ─────────────────────────────────────────────────────────────

async function getClientIp(): Promise<string | null> {
  try {
    const res = await fetch('https://api.ipify.org?format=json')
    const data = await res.json()
    return data.ip ?? null
  } catch { return null }
}

export async function submitReport(report: NewReport): Promise<void> {
  const ip_address = await getClientIp()
  const { error } = await supabase.from('reports').insert({ ...report, ip_address })
  if (error) {
    if (error.message?.includes('Rate limit exceeded')) throw new Error('Rate limit exceeded. You can submit up to 3 reports per hour in the same area.')
    if (error.message?.includes('Duplicate report')) throw new Error('Duplicate report. This location was already reported recently.')
    throw error
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function formatFee(fee: number | null | undefined): string {
  if (!fee) return '—'
  return `$${fee}`
}

export function riskLabel(score: number): { label: string; color: string; bg: string; emoji: string } {
  if (score >= 70) return { label: 'High risk', color: '#791F1F', bg: '#FCEBEB', emoji: '🔴' }
  if (score >= 40) return { label: 'Moderate risk', color: '#633806', bg: '#FAEEDA', emoji: '🟡' }
  if (score >= 10) return { label: 'Low risk', color: '#27500A', bg: '#EAF3DE', emoji: '🟢' }
  return { label: 'Looks safe', color: '#1e40af', bg: '#EFF6FF', emoji: '✅' }
}