'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Scores { [key: string]: number }
interface Athlete {
  id: number; name: string; sport: string; image: string | null
  cost: string; reach_sm: string; scores: Scores
}

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

function rgba(hex: string, a: number) {
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16)
  return `rgba(${r},${g},${b},${a})`
}
function initials(name: string) { return (name||'?').split(' ').map(w=>w[0]||'').slice(0,2).join('').toUpperCase() }
function fmtCost(v: string) { const n=Number(v); if(!n)return'—'; return '€\u202f'+n.toLocaleString('de-DE') }
function fmtReach(v: string) { const n=Number(v); if(!n)return'—'; if(n>=100)return(n/100).toFixed(n%100===0?0:1)+'M'; return n+'0k' }
function computeReachScore(v: string): number {
  const n=Number(v)||0; if(n<=0)return 1
  const t: [number,number][] = [[0,1],[5,3],[15,4],[50,6],[100,7],[250,8],[500,9],[1000,10]]
  for(let i=1;i<t.length;i++) if(n<=t[i][0]){const r=(n-t[i-1][0])/(t[i][0]-t[i-1][0]);return Math.max(1,Math.min(10,parseFloat((t[i-1][1]+r*(t[i][1]-t[i-1][1])).toFixed(1))))}
  return 10
}
function computeCostScore(v: string): number {
  const n=Number(v)||0; if(n<=0)return 5
  const t: [number,number][] = [[0,10],[25000,9],[75000,8],[150000,7],[250000,6],[400000,5],[600000,4],[1000000,2],[2000000,1]]
  for(let i=1;i<t.length;i++) if(n<=t[i][0]){const r=(n-t[i-1][0])/(t[i][0]-t[i-1][0]);return Math.max(1,Math.min(10,parseFloat((t[i-1][1]+r*(t[i][1]-t[i-1][1])).toFixed(1))))}
  return 1
}
function getComputed(cost: string, reach_sm: string) {
  return { social_reach_calc: computeReachScore(reach_sm), cost_eff_calc: computeCostScore(cost) }
}
function catAvg(scores: Scores, cat: string, computed: Record<string,number>): number {
  let s=0,w=0
  for(const c of BY_CAT[cat]){s+=(scores[c.key]??5)*c.w;w+=c.w}
  for(const c of BY_COMP[cat]){s+=(computed[c.key]??5)*c.w;w+=c.w}
  return s/w
}
function autoAssign(scores: Scores, computed: Record<string,number>): string {
  let best='hero',bs=-1
  for(const k of Object.keys(CATS)){const s=catAvg(scores,k,computed);if(s>bs){bs=s;best=k}}
  return best
}
function blankScores(): Scores { return Object.fromEntries(CRIT.map(c=>[c.key,5])) }

// ─── Supabase Storage Image Upload ───────────────────────────────────────────
async function uploadImage(file: File, athleteId: number): Promise<string | null> {
  try {
    const filename = `${athleteId}-${Date.now()}.jpg`
    const { error } = await supabase.storage
      .from('athlete-images')
      .upload(filename, file, { contentType: file.type, upsert: true })
    if (error) { console.error('Upload error:', error); return null }
    const { data } = supabase.storage.from('athlete-images').getPublicUrl(filename)
    return data.publicUrl
  } catch (e) { console.error(e); return null }
}

function CitroenLogo({ size=28 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size*1.21)} viewBox="0 0 100 120" fill="none">
      <ellipse cx="50" cy="60" rx="44" ry="52" stroke="#1a1a1a" strokeWidth="6" fill="none"/>
      <path d="M18,58 L50,28 L82,58 L73,58 L50,38 L27,58 Z" fill="#1a1a1a"/>
      <path d="M18,75 L50,45 L82,75 L73,75 L50,55 L27,75 Z" fill="#1a1a1a"/>
    </svg>
  )
}

function AthleteCard({ athlete, onClick }: { athlete: Athlete; onClick: () => void }) {
  const computed = getComputed(athlete.cost, athlete.reach_sm)
  const cat = autoAssign(athlete.scores, computed)
  const info = CATS[cat]
  const ini = initials(athlete.name)
  const hasMeta = athlete.cost || athlete.reach_sm
  return (
    <div onClick={onClick}
      style={{ background:'#fff', border:`1px solid ${RED}`, borderRadius:10, overflow:'hidden', cursor:'pointer', transition:'box-shadow 0.15s' }}
      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow=`0 4px 16px ${rgba(RED,0.15)}`}}
      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='none'}}
    >
      <div style={{height:3,background:info.color}}/>
      {/* Large image at top */}
      <div style={{width:'100%',height:160,background:rgba(info.color,0.06),display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',position:'relative'}}>
        {athlete.image
          ? <img src={athlete.image} alt={athlete.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          : <div style={{width:80,height:80,borderRadius:'50%',background:rgba(info.color,0.15),color:info.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,fontWeight:500}}>{ini}</div>
        }
        <div style={{position:'absolute',top:10,left:10}}>
          <div style={{display:'inline-block',fontSize:10,fontWeight:500,padding:'3px 8px',borderRadius:4,background:'rgba(255,255,255,0.92)',color:info.color,backdropFilter:'blur(4px)'}}>{info.label}</div>
        </div>
      </div>
      <div style={{padding:'12px 16px'}}>
        <div style={{fontSize:16,fontWeight:500,lineHeight:1.2,marginBottom:2}}>{athlete.name||'—'}</div>
        <div style={{fontSize:11,color:'#888',marginBottom:hasMeta?8:10}}>{athlete.sport}</div>
        {hasMeta && (
          <div style={{display:'flex',gap:10,marginBottom:10,padding:'6px 10px',background:'#f5f5f5',borderRadius:6}}>
            <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'#666'}}><span>€</span><span style={{fontWeight:500,color:'#1a1a1a'}}>{fmtCost(athlete.cost)}</span></div>
            <div style={{width:0.5,background:'#e2e2e2',alignSelf:'stretch'}}/>
            <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'#666'}}><span>📱</span><span style={{fontWeight:500,color:'#1a1a1a'}}>{fmtReach(athlete.reach_sm)}</span></div>
          </div>
        )}
        <div style={{borderTop:'0.5px solid #e2e2e2',paddingTop:10}}>
          {Object.entries(CATS).map(([k,c]) => {
            const s=catAvg(athlete.scores,k,computed),isM=k===cat
            return (
              <div key={k} style={{display:'flex',alignItems:'center',gap:7,marginBottom:5}}>
                <div style={{fontSize:9,fontWeight:500,letterSpacing:'0.06em',width:52,flexShrink:0,color:isM?c.color:'#aaa'}}>{c.abbr}</div>
                <div style={{flex:1,height:3,background:'#e2e2e2',borderRadius:2,overflow:'hidden'}}>
                  <div style={{width:`${(s/10*100).toFixed(0)}%`,height:'100%',background:isM?c.color:'#d0d0d0',borderRadius:2}}/>
                </div>
                <div style={{fontSize:9,width:24,textAlign:'right',color:isM?c.color:'#aaa'}}>{s.toFixed(1)}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function EditView({ data, isNew, onSave, onDelete, onBack }: {
  data: Athlete; isNew: boolean
  onSave: (a: Athlete) => Promise<void>
  onDelete: () => void; onBack: () => void
}) {
  const [form, setForm] = useState<Athlete>({...data,scores:{...data.scores}})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const computed = getComputed(form.cost, form.reach_sm)
  const cat = autoAssign(form.scores, computed)
  const info = CATS[cat]
  const ini = initials(form.name)

  const updateScore = (key: string, val: number) => setForm(f=>({...f,scores:{...f.scores,[key]:val}}))
  const updateField = (field: keyof Athlete, val: string) => setForm(f=>({...f,[field]:val}))

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if(!file) return
    setUploading(true)
    const url = await uploadImage(file, form.id)
    if (url) setForm(f=>({...f,image:url}))
    else alert('Bild konnte nicht hochgeladen werden. Bitte prüfe ob der Bucket "athlete-images" existiert und public ist.')
    setUploading(false)
    e.target.value=''
  }

  const handleSave = async () => {
    if(!form.name.trim()){alert('Bitte Namen eingeben.');return}
    setSaving(true); await onSave(form); setSaving(false)
  }

  return (
    <div style={{maxWidth:680,margin:'0 auto',padding:'20px 24px'}}>
      <button onClick={onBack} style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'none',color:'#888',fontSize:13,cursor:'pointer',padding:0,marginBottom:16,fontFamily:'inherit'}}>
        ← Zurück zur Übersicht
      </button>

      {/* Auto-category banner */}
      <div style={{background:rgba(info.color,0.08),border:`0.5px solid ${rgba(info.color,0.3)}`,borderRadius:8,padding:'10px 14px',marginBottom:20,display:'flex',alignItems:'center',gap:10}}>
        <div>
          <div style={{fontSize:10,color:'#888',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:2}}>Kategorie (auto):</div>
          <div style={{fontSize:14,fontWeight:500,color:info.color}}>{info.label}</div>
        </div>
        <div style={{fontSize:11,color:'#888',marginLeft:8}}>Score {catAvg(form.scores,cat,computed).toFixed(2)}</div>
        <div style={{display:'flex',gap:5,alignItems:'flex-end',marginLeft:'auto'}}>
          {Object.entries(CATS).map(([k,c]) => {
            const s=catAvg(form.scores,k,computed),isM=k===cat
            return (
              <div key={k} title={`${c.label}: ${s.toFixed(2)}`} style={{width:22,display:'flex',flexDirection:'column-reverse',borderRadius:3,overflow:'hidden',height:28,background:'#e2e2e2',border:`1px solid ${isM?c.color:'transparent'}`}}>
                <div style={{width:'100%',height:`${(s/10*100).toFixed(0)}%`,background:isM?c.color:'#c0c0c0',transition:'height 0.2s'}}/>
              </div>
            )
          })}
        </div>
      </div>

      {/* Photo upload */}
      <div style={{marginBottom:20}}>
        <div style={{width:'100%',height:200,borderRadius:10,overflow:'hidden',background:rgba(info.color,0.06),border:`1px solid ${rgba(info.color,0.2)}`,display:'flex',alignItems:'center',justifyContent:'center',position:'relative',marginBottom:10}}>
          {form.image
            ? <img src={form.image} alt={form.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            : <div style={{textAlign:'center',color:'#aaa'}}>
                <div style={{fontSize:40,marginBottom:8}}>👤</div>
                <div style={{fontSize:12}}>Noch kein Foto</div>
              </div>
          }
          {uploading && (
            <div style={{position:'absolute',inset:0,background:'rgba(255,255,255,0.8)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:'#888'}}>
              Wird hochgeladen…
            </div>
          )}
        </div>
        <div style={{display:'flex',gap:8}}>
          <label style={{display:'flex',alignItems:'center',gap:7,border:'0.5px solid #ccc',padding:'7px 14px',borderRadius:6,fontSize:12,cursor:'pointer',background:'#fff'}}>
            📷 Foto hochladen
            <input type="file" accept="image/*" onChange={handleImage} style={{display:'none'}}/>
          </label>
          {form.image && <button onClick={()=>setForm(f=>({...f,image:null}))} style={{background:'none',border:'none',color:'#aaa',fontSize:12,cursor:'pointer',padding:0,fontFamily:'inherit'}}>✕ Bild entfernen</button>}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
        <div><label style={{display:'block',fontSize:11,color:'#888',marginBottom:4}}>Name *</label><input type="text" value={form.name} onChange={e=>updateField('name',e.target.value)} placeholder="Vor- und Nachname" style={{width:'100%',padding:'8px 10px',border:'1px solid #e2e2e2',borderRadius:6,fontSize:13,fontFamily:'inherit',outline:'none'}}/></div>
        <div><label style={{display:'block',fontSize:11,color:'#888',marginBottom:4}}>Sportart / Disziplin</label><input type="text" value={form.sport} onChange={e=>updateField('sport',e.target.value)} placeholder="z. B. Schwimmen 100m" style={{width:'100%',padding:'8px 10px',border:'1px solid #e2e2e2',borderRadius:6,fontSize:13,fontFamily:'inherit',outline:'none'}}/></div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:24,padding:'14px 16px',background:'#f5f5f5',borderRadius:8,border:'0.5px solid #e2e2e2'}}>
        <div>
          <label style={{display:'block',fontSize:11,color:'#888',marginBottom:4}}>€ Kosten / Jahr</label>
          <input type="number" min="0" step="5000" value={form.cost} onChange={e=>updateField('cost',e.target.value)} placeholder="z. B. 150000" style={{width:'100%',padding:'8px 10px',border:'1px solid #e2e2e2',borderRadius:6,fontSize:13,fontFamily:'inherit',outline:'none'}}/>
          <div style={{display:'flex',alignItems:'center',gap:6,marginTop:7}}>
            <span style={{fontSize:10,color:'#888'}}>Effizienz:</span>
            <div style={{flex:1,height:4,background:'#e2e2e2',borderRadius:2,overflow:'hidden'}}><div style={{width:`${computeCostScore(form.cost)/10*100}%`,height:'100%',background:'#B8860B',borderRadius:2}}/></div>
            <span style={{fontSize:11,fontWeight:500,color:'#B8860B'}}>{computeCostScore(form.cost).toFixed(1)}</span>
          </div>
        </div>
        <div>
          <label style={{display:'block',fontSize:11,color:'#888',marginBottom:4}}>📱 Social-Reichweite (10k)</label>
          <input type="number" min="0" step="1" value={form.reach_sm} onChange={e=>updateField('reach_sm',e.target.value)} placeholder="z. B. 250 = 2,5M" style={{width:'100%',padding:'8px 10px',border:'1px solid #e2e2e2',borderRadius:6,fontSize:13,fontFamily:'inherit',outline:'none'}}/>
          <div style={{display:'flex',alignItems:'center',gap:6,marginTop:7}}>
            <span style={{fontSize:10,color:'#888'}}>Reichweite:</span>
            <div style={{flex:1,height:4,background:'#e2e2e2',borderRadius:2,overflow:'hidden'}}><div style={{width:`${computeReachScore(form.reach_sm)/10*100}%`,height:'100%',background:'#0F7E45',borderRadius:2}}/></div>
            <span style={{fontSize:11,fontWeight:500,color:'#0F7E45'}}>{computeReachScore(form.reach_sm).toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div style={{fontSize:10,fontWeight:500,color:'#888',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:14,paddingBottom:6,borderBottom:'0.5px solid #e2e2e2'}}>Scoring-Kriterien</div>

      {Object.entries(CATS).map(([k,c]) => {
        const isM=k===cat, avg=catAvg(form.scores,k,computed)
        return (
          <div key={k} style={{marginBottom:20}}>
            <div style={{display:'flex',alignItems:'center',gap:8,paddingBottom:7,marginBottom:10,borderBottom:`1.5px solid ${isM?c.color:'#e2e2e2'}`}}>
              <div style={{width:7,height:7,borderRadius:'50%',background:isM?c.color:'#e2e2e2',flexShrink:0}}/>
              <span style={{fontSize:11,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.08em',color:isM?c.color:'#888'}}>{c.label}</span>
              <span style={{marginLeft:'auto',fontSize:11,color:isM?c.color:'#888'}}>Ø {avg.toFixed(2)}</span>
            </div>
            {BY_CAT[k].map(cr => (
              <div key={cr.key} style={{marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                  <label style={{fontSize:12,color:'#1a1a1a'}} title={cr.hint}>{cr.label} <span style={{fontSize:10,color:'#aaa'}}>×{cr.w}</span></label>
                  <span style={{fontSize:12,fontWeight:500,color:isM?c.color:'#1a1a1a'}}>{form.scores[cr.key]??5}</span>
                </div>
                <input type="range" min="1" max="10" step="1" value={form.scores[cr.key]??5} onChange={e=>updateScore(cr.key,Number(e.target.value))} style={{width:'100%',accentColor:c.color}}/>
              </div>
            ))}
            <div style={{fontSize:10,color:'#aaa',textTransform:'uppercase',letterSpacing:'0.08em',margin:'10px 0 6px',paddingTop:8,borderTop:'0.5px dashed #e2e2e2'}}>Auto-berechnet</div>
            {BY_COMP[k].map((cc,i) => {
              const sc=computed[cc.key as keyof typeof computed]
              return (
                <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:7,padding:'5px 8px',background:'#f5f5f5',borderRadius:4}}>
                  <span style={{fontSize:11}}>{cc.key==='social_reach_calc'?'📱':'€'}</span>
                  <span style={{fontSize:11,color:'#666',flex:1}}>{cc.label}</span>
                  <div style={{width:60,height:3,background:'#e2e2e2',borderRadius:2,overflow:'hidden'}}><div style
