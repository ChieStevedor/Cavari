import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — check your .env file.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// ── Members ──────────────────────────────────────────────────────────────────

export async function getMembers() {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getMemberById(id) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createMember(member) {
  const { data, error } = await supabase
    .from('members')
    .insert(member)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateMember(id, updates) {
  const { data, error } = await supabase
    .from('members')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteMember(id) {
  const { error } = await supabase.from('members').delete().eq('id', id)
  if (error) throw error
}

// ── Firmographic data ─────────────────────────────────────────────────────────

export async function getFirmographicData(memberId) {
  const { data, error } = await supabase
    .from('firmographic_data')
    .select('*')
    .eq('member_id', memberId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertFirmographicData(memberId, values) {
  const { data, error } = await supabase
    .from('firmographic_data')
    .upsert({ member_id: memberId, ...values, updated_at: new Date().toISOString() },
             { onConflict: 'member_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Engagement data ───────────────────────────────────────────────────────────

export async function getEngagementData(memberId) {
  const { data, error } = await supabase
    .from('engagement_data')
    .select('*')
    .eq('member_id', memberId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertEngagementData(memberId, values) {
  const { data, error } = await supabase
    .from('engagement_data')
    .upsert({ member_id: memberId, ...values, updated_at: new Date().toISOString() },
             { onConflict: 'member_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Specification data ────────────────────────────────────────────────────────

export async function getSpecificationData(memberId) {
  const { data, error } = await supabase
    .from('specification_data')
    .select('*')
    .eq('member_id', memberId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertSpecificationData(memberId, values) {
  const { data, error } = await supabase
    .from('specification_data')
    .upsert({ member_id: memberId, ...values, updated_at: new Date().toISOString() },
             { onConflict: 'member_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Relationship events ───────────────────────────────────────────────────────

export async function getRelationshipEvents(memberId) {
  const { data, error } = await supabase
    .from('relationship_events')
    .select('*')
    .eq('member_id', memberId)
    .order('logged_at', { ascending: false })
  if (error) throw error
  return data
}

export async function logRelationshipEvent(memberId, eventType, notes, loggedBy) {
  const { data, error } = await supabase
    .from('relationship_events')
    .insert({ member_id: memberId, event_type: eventType, notes, logged_by: loggedBy })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Scores ────────────────────────────────────────────────────────────────────

export async function insertScore(scoreRow) {
  const { data, error } = await supabase
    .from('scores')
    .insert(scoreRow)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getLatestScore(memberId) {
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('member_id', memberId)
    .order('calculated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getScoreHistory(memberId, weeks = 12) {
  const since = new Date()
  since.setDate(since.getDate() - weeks * 7)
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('member_id', memberId)
    .gte('calculated_at', since.toISOString())
    .order('calculated_at', { ascending: true })
  if (error) throw error
  return data
}

export async function getAllLatestScores() {
  // Uses the member_latest_scores view
  const { data, error } = await supabase
    .from('member_latest_scores')
    .select('*')
  if (error) throw error
  return data
}

// ── Triggered actions ─────────────────────────────────────────────────────────

export async function getPendingActions() {
  const { data, error } = await supabase
    .from('triggered_actions')
    .select('*, members(full_name, studio_name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getMemberActions(memberId) {
  const { data, error } = await supabase
    .from('triggered_actions')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function updateActionStatus(id, status) {
  const { data, error } = await supabase
    .from('triggered_actions')
    .update({ status, actioned_at: status !== 'pending' ? new Date().toISOString() : null })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function insertTriggeredAction(action) {
  // Deduplicate: skip if identical pending trigger already exists
  const { data: existing } = await supabase
    .from('triggered_actions')
    .select('id')
    .eq('member_id', action.member_id)
    .eq('trigger_type', action.trigger_type)
    .eq('status', 'pending')
    .maybeSingle()
  if (existing) return existing

  const { data, error } = await supabase
    .from('triggered_actions')
    .insert(action)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Recalculation log ─────────────────────────────────────────────────────────

export async function insertRecalcLog(log) {
  const { data, error } = await supabase
    .from('recalculation_log')
    .insert(log)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getRecalcLog(limit = 20) {
  const { data, error } = await supabase
    .from('recalculation_log')
    .select('*, admin_users(name)')
    .order('calculated_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

// ── Admin users ───────────────────────────────────────────────────────────────

export async function getAdminUser(userId) {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}
