export type ReportType = 'boot' | 'warning' | 'truck'

export interface Report {
  id: string
  type: ReportType
  lot_name: string | null
  address: string
  lat: number
  lng: number
  lot_id: string | null
  company_id: string | null
  company_name: string | null
  fee: number | null
  notes: string | null
  photo_urls: string[]
  ip_address: string | null
  created_at: string
}

export interface Lot {
  id: string
  name: string | null
  address: string
  lat: number
  lng: number
  company_id: string | null
  company_name: string | null
  total_boots: number
  total_warnings: number
  total_reports: number
  avg_fee: number | null
  last_reported_at: string | null
  risk_score: number
  created_at: string
}

export interface Company {
  id: string
  name: string
  initials: string
  type: string
  phone: string | null
  website: string | null
  avg_fee: number | null
  total_boots: number
  total_complaints: number
  rating: number | null
  legal_flags: number
  tags: string[]
  created_at: string
}

export interface NewReport {
  type: ReportType
  address: string
  lat: number
  lng: number
  lot_name?: string
  company_name?: string
  fee?: number
  notes?: string
  photo_urls?: string[]
}