import { createClient } from '@/lib/supabase/client'
import type { BidInfo, ProjectRecord, CareerRecord } from '@/types'

// ── Bids ─────────────────────────────────────────────────────────────────────

export async function loadBids(): Promise<BidInfo[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('bids')
    .select('*')
    .order('uploadedAt', { ascending: false })
  if (error) { console.error(error); return [] }
  return (data ?? []) as BidInfo[]
}

export async function upsertBid(bid: BidInfo): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('bids').upsert(bid)
  if (error) console.error(error)
}

export async function deleteBid(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('bids').delete().eq('id', id)
  if (error) console.error(error)
}

// ── Projects ──────────────────────────────────────────────────────────────────

export async function loadProjects(): Promise<ProjectRecord[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('projects').select('*')
  if (error) { console.error(error); return [] }
  return (data ?? []) as ProjectRecord[]
}

export async function upsertProject(project: ProjectRecord): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('projects').upsert(project)
  if (error) console.error(error)
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) console.error(error)
}

// ── Careers ───────────────────────────────────────────────────────────────────

export async function loadCareers(): Promise<CareerRecord[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('careers').select('*')
  if (error) { console.error(error); return [] }
  return (data ?? []) as CareerRecord[]
}

export async function upsertCareer(career: CareerRecord): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('careers').upsert(career)
  if (error) console.error(error)
}

export async function deleteCareer(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('careers').delete().eq('id', id)
  if (error) console.error(error)
}
