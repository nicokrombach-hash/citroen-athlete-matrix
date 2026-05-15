'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Scores { [key: string]: number }
interface Athlete {
  id: number
  name: string
  sport: string
  image: string | null
  image_position: number
  cost: string
  reach_insta: string
  reach_tiktok: string
  reach_youtube: string
  scores: Scores
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
  { key: 'brand_match',  label: 'Markenwerte-Match',       cat: 'hero',      w: 1.5, hint: 'Passt der Athlet zu Citroens Werten?' },
  { key: 'recognition',  label: 'Wiedererkennungswert',    cat: 'hero',      w: 1.5, hint: 'Bekanntheit in D und international' },
  { key: 'reach',        label: 'Strahlkraft Reichweite',  cat: 'hero',      w: 1.0, hint: 'Qualitative Strahlkraft' },
  { key: 'medal_chance', label: 'Medaillenchance LA28',     cat: 'medal',     w: 2.0, hint: 'Wie realistisch ist eine Medaille?' },
  { key: 'track_record', label: 'Int. Track Record',        cat: 'medal',     w: 1.5, hint: 'Internationale Erfolge' },
  { key: 'consistency',  label: 'Wettkampf-Konstanz',       cat: 'medal',     w: 1.0, hint: 'Stabile Performance unter Druck' },
  { key: 'story_depth',  label: 'Emotionale Story-Tiefe',   cat: 'inspiring', w: 1.5, hint: 'Tiefe der persoenlichen Geschichte' },
  { key: 'resilience',   label: 'Comeback Resilience',      cat: 'inspiring', w: 1.5, hint: 'Ueberwindung von Rueckschlaegen' },
  { key: 'authenticity', label: 'Authentizitaet',           cat: 'inspiring', w: 1.0, hint: 'Glaubwuerdigkeit der Story' },
  { key: 'para_profile', label: 'Para-Profil Sichtbarkeit', cat: 'para',      w: 1.5, hint: 'Bekanntheit im Para-Sport' },
  { key: 'para_medals',  label: 'Medaillen-Potenzial Para', cat: 'para',      w: 2.0, hint: 'Para-Medaillenchance' },
  { key: 'inclusion',    label: 'Inklusions-Statement',      cat: 'para',      w: 1.0, hint: 'Kraft als Inklusionsbotschafter' },
  { key: 'breakout',     label: 'Breakout-Potenzial',        cat: 'rising',    w: 1.5, hint: 'Potenzial zum naechsten grossen Namen' },
  { key: 'youth_appeal', label: 'Junge Zielgruppe 16-30',    cat: 'rising',    w: 1.0, hint: 'Relevanz fuer junge Fans' },
  { key: 'engagement',   label: 'Content-Qualitaet',         cat: 'rising',    w: 1.5, hint: 'Qualitaet des Social-Contents' },
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
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
  return `rgba(${r},${g},${b},${a})`
}
function initials(name: string) {
  return (name||'?').split(' ').map((w:string)=>w[0]||'').slice(0,2).join('').toUpperCase()
}
function fmtCost(v: string) {
  const n = Number(v)
  if (!n) return '--'
  return 'EUR ' + n.toLocaleString('de-DE')
}
function fmtReach(v: string) {
  const n = Number(v)
  if (!n) return '0'
  if (n >= 1000000) return (n/1000000).toFixed(1)+'M'
  if (n >= 1000) return Math.round(n/1000)+'k'
  return String(n)
}
function totalReach(a: Athlete) {
  return (Number(a.reach_insta)||0)+(Number(a.reach_tiktok)||0)+(Number(a.reach_youtube)||0)
}
function computeReachScore(n: number): number {
  if (n <= 0) return 1
  const t: [number,number][] = [[0,1],[10000,2],[50000,3],[100000,4],[250000,5],[500000,6],[1000000,7],[2000000,8],[5000000,9],[10000000,10]]
  for (let i=1;i<t.length;i++) {
    if (n<=t[i][0]) {
      const r=(n-t[i-1][0])/(t[i][0]-t[i-1][0])
      return Math.max(1,Math.min(10,parseFloat((t[i-1][1]+r*(t[i][1]-t[i-1][1])).toFixed(1))))
    }
  }
  return 10
}
function computeCostScore(v: string): number {
  const n=Number(v)||0
  if (n<=0) return 5
  const t: [number,number][] = [[0,10],[25000,9],[75000,8],[150000,7],[250000,6],[400000,5],[600000,4],[1000000,2],[2000000,1]]
  for (let i=1;i<t.length;i++) {
    if (n<=t[i][0]) {
      const r=(n-t[i-1][0])/(t[i][0]-t[i-1][0])
      return Math.max(1,Math.min(10,parseFloat((t[i-1][1]+r*(t[i][1]-t[i-1][1])).toFixed(1))))
    }
  }
  return 1
}
function getComputed(a: Athlete) {
  return {
    social_reach_calc: computeReachScore(totalReach(a)),
    cost_eff_calc: computeCostScore(a.cost),
  }
}
function catAvg(scores: Scores, cat: string, computed: Record<string,number>): number {
  let s=0, w=0
  for (const c of BY_CAT[cat]) { s+=(scores[c.key]??5)*c.w; w+=c.w }
  for (const c of BY_COMP[cat]) { s+=(computed[c.key]??5)*c.w; w+=c.w }
  return s/w
}
function autoAssign(scores: Scores, computed: Record<string,number>): string {
  let best='hero', bs=-1
  for (const k of Object.keys(CATS)) { const s=catAvg(scores,k,computed); if(s>bs){bs=s;best=k} }
  return best
}
function blankScores(): Scores { return Object.fromEntries(CRIT.map(c=>[c.key,5])) }
function blankAthlete(id: number): Athlete {
  return { id, name:'', sport:'', image:null, image_position:50, cost:'', reach_insta:'', reach_tiktok:'', reach_youtube:'', scores:blankScores() }
}

function compressImage(file: File): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        const SIZE = 400
        const ratio = Math.min(SIZE/img.width, SIZE/img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width*ratio)
        canvas.height = Math.round(img.height*ratio)
        canvas.getContext('2d')!.drawImage(img,0,0,canvas.width,canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.65))
      }
      img.src = e.target!.result as string
    }
    reader.readAsDataURL(file)
  })
}

function CitroenLogo({ size=55 }: { size?: number }) {
  return (
    <img
      src="/e4bfbd5e29837015b0189ed9012fe38e66d95fab.jpeg"
      width={size}
      height={Math.round(size * 1.2)}
      alt="Citroen"
      style={{ objectFit: 'contain' }}
    />
  )
}

function AthleteCard({ athlete, onClick }: { athlete: Athlete; onClick: () => void }) {
  const computed = getComputed(athlete)
  const cat = autoAssign(athlete.scores, computed)
  const info = CATS[cat]
  const ini = initials(athlete.name)
  const pos = athlete.image_position ?? 50
  const tr = totalReach(athlete)
  const hasMeta = athlete.cost || tr > 0

  return (
    <div onClick={onClick}
      style={{ background:'#fff', border:`1px solid ${RED}`, borderRadius:10, overflow:'hidden', cursor:'pointer', transition:'box-shadow 0.15s' }}
      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow=`0 4px 16px ${rgba(RED,0.15)}`}}
      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='none'}}
    >
      <div style={{height:3,background:info.color}}/>
      <div style={{width:'100%',height:200,background:rgba(info.color,0.06),display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',position:'relative'}}>
        {athlete.image
          ? <img src={athlete.image} alt={athlete.name} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:`center ${pos}%`}}/>
          : <div style={{width:80,height:80,borderRadius:'50%',background:rgba(info.color,0.15),color:info.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,fontWeight:500}}>{ini}</div>
        }
        <div style={{position:'absolute',top:10,left:10}}>
          <div style={{display:'inline-block',fontSize:10,fontWeight:500,padding:'3px 8px',borderRadius:4,background:'rgba(255,255,255,0.92)',color:info.color}}>{info.label}</div>
        </div>
      </div>
      <div style={{padding:'12px 16px'}}>
        <div style={{fontSize:16,fontWeight:500,lineHeight:1.2,marginBottom:2}}>{athlete.name||'--'}</div>
        <div style={{fontSize:11,color:'#888',marginBottom:hasMeta?8:10}}>{athlete.sport}</div>
        {hasMeta && (
          <div style={{display:'flex',gap:8,marginBottom:10,padding:'6px 10px',background:'#f5f5f5',borderRadius:6,flexWrap:'wrap',alignItems:'center'}}>
            {athlete.cost && <span style={{fontSize:11,fontWeight:500,color:'#1a1a1a'}}>{fmtCost(athlete.cost)}</span>}
            {athlete.cost && tr>0 && <div style={{width:1,background:'#e2e2e2',height:12}}/>}
            {Number(athlete.reach_insta)>0 && <span style={{fontSize:10}}><span style={{color:'#E1306C',fontWeight:600}}>IG</span> <span style={{fontWeight:500}}>{fmtReach(athlete.reach_insta)}</span></span>}
            {Number(athlete.reach_tiktok)>0 && <span style={{fontSize:10}}><span style={{color:'#555',fontWeight:600}}>TT</span> <span style={{fontWeight:500}}>{fmtReach(athlete.reach_tiktok)}</span></span>}
            {Number(athlete.reach_youtube)>0 && <span style={{fontSize:10}}><span style={{color:'#FF0000',fontWeight:600}}>YT</span> <span style={{fontWeight:500}}>{fmtReach(athlete.reach_youtube)}</span></span>}
          </div>
        )}
        <div style={{borderTop:'0.5px solid #e2e2e2',paddingTop:10}}>
          {Object.entries(CATS).map(([k,c])=>{
            const s=catAvg(athlete.scores,k,computed), isM=k===cat
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
  const [form, setForm] = useState<Athlete>({...data, scores:{...data.scores}})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const computed = getComputed(form)
  const cat = autoAssign(form.scores, computed)
  const info = CATS[cat]
  const ini = initials(form.name)
  const pos = form.image_position ?? 50

  const updateScore = (key: string, val: number) => setForm(f=>({...f,scores:{...f.scores,[key]:val}}))
  const updateField = (field: keyof Athlete, val: string) => setForm(f=>({...f,[field]:val}))

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const b64 = await compressImage(file)
    setForm(f=>({...f,image:b64,image_position:50}))
    setUploading(false)
    e.target.value=''
  }

  const handleSave = async () => {
    if (!form.name.trim()) { alert('Bitte Namen eingeben.'); return }
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  const inp: React.CSSProperties = { width:'100%', padding:'8px 10px', border:'1px solid #e2e2e2', borderRadius:6, fontSize:13, fontFamily:'inherit', outline:'none' }

  return (
    <div style={{maxWidth:680,margin:'0 auto',padding:'20px 24px'}}>
      <button onClick={onBack} style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'none',color:'#888',fontSize:13,cursor:'pointer',padding:0,marginBottom:16,fontFamily:'inherit'}}>
        Zurueck zur Uebersicht
      </button>

      <div style={{background:rgba(info.color,0.08),border:`0.5px solid ${rgba(info.color,0.3)}`,borderRadius:8,padding:'10px 14px',marginBottom:20,display:'flex',alignItems:'center',gap:10}}>
        <div>
          <div style={{fontSize:10,color:'#888',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:2}}>Kategorie (auto):</div>
          <div style={{fontSize:14,fontWeight:500,color:info.color}}>{info.label}</div>
        </div>
        <div style={{fontSize:11,color:'#888',marginLeft:8}}>Score {catAvg(form.scores,cat,computed).toFixed(2)}</div>
        <div style={{display:'flex',gap:5,alignItems:'flex-end',marginLeft:'auto'}}>
          {Object.entries(CATS).map(([k,c])=>{
            const s=catAvg(form.scores,k,computed), isM=k===cat
            return (
              <div key={k} title={`${c.label}: ${s.toFixed(2)}`} style={{width:22,display:'flex',flexDirection:'column-reverse',borderRadius:3,overflow:'hidden',height:28,background:'#e2e2e2',border:`1px solid ${isM?c.color:'transparent'}`}}>
                <div style={{width:'100%',height:`${(s/10*100).toFixed(0)}%`,background:isM?c.color:'#c0c0c0',transition:'height 0.2s'}}/>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{marginBottom:20}}>
        <div style={{width:'100%',height:240,borderRadius:10,overflow:'hidden',background:rgba(info.color,0.06),border:`1px solid ${rgba(info.color,0.2)}`,display:'flex',alignItems:'center',justifyContent:'center',position:'relative',marginBottom:10}}>
          {form.image
            ? <img src={form.image} alt={form.name} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:`center ${pos}%`}}/>
            : <div style={{textAlign:'center',color:'#bbb'}}><div style={{fontSize:48,marginBottom:8}}>&#128100;</div><div style={{fontSize:12}}>Noch kein Foto</div></div>
          }
          {uploading && (
            <div style={{position:'absolute',inset:0,background:'rgba(255,255,255,0.85)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:'#888'}}>
              Wird verarbeitet...
            </div>
          )}
        </div>
        {form.image && (
          <div style={{marginBottom:10,padding:'10px 14px',background:'#f5f5f5',borderRadius:8,border:'0.5px solid #e2e2e2'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
              <label style={{fontSize:11,color:'#888'}}>Bildposition (oben bis unten)</label>
              <span style={{fontSize:11,color:'#888'}}>{pos}%</span>
            </div>
            <input type="range" min="0" max="100" step="1" value={pos}
              onChange={e=>setForm(f=>({...f,image_position:Number(e.target.value)}))}
              style={{width:'100%',accentColor:RED}}/>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#bbb',marginTop:2}}>
              <span>Oben</span><span>Unten</span>
            </div>
          </div>
        )}
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <label style={{display:'flex',alignItems:'center',gap:7,border:'0.5px solid #ccc',padding:'7px 14px',borderRadius:6,fontSize:12,cursor:'pointer',background:'#fff'}}>
            Foto hochladen
            <input type="file" accept="image/*" onChange={handleImage} style={{display:'none'}}/>
          </label>
          {form.image && <button onClick={()=>setForm(f=>({...f,image:null}))} style={{background:'none',border:'none',color:'#aaa',fontSize:12,cursor:'pointer',padding:0,fontFamily:'inherit'}}>Bild entfernen</button>}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
        <div>
          <label style={{display:'block',fontSize:11,color:'#888',marginBottom:4}}>Name *</label>
          <input type="text" value={form.name} onChange={e=>updateField('name',e.target.value)} placeholder="Vor- und Nachname" style={inp}/>
        </div>
        <div>
          <label style={{display:'block',fontSize:11,color:'#888',marginBottom:4}}>Sportart / Disziplin</label>
          <input type="text" value={form.sport} onChange={e=>updateField('sport',e.target.value)} placeholder="z. B. Schwimmen 100m" style={inp}/>
        </div>
      </div>

      <div style={{marginBottom:24,padding:'14px 16px',background:'#f5f5f5',borderRadius:8,border:'0.5px solid #e2e2e2'}}>
        <div style={{marginBottom:14}}>
          <label style={{display:'block',fontSize:11,color:'#888',marginBottom:4}}>Kosten / Jahr (EUR)</label>
          <input type="number" min="0" step="1000" value={form.cost} onChange={e=>updateField('cost',e.target.value)} placeholder="z. B. 150000" style={inp}/>
          <div style={{display:'flex',alignItems:'center',gap:6,marginTop:7}}>
            <span style={{fontSize:10,color:'#888'}}>Effizienz:</span>
            <div style={{flex:1,height:4,background:'#e2e2e2',borderRadius:2,overflow:'hidden'}}>
              <div style={{width:`${computeCostScore(form.cost)/10*100}%`,height:'100%',background:'#B8860B',borderRadius:2}}/>
            </div>
            <span style={{fontSize:11,fontWeight:500,color:'#B8860B'}}>{computeCostScore(form.cost).toFixed(1)}</span>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:10}}>
          <div>
            <label style={{display:'block',fontSize:11,color:'#E1306C',marginBottom:4}}>Instagram Follower</label>
            <input type="number" min="0" step="1000" value={form.reach_insta} onChange={e=>updateField('reach_insta',e.target.value)} placeholder="z. B. 131000" style={inp}/>
          </div>
          <div>
            <label style={{display:'block',fontSize:11,color:'#555',marginBottom:4}}>TikTok Follower</label>
            <input type="number" min="0" step="1000" value={form.reach_tiktok} onChange={e=>updateField('reach_tiktok',e.target.value)} placeholder="z. B. 50000" style={inp}/>
          </div>
          <div>
            <label style={{display:'block',fontSize:11,color:'#FF0000',marginBottom:4}}>YouTube Abonnenten</label>
            <input type="number" min="0" step="1000" value={form.reach_youtube} onChange={e=>updateField('reach_youtube',e.target.value)} placeholder="z. B. 5000" style={inp}/>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{fontSize:10,color:'#888'}}>Reichweite gesamt ({fmtReach(String(totalReach(form)))}):</span>
          <div style={{flex:1,height:4,background:'#e2e2e2',borderRadius:2,overflow:'hidden'}}>
            <div style={{width:`${computeReachScore(totalReach(form))/10*100}%`,height:'100%',background:'#0F7E45',borderRadius:2}}/>
          </div>
          <span style={{fontSize:11,fontWeight:500,color:'#0F7E45'}}>{computeReachScore(totalReach(form)).toFixed(1)}</span>
        </div>
      </div>

      <div style={{fontSize:10,fontWeight:500,color:'#888',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:14,paddingBottom:6,borderBottom:'0.5px solid #e2e2e2'}}>
        Scoring-Kriterien
      </div>

      {Object.entries(CATS).map(([k,c])=>{
        const isM=k===cat, avg=catAvg(form.scores,k,computed)
        return (
          <div key={k} style={{marginBottom:20}}>
            <div style={{display:'flex',alignItems:'center',gap:8,paddingBottom:7,marginBottom:10,borderBottom:`1.5px solid ${isM?c.color:'#e2e2e2'}`}}>
              <div style={{width:7,height:7,borderRadius:'50%',background:isM?c.color:'#e2e2e2',flexShrink:0}}/>
              <span style={{fontSize:11,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.08em',color:isM?c.color:'#888'}}>{c.label}</span>
              <span style={{marginLeft:'auto',fontSize:11,color:isM?c.color:'#888'}}>Avg {avg.toFixed(2)}</span>
            </div>
            {BY_CAT[k].map(cr=>(
              <div key={cr.key} style={{marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                  <label style={{fontSize:12,color:'#1a1a1a'}} title={cr.hint}>{cr.label} <span style={{fontSize:10,color:'#aaa'}}>x{cr.w}</span></label>
                  <span style={{fontSize:12,fontWeight:500,color:isM?c.color:'#1a1a1a'}}>{form.scores[cr.key]??5}</span>
                </div>
                <input type="range" min="1" max="10" step="1" value={form.scores[cr.key]??5} onChange={e=>updateScore(cr.key,Number(e.target.value))} style={{width:'100%',accentColor:c.color}}/>
              </div>
            ))}
            <div style={{fontSize:10,color:'#aaa',textTransform:'uppercase',letterSpacing:'0.08em',margin:'10px 0 6px',paddingTop:8,borderTop:'0.5px dashed #e2e2e2'}}>Auto-berechnet</div>
            {BY_COMP[k].map((cc,i)=>{
              const sc=computed[cc.key as keyof typeof computed]
              return (
                <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:7,padding:'5px 8px',background:'#f5f5f5',borderRadius:4}}>
                  <span style={{fontSize:11,color:'#888',minWidth:28}}>{cc.key==='social_reach_calc'?'SM':'EUR'}</span>
                  <span style={{fontSize:11,color:'#666',flex:1}}>{cc.label}</span>
                  <div style={{width:60,height:3,background:'#e2e2e2',borderRadius:2,overflow:'hidden'}}>
                    <div style={{width:`${(sc/10*100).toFixed(0)}%`,height:'100%',background:isM?c.color:'#c0c0c0'}}/>
                  </div>
                  <span style={{fontSize:11,fontWeight:500,color:isM?c.color:'#888',minWidth:20,textAlign:'right'}}>{sc.toFixed(1)}</span>
                  <span style={{fontSize:10,color:'#aaa',minWidth:28,textAlign:'right'}}>x{cc.w}</span>
                </div>
              )
            })}
          </div>
        )
      })}

      <div style={{display:'flex',gap:8,paddingTop:16,borderTop:'0.5px solid #e2e2e2',marginTop:8}}>
        {!isNew && <button onClick={onDelete} style={{background:'none',border:'0.5px solid #e2e2e2',color:'#aaa',padding:'8px 14px',borderRadius:6,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>Loeschen</button>}
        <button onClick={onBack} style={{background:'none',border:'0.5px solid #ccc',color:'#1a1a1a',padding:'8px 14px',borderRadius:6,fontSize:13,cursor:'pointer',fontFamily:'inherit',marginLeft:isNew?'auto':0}}>Abbrechen</button>
        <button onClick={handleSave} disabled={saving||uploading} style={{background:RED,color:'#fff',border:'none',padding:'8px 22px',borderRadius:6,fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit',opacity:(saving||uploading)?0.7:1}}>
          {saving?'Speichern...':'Speichern'}
        </button>
      </div>
    </div>
  )
}

export default function Home() {
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [view, setView] = useState<'grid'|'edit'>('grid')
  const [editData, setEditData] = useState<Athlete|null>(null)
  const [loaded, setLoaded] = useState(false)
  const [isLive, setIsLive] = useState(false)

  useEffect(()=>{
    async function load() {
      try {
        const {data,error} = await supabase.from('athletes').select('*').order('created_at',{ascending:true})
        if (data&&!error) {
          setAthletes(data.map(a=>({reach_insta:'',reach_tiktok:'',reach_youtube:'',image_position:50,...a})))
          setIsLive(true)
        } else setAthletes([])
      } catch { setAthletes([]) }
      setLoaded(true)
    }
    load()
  },[])

  const openAdd = () => { setEditData(blankAthlete(Date.now())); setView('edit') }
  const openEdit = (a: Athlete) => { setEditData({...a,scores:{...a.scores}}); setView('edit') }
  const goBack = () => { setView('grid'); setEditData(null) }

  const handleSave = async (data: Athlete) => {
    try {
      const {error} = await supabase.from('athletes').upsert(data)
      if (error) { alert('Fehler beim Speichern: '+error.message); return }
      setAthletes(prev=>{const idx=prev.findIndex(a=>a.id===data.id);return idx>=0?prev.map(a=>a.id===data.id?data:a):[...prev,data]})
      goBack()
    } catch { alert('Unbekannter Fehler beim Speichern.') }
  }

  const handleDelete = async () => {
    if (!editData||!confirm('Athleten wirklich loeschen?')) return
    try {
      const {error} = await supabase.from('athletes').delete().eq('id',editData.id)
      if (!error) setAthletes(prev=>prev.filter(a=>a.id!==editData.id))
    } catch {}
    goBack()
  }

  if (!loaded) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'#888'}}>Lade...</div>

  return (
    <div style={{minHeight:'100vh',background:'#fff'}}>
      <header style={{display:'flex',alignItems:'center',gap:12,padding:'0 24px',height:70,borderBottom:`2.5px solid ${RED}`,background:'#fff',position:'sticky',top:0,zIndex:10}}>
        <CitroenLogo size={55}/>
        <div>
          <div style={{fontSize:10,color:RED,letterSpacing:'0.15em',textTransform:'uppercase',fontWeight:500}}>Citroen</div>
          <div style={{fontSize:17,fontWeight:500,lineHeight:1}}>Athlete Squad Matrix</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,marginLeft:16,padding:'3px 10px',borderRadius:20,background:isLive?'#f0fdf4':'#fef2f2',border:`1px solid ${isLive?'#86efac':'#fca5a5'}`}}>
          <div style={{width:7,height:7,borderRadius:'50%',background:isLive?'#22c55e':RED,boxShadow:isLive?'0 0 0 2px rgba(34,197,94,0.3)':'none'}}/>
          <span style={{fontSize:11,fontWeight:500,color:isLive?'#16a34a':RED}}>{isLive?'Live':'Offline'}</span>
        </div>
        {view==='grid' && (
          <button onClick={openAdd} style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6,background:RED,color:'#fff',border:'none',padding:'8px 16px',borderRadius:6,fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:'inherit'}}>
            + Athlet hinzufuegen
          </button>
        )}
      </header>

      {view==='grid'?(
        <div style={{padding:'20px 24px',display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))',gap:14}}>
          {athletes.length===0?(
            <div style={{gridColumn:'1/-1',textAlign:'center',padding:80,color:'#aaa'}}>
              <CitroenLogo size={80}/>
              <p style={{marginTop:16,fontSize:14}}>Noch keine Athleten.<br/>Klick auf Athlet hinzufuegen.</p>
            </div>
          ):athletes.map(a=><AthleteCard key={a.id} athlete={a} onClick={()=>openEdit(a)}/>)}
        </div>
      ):editData?(
        <EditView data={editData} isNew={!athletes.find(a=>a.id===editData.id)} onSave={handleSave} onDelete={handleDelete} onBack={goBack}/>
      ):null}
    </div>
  )
}
