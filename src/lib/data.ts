import { supabase } from './supabase'
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
    .gte('risk_score', 40)
    .order('risk_score', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
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
    if (error.message?.includes('Rate limit exceeded')) {
      throw new Error('Rate limit exceeded. You can submit up to 3 reports per hour in the same area.')
    }
    if (error.message?.includes('Duplicate report')) {
      throw new Error('Duplicate report. This location was already reported recently.')
    }
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

export function riskLabel(score: number): { label: string; color: string; bg: string } {
  if (score >= 70) return { label: 'High risk', color: '#791F1F', bg: '#FCEBEB' }
  if (score >= 40) return { label: 'Moderate', color: '#633806', bg: '#FAEEDA' }
  if (score >= 10) return { label: 'Low risk', color: '#27500A', bg: '#EAF3DE' }
  return { label: 'Safe', color: '#1e40af', bg: '#EFF6FF' }
}