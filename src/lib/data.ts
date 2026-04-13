import { supabase } from './supabase'
import type { Report, Company, NewReport } from '@/types'

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

export async function fetchReportsNear(lat: number, lng: number, radiusDeg = 0.1): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .gte('lat', lat - radiusDeg)
    .lte('lat', lat + radiusDeg)
    .gte('lng', lng - radiusDeg)
    .lte('lng', lng + radiusDeg)
    .gte('created_at', new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function submitReport(report: NewReport): Promise<void> {
  const { error } = await supabase.from('reports').insert(report)
  if (error) throw error
}

export async function fetchCompanies(): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('total_boots', { ascending: false })

  if (error) throw error
  return data ?? []
}

export function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function formatFee(fee: number | null): string {
  if (!fee) return '—'
  return `$${fee}`
}
