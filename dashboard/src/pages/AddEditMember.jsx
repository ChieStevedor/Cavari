import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getMemberById,
  getFirmographicData,
  getEngagementData,
  getSpecificationData,
  createMember,
  updateMember,
  upsertFirmographicData,
  upsertEngagementData,
  upsertSpecificationData,
} from '../lib/supabase'
import { recalculateMemberScore } from '../lib/recalculate'

// ── Option sets ───────────────────────────────────────────────────────────────

const TIER_OPTIONS = [
  { value: 'prospect',  label: 'Prospect' },
  { value: 'associate', label: 'Associate' },
  { value: 'studio',    label: 'Studio' },
  { value: 'atelier',   label: 'Atelier' },
]

const FIRM_SIZE_OPTIONS = [
  { value: 'solo',  label: 'Solo (1 person)' },
  { value: 'small', label: 'Small (2–5)' },
  { value: 'mid',   label: 'Mid (6–20)' },
  { value: 'large', label: 'Large (20+)' },
]

const PROJECT_TYPE_OPTIONS = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial',  label: 'Commercial' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'mixed',       label: 'Mixed' },
]

const GEOGRAPHY_OPTIONS = [
  { value: 'nyc_la',           label: 'NYC / LA' },
  { value: 'major_secondary',  label: 'Toronto / Chicago / Miami' },
  { value: 'other_major',      label: 'Other major city' },
  { value: 'secondary',        label: 'Secondary market' },
]

const YEARS_OPTIONS = [
  { value: 'less_2',   label: 'Less than 2 years' },
  { value: 'two_5',    label: '2–5 years' },
  { value: 'five_10',  label: '5–10 years' },
  { value: 'ten_plus', label: '10+ years' },
]

const OUTREACH_OPTIONS = [
  { value: 'none',     label: 'No response' },
  { value: 'replied',  label: 'Replied' },
  { value: 'positive', label: 'Positive / warm' },
]

const TREND_OPTIONS = [
  { value: 'declining', label: 'Declining' },
  { value: 'flat',      label: 'Flat' },
  { value: 'growing',   label: 'Growing' },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function AddEditMember() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const isEdit    = Boolean(id)

  const [loading, setSaving] = useState(false)
  const [loadingData, setLoadingData] = useState(isEdit)
  const [error, setError] = useState('')

  // Form state
  const [profile, setProfile] = useState({
    full_name: '', email: '', studio_name: '', trade_tier: 'prospect', klaviyo_profile_id: '',
  })
  const [firmo, setFirmo] = useState({
    firm_size: '', project_type: '', geography: '', years_in_practice: '',
  })
  const [eng, setEng] = useState({
    email_open_rate: 0, link_clicks_90d: 0, trade_page_revisits: 0, outreach_response: 'none',
  })
  const [spec, setSpec] = useState({
    projects_registered: 0, orders_placed: 0, total_order_value: 0,
    brand_coverage_ratio: 0, days_to_first_order: '', order_value_trend: 'flat',
  })

  useEffect(() => {
    if (!isEdit) return
    async function load() {
      try {
        const [m, f, e, s] = await Promise.all([
          getMemberById(id),
          getFirmographicData(id),
          getEngagementData(id),
          getSpecificationData(id),
        ])
        if (m) setProfile({
          full_name:          m.full_name || '',
          email:              m.email || '',
          studio_name:        m.studio_name || '',
          trade_tier:         m.trade_tier || 'prospect',
          klaviyo_profile_id: m.klaviyo_profile_id || '',
        })
        if (f) setFirmo({
          firm_size:          f.firm_size || '',
          project_type:       f.project_type || '',
          geography:          f.geography || '',
          years_in_practice:  f.years_in_practice || '',
        })
        if (e) setEng({
          email_open_rate:      e.email_open_rate ?? 0,
          link_clicks_90d:      e.link_clicks_90d ?? 0,
          trade_page_revisits:  e.trade_page_revisits ?? 0,
          outreach_response:    e.outreach_response || 'none',
        })
        if (s) setSpec({
          projects_registered:  s.projects_registered ?? 0,
          orders_placed:        s.orders_placed ?? 0,
          total_order_value:    s.total_order_value ?? 0,
          brand_coverage_ratio: s.brand_coverage_ratio ?? 0,
          days_to_first_order:  s.days_to_first_order ?? '',
          order_value_trend:    s.order_value_trend || 'flat',
        })
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [id, isEdit])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      let memberId = id

      // 1. Create or update profile
      if (isEdit) {
        await updateMember(id, {
          full_name:          profile.full_name,
          email:              profile.email,
          studio_name:        profile.studio_name || null,
          trade_tier:         profile.trade_tier,
          klaviyo_profile_id: profile.klaviyo_profile_id || null,
        })
      } else {
        const newMember = await createMember({
          full_name:          profile.full_name,
          email:              profile.email,
          studio_name:        profile.studio_name || null,
          trade_tier:         profile.trade_tier,
          klaviyo_profile_id: profile.klaviyo_profile_id || null,
        })
        memberId = newMember.id
      }

      // 2. Upsert firmographic (only if any field filled)
      if (firmo.firm_size || firmo.project_type || firmo.geography || firmo.years_in_practice) {
        await upsertFirmographicData(memberId, firmo)
      }

      // 3. Upsert engagement
      await upsertEngagementData(memberId, {
        email_open_rate:     parseFloat(eng.email_open_rate) || 0,
        link_clicks_90d:     parseInt(eng.link_clicks_90d, 10) || 0,
        trade_page_revisits: parseInt(eng.trade_page_revisits, 10) || 0,
        outreach_response:   eng.outreach_response,
        data_source:         'manual',
      })

      // 4. Upsert specification
      await upsertSpecificationData(memberId, {
        projects_registered:  parseInt(spec.projects_registered, 10) || 0,
        orders_placed:        parseInt(spec.orders_placed, 10) || 0,
        total_order_value:    parseFloat(spec.total_order_value) || 0,
        brand_coverage_ratio: parseFloat(spec.brand_coverage_ratio) || 0,
        days_to_first_order:  spec.days_to_first_order !== '' ? parseInt(spec.days_to_first_order, 10) : null,
        order_value_trend:    spec.order_value_trend,
        data_source:          'manual',
      })

      // 5. Calculate initial/updated score
      await recalculateMemberScore(memberId)

      navigate(`/members/${memberId}`)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-stone text-sm font-sans animate-pulse">Loading…</p>
      </div>
    )
  }

  const fieldP  = (key) => ({ value: profile[key],  onChange: e => setProfile(p => ({ ...p, [key]: e.target.value })) })
  const fieldF  = (key) => ({ value: firmo[key],    onChange: e => setFirmo(p  => ({ ...p, [key]: e.target.value })) })
  const fieldE  = (key) => ({ value: eng[key],      onChange: e => setEng(p    => ({ ...p, [key]: e.target.value })) })
  const fieldS  = (key) => ({ value: spec[key],     onChange: e => setSpec(p   => ({ ...p, [key]: e.target.value })) })

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <button onClick={() => navigate(-1)} className="btn-ghost text-xs tracking-widest uppercase mb-6 flex items-center gap-1">
        ← Back
      </button>

      <h1 className="font-serif text-ivory text-2xl mb-1">
        {isEdit ? 'Edit member' : 'Add member'}
      </h1>
      <p className="text-stone text-sm font-sans mb-8">
        {isEdit
          ? 'Update this designer\'s profile and data. Score recalculates on save.'
          : 'Fill in what you know. Score calculates immediately on creation.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ── Profile ───────────────────────────────────────────── */}
        <section>
          <SectionHeader label="Profile" />
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Full name" required>
              <input type="text" className="input" placeholder="Isabel Fontaine" required {...fieldP('full_name')} />
            </FormField>
            <FormField label="Email" required>
              <input type="email" className="input" placeholder="isabel@studio.com" required {...fieldP('email')} />
            </FormField>
            <FormField label="Studio name">
              <input type="text" className="input" placeholder="Fontaine Studio" {...fieldP('studio_name')} />
            </FormField>
            <FormField label="Trade tier">
              <select className="select" {...fieldP('trade_tier')}>
                {TIER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormField>
            <FormField label="Klaviyo profile ID" hint="Optional — required for Phase 2 sync">
              <input type="text" className="input" placeholder="01ABC…" {...fieldP('klaviyo_profile_id')} />
            </FormField>
          </div>
        </section>

        {/* ── Firmographic ──────────────────────────────────────── */}
        <section id="firmographic">
          <SectionHeader label="Firmographic Potential" weight="25 pts" />
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Firm size">
              <select className="select" {...fieldF('firm_size')}>
                <option value="">Select…</option>
                {FIRM_SIZE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormField>
            <FormField label="Primary project type">
              <select className="select" {...fieldF('project_type')}>
                <option value="">Select…</option>
                {PROJECT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormField>
            <FormField label="Geography">
              <select className="select" {...fieldF('geography')}>
                <option value="">Select…</option>
                {GEOGRAPHY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormField>
            <FormField label="Years in practice">
              <select className="select" {...fieldF('years_in_practice')}>
                <option value="">Select…</option>
                {YEARS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormField>
          </div>
        </section>

        {/* ── Engagement ────────────────────────────────────────── */}
        <section id="engagement">
          <SectionHeader label="Engagement Signals" weight="25 pts" note="Manual — will sync with Klaviyo in Phase 2" />
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Email open rate (0–1)" hint="e.g. 0.35 for 35%">
              <input type="number" min="0" max="1" step="0.01" className="input" placeholder="0.35" {...fieldE('email_open_rate')} />
            </FormField>
            <FormField label="Link clicks (last 90 days)">
              <input type="number" min="0" className="input" placeholder="4" {...fieldE('link_clicks_90d')} />
            </FormField>
            <FormField label="Trade page revisits">
              <input type="number" min="0" className="input" placeholder="2" {...fieldE('trade_page_revisits')} />
            </FormField>
            <FormField label="Response to outreach">
              <select className="select" {...fieldE('outreach_response')}>
                {OUTREACH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormField>
          </div>
        </section>

        {/* ── Specification ─────────────────────────────────────── */}
        <section id="specification">
          <SectionHeader label="Specification Behaviour" weight="35 pts" note="Manual — will sync with Project Tracker in Phase 3" />
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Projects registered">
              <input type="number" min="0" className="input" placeholder="0" {...fieldS('projects_registered')} />
            </FormField>
            <FormField label="Orders placed">
              <input type="number" min="0" className="input" placeholder="0" {...fieldS('orders_placed')} />
            </FormField>
            <FormField label="Total order value ($)">
              <input type="number" min="0" step="0.01" className="input" placeholder="0" {...fieldS('total_order_value')} />
            </FormField>
            <FormField label="Brand coverage ratio (0–1)" hint="e.g. 0.5 for 50% of portfolio">
              <input type="number" min="0" max="1" step="0.01" className="input" placeholder="0.5" {...fieldS('brand_coverage_ratio')} />
            </FormField>
            <FormField label="Days to first order" hint="Leave blank if no order yet">
              <input type="number" min="0" className="input" placeholder="30" {...fieldS('days_to_first_order')} />
            </FormField>
            <FormField label="Order value trend">
              <select className="select" {...fieldS('order_value_trend')}>
                {TREND_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormField>
          </div>
        </section>

        {error && (
          <p className="text-red-400 text-sm font-sans">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary tracking-widest uppercase disabled:opacity-50"
          >
            {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Create member'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary tracking-widest uppercase">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

function SectionHeader({ label, weight, note }) {
  return (
    <div className="mb-4 pb-3 border-b border-border">
      <div className="flex items-center gap-3">
        <h2 className="font-serif text-ivory text-base">{label}</h2>
        {weight && (
          <span className="text-2xs font-sans text-gold bg-gold/10 px-2 py-0.5 rounded-sm">
            {weight}
          </span>
        )}
      </div>
      {note && <p className="text-stone text-xs font-sans mt-1 italic">{note}</p>}
    </div>
  )
}

function FormField({ label, required, hint, children }) {
  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="text-gold ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-stone text-2xs font-sans mt-1">{hint}</p>}
    </div>
  )
}
