'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Scores { [key: string]: number }
interface Athlete {
  id: number
  name: string
  sport: string
  image: string | null
  cost: string
  reach_sm: string
  scores: Scores
}

// ─── Constants ────────────────────────────────────────────────────────────────
const RED = '#DA291C'
const CATS: Record<string, { label: string; abbr: string; color: string }> = {
  hero:      { label: 'Hero Ambassador',  abbr: 'HERO',    color: '#DA291C' },
  medal:     { label: 'Medal Candidate',  abbr: 'MEDAL',   color: '#B8860B' },
  inspiring: { label: 'Inspiring Hero',   abbr: 'INSPIRE', color: '#6B21A8' },
  para:      { label: 'Paralympic Star',  abbr: 'PARA',    color: '#185FA5' },
  rising:    { label: 'Rising Star',      abbr: 'RISING',  color: '#0F7E45' },
}

const CRIT = [
  { key: 'brand_match',  label: 'Markenwerte-Match',        cat: 'hero',      w: 1.5, hint: 'Passt der Athlet zu Citroëns Werten?' },
  { key: 'recognition',  label: 'Wiedererkennungswert',     cat: 'hero',      w: 1.5, hint: 'Bekanntheit in D und international' },
  { key: 'reach',        label: 'Strahlkraft / Reichweite', cat: 'hero',      w: 1.0, hint: 'Qualitative Strahlkraft & Medienpräsenz' },
  { key: 'medal_chance', label: 'Medaillenchance LA28',     cat: 'medal',     w: 2.0, hint: 'Wie realistisch ist eine Medaille in LA?' },
  { key: 'track_record', label: 'Int. Track Record',        cat: 'medal',     w: 1.5, hint: 'Internationale Erfolge & Top-Rankings' },
  { key: 'consistency',  label: 'Wettkampf-Konstanz',       cat: 'medal',     w: 1.0, hint: 'Stabile Top-Performance unter Druck' },
  { key: 'story_depth',  label: 'Emotionale Story-Tiefe',   cat: 'inspiring', w: 1.5, hint: 'Tiefe der persönlichen Geschichte' },
  { key: 'resilience',   label: 'Comeback / Resilience',    cat: 'inspiring', w: 1.5, hint: 'Überwindung von Verletzungen & Rückschlägen' },
  { key: 'authenticity', label: 'Authentizität',            cat: 'inspiring', w: 1.0, hint: 'Glaubwürdigkeit der Story nach außen' },
  { key: 'para_profile', label: 'Para-Profil / Sichtbarkeit', cat: 'para',   w: 1.5, hint: 'Bekanntheit im Para-Sport' },
  { key: 'para_medals',  label: 'Medaillen-Potenzial (Para)', cat: 'para',   w: 2.0, hint: 'Realistische Para-Medaillenchance' },
  { key: 'inclusion',    label: 'Inklusions-Statement',     cat: 'para',      w: 1.0, hint: 'Kraft als Botschafter für Inklusion' },
  { key: 'breakout',     label: 'Breakout-Potenzial',       cat: 'rising',    w: 1.5, hint: 'Potenzial zum nächsten großen Namen' },
  { key: 'youth_appeal', label: 'Junge Zielgruppe (16–30)', cat: 'rising',    w: 1.0, hint: 'Relevanz für junge Fans' },
  { key: 'engagement',   label: 'Content-Qualität',         cat: 'rising',    w: 1.5, hint: 'Qualität & Konsistenz des Social-Contents' },
]

const COMP = [
  { key: 'social_reach_calc', label: 'Social-Reichweite', cat: 'rising',    w: 1.5 },
  { key: 'social_reach_calc', label: 'Social-Reichweite', cat: 'hero',      w: 1.0 },
  { key: 'social_reach_calc', label: 'Social-Reichweite', cat: 'para',      w: 0.75 },
  { key: 'social_reach_calc', label: 'Social-Reichweite', cat: 'medal',     w: 0.5 },
  { key: 'social_reach_calc', label: 'Social-Reichweite', cat: 'inspiring', w: 0.5 },
  { key: 'cost_eff_calc',     label: 'Kosten-Effizienz',  cat: 'hero',      w: 0.75 },
  { key: 'cost_eff_calc',     label: 'Kosten-Effizienz',  cat: 'medal',     w: 0.75 },
  { key: 'cost_eff_calc',     label: 'Kosten-Effizienz',  cat: 'inspiring', w: 0.75 },
  { key: 'cost_eff_calc',     label: 'Kosten-Effizienz',  cat: 'para',      w: 0.75 },
  { key: 'cost_eff_calc',     label: 'Kosten-Effizienz',  cat: 'rising',    w: 0.75 },
]

const BY_CAT: Record<string, typeof CRIT> = {}
const BY_COMP: Record<string, typeof COMP> = {}
for (const k of Object.keys(CATS)) {
  BY_CAT[k] = CRIT.filter(c => c.cat === k)
  BY_COMP[k] = COMP.filter(c => c.cat === k)
}

const SAMPLES: Athlete[] = [
  { id: 1, name: 'Darja Varfolomeev', sport: 'Rhythmische Sportgymnastik', image: null, cost: '', reach_sm: '', scores: { brand_match:9,recognition:9,reach:8,medal_chance:7,track_record:9,consistency:8,story_depth:7,resilience:6,authenticity:8,para_profile:1,para_medals:1,inclusion:3,breakout:6,youth_appeal:8,engagement:8 } },
  { id: 2, name: 'Anna Elendt', sport: 'Schwimmen (Brust)', image: null, cost: '', reach_sm: '', scores: { brand_match:7,recognition:7,reach:6,medal_chance:8,track_record:8,consistency:8,story_depth:5,resilience:6,authenticity:7,para_profile:1,para_medals:1,inclusion:3,breakout:7,youth_appeal:7,engagement:7 } },
  { id: 3, name: 'Emma Hinze', sport: 'Bahnradsport (Sprint)', image: null, cost: '', reach_sm: '', scores: { brand_match:7,recognition:7,reach:6,medal_chance:7,track_record:8,consistency:7,story_depth:9,resilience:9,authenticity:9,para_profile:2,para_medals:2,inclusion:4,breakout:5,youth_appeal:6,engagement:6 } },
  { id: 4, name: 'Elena Semechin', sport: 'Para-Schwimmen', image: null, cost: '', reach_sm: '', scores: { brand_match:6,recognition:6,reach:5,medal_chance:5,track_record:6,consistency:6,story_depth:8,resilience:8,authenticity:8,para_profile:9,para_medals:8,inclusion:9,breakout:5,youth_appeal:6,engagement:5 } },
  { id: 5, name: 'Tim Elter', sport: 'Leichtathletik – Stabhochsprung', image: null, cost: '', reach_sm: '', scores: { brand_match:6,recognition:5,reach:6,medal_chance:5,track_record:5,consistency:6,story_depth:5,resilience:6,authenticity:7,para_profile:1,para_medals:1,inclusion:2,breakout:9,youth_appeal:9,engagement:8 } },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rgba(hex: string, a: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

function initials(name: string) {
  return (name || '?').split(' ').map(w => w[0] || '').slice(0, 2).join('').toUpperCase()
}

function fmtCost(v: string) {
  const n = Number(v)
  if (!n) return '—'
  return '€\u202f' + n.toLocaleString('de-DE')
}

function fmtReach(v: string) {
  const n = Number(v)
  if (!n) return '—'
  if (n >= 100) return (n / 100).toFixed(n % 100 === 0 ? 0 : 1) + 'M'
  return n + '0k'
}

function computeReachScore(v: string): number {
  const n = Number(v) || 0
  if (n <= 0) return 1
  const table: [number, number][] = [[0,1],[5,3],[15,4],[50,6],[100,7],[250,8],[500,9],[1000,10]]
  for (let i = 1; i < table.length; i++) {
    if (n <= table[i][0]) {
      const t = (n - table[i-1][0]) / (table[i][0] - table[i-1][0])
      return Math.max(1, Math.min(10, parseFloat((table[i-1][1] + t * (table[i][1] - table[i-1][1])).toFixed(1))))
    }
  }
  return 10
}

function computeCostScore(v: string): number {
  const n = Number(v) || 0
  if (n <= 0) return 5
  const table: [number, number][] = [[0,10],[25000,9],[75000,8],[150000,7],[250000,6],[400000,5],[600000,4],[1000000,2],[2000000,1]]
  for (let i = 1; i < table.length; i++) {
    if (n <= table[i][0]) {
      const t = (n - table[i-1][0]) / (table[i][0] - table[i-1][0])
      return Math.max(1, Math.min(10, parseFloat((table[i-1][1] + t * (table[i][1] - table[i-1][1])).toFixed(1))))
    }
  }
  return 1
}

function getComputed(cost: string, reach_sm: string) {
  return { social_reach_calc: computeReachScore(reach_sm), cost_eff_calc: computeCostScore(cost) }
}

function catAvg(scores: Scores, cat: string, computed: Record<string, number>): number {
  let s = 0, w = 0
  for (const c of BY_CAT[cat]) { s += (scores[c.key] ?? 5) * c.w; w += c.w }
  for (const c of BY_COMP[cat]) { s += (computed[c.key] ?? 5) * c.w; w += c.w }
  return s / w
}

function autoAssign(scores: Scores, computed: Record<string, number>): string {
  let best = 'hero', bestScore = -1
  for (const k of Object.keys(CATS)) {
    const s = catAvg(scores, k, computed)
    if (s > bestScore) { bestScore = s; best = k }
  }
  return best
}

function blankScores(): Scores {
  return Object.fromEntries(CRIT.map(c => [c.key, 5]))
}

function compressImage(file: File): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        const SIZE = 220
        const ratio = Math.min(SIZE / img.width, SIZE / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * ratio)
        canvas.height = Math.round(img.height * ratio)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = e.target!.result as string
    }
    reader.readAsDataURL(file)
  })
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
function CitroenLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 1.21)} viewBox="0 0 100 120" fill="none">
      <ellipse cx="50" cy="60" rx="44" ry="54" stroke={RED} strokeWidth="5.5" />
      <path d="M20 57L50 31L80 57" stroke={RED} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 75L50 49L80 75" stroke={RED} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function AthleteCard({ athlete, onClick }: { athlete: Athlete; onClick: () => void }) {
  const computed = getComputed(athlete.cost, athlete.reach_sm)
  const cat = autoAssign(athlete.scores, computed)
  const info = CATS[cat]
  const ini = initials(athlete.name)
  const hasMeta = athlete.cost || athlete.reach_sm

  return (
    <div
      onClick={onClick}
      style={{ background: '#fff', border: '0.5px solid #e2e2e2', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#aaa'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e2e2'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
    >
      <div style={{ height: 3, background: info.color }} />
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          {athlete.image
            ? <img src={athlete.image} alt={athlete.name} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '0.5px solid #e2e2e2' }} />
            : <div style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0, background: rgba(info.color, 0.12), color: info.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 500 }}>{ini}</div>
          }
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'inline-block', fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 4, marginBottom: 5, background: rgba(info.color, 0.1), color: info.color }}>{info.label}</div>
            <div style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.2 }}>{athlete.name || '—'}</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{athlete.sport}</div>
          </div>
        </div>

        {hasMeta && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 10, padding: '7px 10px', background: '#f5f5f5', borderRadius: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#666' }}>
              <span>€</span><span style={{ fontWeight: 500, color: '#1a1a1a' }}>{fmtCost(athlete.cost)}</span>
            </div>
            <div style={{ width: 0.5, background: '#e2e2e2', alignSelf: 'stretch' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#666' }}>
              <span>📱</span><span style={{ fontWeight: 500, color: '#1a1a1a' }}>{fmtReach(athlete.reach_sm)}</span>
            </div>
          </div>
        )}

        <div style={{ borderTop: '0.5px solid #e2e2e2', paddingTop: 10 }}>
          {Object.entries(CATS).map(([k, c]) => {
            const s = catAvg(athlete.scores, k, computed)
            const isM = k === cat
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.06em', width: 52, flexShrink: 0, color: isM ? c.color : '#aaa' }}>{c.abbr}</div>
                <div style={{ flex: 1, height: 3, background: '#e2e2e2', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${(s / 10 * 100).toFixed(0)}%`, height: '100%', background: isM ? c.color : '#d0d0d0', borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 9, width: 24, textAlign: 'right', color: isM ? c.color : '#aaa' }}>{s.toFixed(1)}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Edit View ────────────────────────────────────────────────────────────────
function EditView({ data, isNew, onSave, onDelete, onBack }: {
  data: Athlete; isNew: boolean
  onSave: (a: Athlete) => void
  onDelete: () => void
  onBack: () => void
}) {
  const [form, setForm] = useState<Athlete>({ ...data, scores: { ...data.scores } })
  const computed = getComputed(form.cost, form.reach_sm)
  const cat = autoAssign(form.scores, computed)
  const info = CATS[cat]
  const ini = initials(form.name)
  const reachScore = computeReachScore(form.reach_sm)
  const costScore = computeCostScore(form.cost)

  const updateScore = (key: string, val: number) => setForm(f => ({ ...f, scores: { ...f.scores, [key]: val } }))
  const updateField = (field: keyof Athlete, val: string) => setForm(f => ({ ...f, [field]: val }))

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const b64 = await compressImage(file)
    setForm(f => ({ ...f, image: b64 }))
    e.target.value = ''
  }

  const handleSave = () => {
    if (!form.name.trim()) { alert('Bitte Namen eingeben.'); return }
    onSave(form)
  }

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, color: '#888', marginBottom: 4 }
  const hintStyle: React.CSSProperties = { fontSize: 10, color: '#aaa', marginTop: 3 }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 24px' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#888', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 16, fontFamily: 'inherit' }}>
        ← Zurück zur Übersicht
      </button>

      {/* Auto-category banner */}
      <div style={{ background: rgba(info.color, 0.08), border: `0.5px solid ${rgba(info.color, 0.3)}`, borderRadius: 8, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Kategorie (auto):</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: info.color }}>{info.label}</div>
        </div>
        <div style={{ fontSize: 11, color: '#888', marginLeft: 8 }}>Score {catAvg(form.scores, cat, computed).toFixed(2)}</div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end', marginLeft: 'auto' }}>
          {Object.entries(CATS).map(([k, c]) => {
            const s = catAvg(form.scores, k, computed)
            const isM = k === cat
            return (
              <div key={k} title={`${c.label}: ${s.toFixed(2)}`} style={{ width: 22, display: 'flex', flexDirection: 'column-reverse', borderRadius: 3, overflow: 'hidden', height: 28, background: '#e2e2e2', border: `1px solid ${isM ? c.color : 'transparent'}` }}>
                <div style={{ width: '100%', height: `${(s / 10 * 100).toFixed(0)}%`, background: isM ? c.color : '#c0c0c0', transition: 'height 0.2s' }} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Photo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '14px 16px', background: '#f5f5f5', borderRadius: 8, border: '0.5px solid #e2e2e2' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {form.image
            ? <img src={form.image} alt={form.name} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '0.5px solid #e2e2e2' }} />
            : <div style={{ width: 72, height: 72, borderRadius: '50%', background: rgba(info.color, 0.12), color: info.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 500 }}>{ini || '?'}</div>
          }
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, border: '0.5px solid #ccc', padding: '7px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: '#fff' }}>
            📷 Foto hochladen
            <input type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
          </label>
          {form.image && (
            <button onClick={() => setForm(f => ({ ...f, image: null }))} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 12, cursor: 'pointer', padding: 0, textAlign: 'left', fontFamily: 'inherit' }}>
              ✕ Bild entfernen
            </button>
          )}
        </div>
      </div>

      {/* Basic fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div><label style={labelStyle}>Name *</label><input type="text" value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="Vor- und Nachname" /></div>
        <div><label style={labelStyle}>Sportart / Disziplin</label><input type="text" value={form.sport} onChange={e => updateField('sport', e.target.value)} placeholder="z. B. Schwimmen 100m" /></div>
      </div>

      {/* Cost + Reach */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24, padding: '14px 16px', background: '#f5f5f5', borderRadius: 8, border: '0.5px solid #e2e2e2' }}>
        <div>
          <label style={labelStyle}>€ Kosten / Jahr</label>
          <input type="number" min="0" step="5000" value={form.cost} onChange={e => updateField('cost', e.target.value)} placeholder="z. B. 150000" />
          <div style={{ marginTop: 7 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 10, color: '#888' }}>Effizienz-Score:</span>
              <div style={{ flex: 1, height: 4, background: '#e2e2e2', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${costScore / 10 * 100}%`, height: '100%', background: '#B8860B', borderRadius: 2, transition: 'width 0.2s' }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 500, color: '#B8860B', minWidth: 24 }}>{costScore.toFixed(1)}</span>
            </div>
            <div style={hintStyle}>{fmtCost(form.cost) !== '—' ? fmtCost(form.cost) : 'Nicht angegeben → neutral (5.0)'}</div>
          </div>
        </div>
        <div>
          <label style={labelStyle}>📱 Social-Reichweite (10k)</label>
          <input type="number" min="0" step="1" value={form.reach_sm} onChange={e => updateField('reach_sm', e.target.value)} placeholder="z. B. 250 = 2,5M" />
          <div style={{ marginTop: 7 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 10, color: '#888' }}>Reichweiten-Score:</span>
              <div style={{ flex: 1, height: 4, background: '#e2e2e2', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${reachScore / 10 * 100}%`, height: '100%', background: '#0F7E45', borderRadius: 2, transition: 'width 0.2s' }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 500, color: '#0F7E45', minWidth: 24 }}>{reachScore.toFixed(1)}</span>
            </div>
            <div style={hintStyle}>{fmtReach(form.reach_sm) !== '—' ? fmtReach(form.reach_sm) + ' Follower gesamt' : 'Nicht angegeben → keine Reichweite (1.0)'}</div>
          </div>
        </div>
      </div>

      {/* Scoring criteria */}
      <div style={{ fontSize: 10, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, paddingBottom: 6, borderBottom: '0.5px solid #e2e2e2' }}>
        Scoring-Kriterien — manuell + auto-berechnet
      </div>

      {Object.entries(CATS).map(([k, c]) => {
        const isM = k === cat
        const avg = catAvg(form.scores, k, computed)
        return (
          <div key={k} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 7, marginBottom: 10, borderBottom: `1.5px solid ${isM ? c.color : '#e2e2e2'}` }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: isM ? c.color : '#e2e2e2', flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: isM ? c.color : '#888' }}>{c.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: isM ? c.color : '#888' }}>Ø {avg.toFixed(2)}</span>
            </div>

            {BY_CAT[k].map(cr => (
              <div key={cr.key} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <label style={{ fontSize: 12, color: '#1a1a1a' }} title={cr.hint}>
                    {cr.label} <span style={{ fontSize: 10, color: '#aaa' }}>×{cr.w}</span>
                  </label>
                  <span style={{ fontSize: 12, fontWeight: 500, color: isM ? c.color : '#1a1a1a' }}>{form.scores[cr.key] ?? 5}</span>
                </div>
                <input type="range" min="1" max="10" step="1" value={form.scores[cr.key] ?? 5} onChange={e => updateScore(cr.key, Number(e.target.value))} style={{ accentColor: c.color }} />
              </div>
            ))}

            {/* Computed criteria */}
            <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '10px 0 6px', paddingTop: 8, borderTop: '0.5px dashed #e2e2e2' }}>Auto-berechnet</div>
            {BY_COMP[k].map((cc, i) => {
              const sc = computed[cc.key as keyof typeof computed]
              const icon = cc.key === 'social_reach_calc' ? '📱' : '€'
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, padding: '5px 8px', background: '#f5f5f5', borderRadius: 4 }}>
                  <span style={{ fontSize: 11 }}>{icon}</span>
                  <span style={{ fontSize: 11, color: '#666', flex: 1 }}>{cc.label}</span>
                  <div style={{ width: 60, height: 3, background: '#e2e2e2', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${(sc / 10 * 100).toFixed(0)}%`, height: '100%', background: isM ? c.color : '#c0c0c0' }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 500, color: isM ? c.color : '#888', minWidth: 20, textAlign: 'right' }}>{sc.toFixed(1)}</span>
                  <span style={{ fontSize: 10, color: '#aaa', minWidth: 28, textAlign: 'right' }}>×{cc.w}</span>
                </div>
              )
            })}
          </div>
        )
      })}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, paddingTop: 16, borderTop: '0.5px solid #e2e2e2', marginTop: 8 }}>
        {!isNew && (
          <button onClick={onDelete} style={{ background: 'none', border: '0.5px solid #e2e2e2', color: '#aaa', padding: '8px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Löschen
          </button>
        )}
        <button onClick={onBack} style={{ background: 'none', border: '0.5px solid #ccc', color: '#1a1a1a', padding: '8px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginLeft: isNew ? 'auto' : 0 }}>
          Abbrechen
        </button>
        <button onClick={handleSave} style={{ background: RED, color: '#fff', border: 'none', padding: '8px 22px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
          Speichern
        </button>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [view, setView] = useState<'grid' | 'edit'>('grid')
  const [editData, setEditData] = useState<Athlete | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('citroen_squad_v1')
      setAthletes(saved ? JSON.parse(saved) : SAMPLES)
    } catch {
      setAthletes(SAMPLES)
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) {
      try { localStorage.setItem('citroen_squad_v1', JSON.stringify(athletes)) } catch {}
    }
  }, [athletes, loaded])

  const openAdd = () => {
    setEditData({ id: Date.now(), name: '', sport: '', image: null, cost: '', reach_sm: '', scores: blankScores() })
    setView('edit')
  }

  const openEdit = (a: Athlete) => {
    setEditData({ ...a, scores: { ...a.scores } })
    setView('edit')
  }

  const goBack = () => { setView('grid'); setEditData(null) }

  const handleSave = (data: Athlete) => {
    setAthletes(prev => {
      const idx = prev.findIndex(a => a.id === data.id)
      return idx >= 0 ? prev.map(a => a.id === data.id ? data : a) : [...prev, data]
    })
    goBack()
  }

  const handleDelete = () => {
    if (!editData) return
    if (!confirm('Athleten wirklich löschen?')) return
    setAthletes(prev => prev.filter(a => a.id !== editData.id))
    goBack()
  }

  if (!loaded) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#888' }}>Lade…</div>

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px', height: 58, borderBottom: `2.5px solid ${RED}`, background: '#fff', position: 'sticky', top: 0, zIndex: 10 }}>
        <CitroenLogo size={28} />
        <div>
          <div style={{ fontSize: 10, color: RED, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 500 }}>Citroën</div>
          <div style={{ fontSize: 17, fontWeight: 500, lineHeight: 1 }}>Athlete Squad Matrix</div>
        </div>
        {view === 'grid' && (
          <button onClick={openAdd} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: RED, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Athlet hinzufügen
          </button>
        )}
      </header>

      {view === 'grid' ? (
        <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {athletes.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 80, color: '#aaa' }}>
              <CitroenLogo size={48} />
              <p style={{ marginTop: 16, fontSize: 14 }}>Noch keine Athleten.<br />Klick auf „Athlet hinzufügen".</p>
            </div>
          ) : athletes.map(a => (
            <AthleteCard key={a.id} athlete={a} onClick={() => openEdit(a)} />
          ))}
        </div>
      ) : editData ? (
        <EditView
          data={editData}
          isNew={!athletes.find(a => a.id === editData.id)}
          onSave={handleSave}
          onDelete={handleDelete}
          onBack={goBack}
        />
      ) : null}
    </div>
  )
}
