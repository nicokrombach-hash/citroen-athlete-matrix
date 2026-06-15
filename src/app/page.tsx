'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface PressStory { id: string; url: string; text: string }
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
  comments: string
  presse_storys: PressStory[]
  para_locked: boolean
  scores: Scores
}

const RED = '#DA291C'
const CAT_ORDER = ['hero','medal','para','inspiring','rising'] as const
const CATS: Record<string, { label: string; abbr: string; color: string }> = {
  hero:      { label: 'Hero Ambassador',  abbr: 'HERO',    color: '#DA291C' },
  medal:     { label: 'Medal Candidate',  abbr: 'MEDAL',   color: '#B8860B' },
  para:      { label: 'Paralympic Star',  abbr: 'PARA',    color: '#185FA5' },
  inspiring: { label: 'Inspiring Hero',   abbr: 'INSPIRE', color: '#6B21A8' },
  rising:    { label: 'Rising Star',      abbr: 'RISING',  color: '#0F7E45' },
}

const GENERAL_CRIT = [
  { key: 'strategy_fit',      label: 'Strategie Fit',              w: 1.0, hint: 'Passt zur Citroen-Markenstrategie' },
  { key: 'good_to_work',      label: 'Good to work with',          w: 1.0, hint: 'Zusammenarbeit, Zuverlaessigkeit' },
  { key: 'social_competence', label: 'Soziale Kompetenz / Events', w: 1.0, hint: 'Ausstrahlung bei Events und Umgang' },
  { key: 'growth_potential',  label: 'Growth Potential',           w: 1.0, hint: 'Langfristiges Wachstumspotenzial' },
]

const CRIT = [
  { key: 'brand_match',           label: 'Markenwerte-Match',        cat: 'hero',      w: 1.5, hint: 'Passt der Athlet zu Citroens Werten?', checkbox: false },
  { key: 'recognition',           label: 'Wiedererkennungswert',     cat: 'hero',      w: 1.5, hint: 'Bekanntheit in D und international',   checkbox: false },
  { key: 'reach',                 label: 'Strahlkraft Reichweite',   cat: 'hero',      w: 1.0, hint: 'Qualitative Strahlkraft',              checkbox: false },
  { key: 'medal_chance',          label: 'Medaillenchance LA28',      cat: 'medal',     w: 2.0, hint: 'Wie realistisch ist eine Medaille?',   checkbox: false },
  { key: 'track_record',          label: 'Int. Track Record',        cat: 'medal',     w: 1.5, hint: 'Internationale Erfolge',              checkbox: false },
  { key: 'consistency',           label: 'Wettkampf-Konstanz',       cat: 'medal',     w: 1.0, hint: 'Stabile Performance unter Druck',     checkbox: false },
  { key: 'olympic_participation', label: 'Olympia-Teilnahme',        cat: 'medal',     w: 1.5, hint: 'Bereits bei Olympia dabei?',           checkbox: true  },
  { key: 'story_depth',           label: 'Emotionale Story-Tiefe',   cat: 'inspiring', w: 1.5, hint: 'Tiefe der persoenlichen Geschichte',   checkbox: false },
  { key: 'resilience',            label: 'Comeback Resilience',      cat: 'inspiring', w: 1.5, hint: 'Ueberwindung von Rueckschlaegen',      checkbox: false },
  { key: 'authenticity',          label: 'Authentizitaet',           cat: 'inspiring', w: 1.0, hint: 'Glaubwuerdigkeit der Story',           checkbox: false },
  { key: 'para_profile',          label: 'Para-Profil Sichtbarkeit', cat: 'para',      w: 1.5, hint: 'Bekanntheit im Para-Sport',            checkbox: false },
  { key: 'para_medals',           label: 'Medaillen-Potenzial Para', cat: 'para',      w: 2.0, hint: 'Para-Medaillenchance',                 checkbox: false },
  { key: 'inclusion',             label: 'Inklusions-Statement',     cat: 'para',      w: 1.0, hint: 'Kraft als Inklusionsbotschafter',      checkbox: false },
  { key: 'breakout',              label: 'Breakout-Potenzial',       cat: 'rising',    w: 1.5, hint: 'Potenzial zum naechsten grossen Namen', checkbox: false },
  { key: 'youth_appeal',          label: 'Junge Zielgruppe 16-30',   cat: 'rising',    w: 1.0, hint: 'Relevanz fuer junge Fans',             checkbox: false },
  { key: 'engagement',            label: 'Content-Qualitaet',        cat: 'rising',    w: 1.5, hint: 'Qualitaet des Social-Contents',        checkbox: false },
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
  const n = Number(v); if (!n) return '--'
  return 'EUR ' + n.toLocaleString('de-DE')
}
function fmtReach(v: string) {
  const n = Number(v); if (!n) return '0'
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
  const n=Number(v)||0; if (n<=0) return 5
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
  for (const c of GENERAL_CRIT) { s+=(scores[c.key]??5)*c.w; w+=c.w }
  return s/w
}
function autoAssign(a: Athlete, computed: Record<string,number>): string {
  if (a.para_locked) return 'para'
  let best='hero', bs=-1
  for (const k of Object.keys(CATS)) {
    const s=catAvg(a.scores,k,computed)
    if(s>bs){bs=s;best=k}
  }
  return best
}
function blankScores(): Scores {
  const s: Scores = {}
  for (const c of CRIT) s[c.key] = c.checkbox ? 1 : 5
  for (const c of GENERAL_CRIT) s[c.key] = 5
  return s
}
function blankAthlete(id: number): Athlete {
  return { id, name:'', sport:'', image:null, image_position:15, cost:'', reach_insta:'', reach_tiktok:'', reach_youtube:'', comments:'', presse_storys:[], para_locked:false, scores:blankScores() }
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
  return <img src="/e4bfbd5e29837015b0189ed9012fe38e66d95fab.jpeg" width={size} height={Math.round(size*1.2)} alt="Citroen" style={{objectFit:'contain'}}/>
}

function AthleteCard({ athlete, onClick }: { athlete: Athlete; onClick: () => void }) {
  const computed = getComputed(athlete)
  const cat = autoAssign(athlete, computed)
  const info = CATS[cat]
  const ini = initials(athlete.name)
  const pos = athlete.image_position ?? 15
  const tr = totalReach(athlete)
  const hasMeta = athlete.cost || tr > 0
  const isOlympian = (athlete.scores['olympic_participation'] ?? 1) >= 10

  return (
    <div onClick={onClick}
      style={{background:'#fff',border:'1px solid #e8e8e8',borderRadius:12,overflow:'hidden',cursor:'pointer',transition:'box-shadow 0.15s',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}
      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow=`0 6px 20px ${rgba(info.color,0.15)}`}}
      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='0 1px 4px rgba(0,0,0,0.06)'}}
    >
      <div style={{height:3,background:info.color}}/>
      <div style={{width:'100%',height:240,background:rgba(info.color,0.06),display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',position:'relative'}}>
        {athlete.image
          ? <img src={athlete.image} alt={athlete.name} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:`center ${pos}%`}}/>
          : <div style={{width:80,height:80,borderRadius:'50%',background:rgba(info.color,0.15),color:info.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,fontWeight:500}}>{ini}</div>
        }
        <div style={{position:'absolute',top:8,left:8,display:'flex',gap:4,flexWrap:'wrap'}}>
          <div style={{fontSize:10,fontWeight:500,padding:'3px 8px',borderRadius:20,background:'rgba(255,255,255,0.93)',color:info.color}}>{info.label}</div>
          {isOlympian && <div style={{fontSize:10,fontWeight:600,padding:'3px 8px',borderRadius:20,background:'rgba(255,255,255,0.93)',color:'#B8860B'}}>Olympia</div>}
          {athlete.para_locked && <div style={{fontSize:10,fontWeight:600,padding:'3px 8px',borderRadius:20,background:'rgba(255,255,255,0.93)',color:'#185FA5'}}>Para</div>}
        </div>
        {(athlete.presse_storys?.length > 0) && (
          <div style={{position:'absolute',bottom:8,right:8,fontSize:10,fontWeight:600,padding:'3px 8px',borderRadius:20,background:'rgba(255,255,255,0.93)',color:'#555'}}>PR {athlete.presse_storys.length}</div>
        )}
      </div>
      <div style={{padding:'12px 14px'}}>
        <div style={{fontSize:15,fontWeight:600,lineHeight:1.2,marginBottom:2}}>{athlete.name||'--'}</div>
        <div style={{fontSize:11,color:'#888',marginBottom:athlete.comments?6:hasMeta?8:10}}>{athlete.sport}</div>
        {athlete.comments && (
          <div style={{fontSize:11,color:'#666',fontStyle:'italic',marginBottom:8,padding:'5px 8px',background:'#f8f8f8',borderRadius:6,borderLeft:'2px solid #ddd'}}>
            {athlete.comments.length > 60 ? athlete.comments.slice(0,60)+'...' : athlete.comments}
          </div>
        )}
        {hasMeta && (
          <div style={{display:'flex',gap:8,marginBottom:10,padding:'6px 10px',background:'#f5f5f5',borderRadius:8,flexWrap:'wrap',alignItems:'center'}}>
            {athlete.cost && <span style={{fontSize:11,fontWeight:500,color:'#1a1a1a'}}>{fmtCost(athlete.cost)}</span>}
            {athlete.cost && tr>0 && <div style={{width:1,background:'#e2e2e2',height:12}}/>}
            {Number(athlete.reach_insta)>0 && <span style={{fontSize:10}}><span style={{color:'#E1306C',fontWeight:600}}>IG</span> <span style={{fontWeight:500}}>{fmtReach(athlete.reach_insta)}</span></span>}
            {Number(athlete.reach_tiktok)>0 && <span style={{fontSize:10}}><span style={{color:'#555',fontWeight:600}}>TT</span> <span style={{fontWeight:500}}>{fmtReach(athlete.reach_tiktok)}</span></span>}
            {Number(athlete.reach_youtube)>0 && <span style={{fontSize:10}}><span style={{color:'#FF0000',fontWeight:600}}>YT</span> <span style={{fontWeight:500}}>{fmtReach(athlete.reach_youtube)}</span></span>}
          </div>
        )}
        <div style={{borderTop:'0.5px solid #f0f0f0',paddingTop:10}}>
          {CAT_ORDER.map(k=>{
            const c=CATS[k], s=catAvg(athlete.scores,k,computed), isM=k===cat
            return (
              <div key={k} style={{display:'flex',alignItems:'center',gap:7,marginBottom:5}}>
                <div style={{fontSize:9,fontWeight:500,letterSpacing:'0.06em',width:52,flexShrink:0,color:isM?c.color:'#bbb'}}>{c.abbr}</div>
                <div style={{flex:1,height:3,background:'#f0f0f0',borderRadius:2,overflow:'hidden'}}>
                  <div style={{width:`${(s/10*100).toFixed(0)}%`,height:'100%',background:isM?c.color:'#ddd',borderRadius:2}}/>
                </div>
                <div style={{fontSize:9,width:24,textAlign:'right',color:isM?c.color:'#bbb'}}>{s.toFixed(1)}</div>
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
  const [form, setForm] = useState<Athlete>({
    ...data,
    scores: {...data.scores},
    comments: data.comments || '',
    presse_storys: data.presse_storys || [],
    para_locked: data.para_locked || false,
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [newStory, setNewStory] = useState({url:'',text:''})

  const computed = getComputed(form)
  const cat = autoAssign(form, computed)
  const info = CATS[cat]
  const pos = form.image_position ?? 15

  const updateScore = (key: string, val: number) => setForm(f=>({...f,scores:{...f.scores,[key]:val}}))
  const updateField = (field: keyof Athlete, val: string) => setForm(f=>({...f,[field]:val}))

  const addStory = () => {
    if (!newStory.text.trim() && !newStory.url.trim()) return
    const story: PressStory = {id:Date.now().toString(), url:newStory.url.trim(), text:newStory.text.trim()}
    setForm(f=>({...f, presse_storys:[...(f.presse_storys||[]), story]}))
    setNewStory({url:'',text:''})
  }
  const removeStory = (id: string) => setForm(f=>({...f, presse_storys:(f.presse_storys||[]).filter(s=>s.id!==id)}))

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    const b64 = await compressImage(file)
    setForm(f=>({...f, image:b64, image_position:15}))
    setUploading(false)
    e.target.value=''
  }

  const handleSave = async () => {
    if (!form.name.trim()) { alert('Bitte Namen eingeben.'); return }
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  const inp: React.CSSProperties = {width:'100%',padding:'8px 10px',border:'1px solid #e2e2e2',borderRadius:8,fontSize:13,fontFamily:'inherit',outline:'none',background:'#fff'}

  return (
    <div style={{maxWidth:680,margin:'0 auto',padding:'20px 24px'}}>
      <button onClick={onBack} style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'none',color:'#888',fontSize:13,cursor:'pointer',padding:0,marginBottom:16,fontFamily:'inherit'}}>
        Zurueck zur Uebersicht
      </button>

      <div style={{marginBottom:16,padding:'12px 16px',background:form.para_locked?'#e8f0fe':'#f8f8f8',borderRadius:12,border:`1px solid ${form.para_locked?'#185FA5':'#e2e2e2'}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontSize:13,fontWeight:600,color:form.para_locked?'#185FA5':'#888'}}>Para / Paralympic Athlet</div>
          <div style={{fontSize:11,color:'#aaa',marginTop:2}}>Wenn aktiv, bleibt der Athlet immer in der Paralympic Star Spalte</div>
        </div>
        <div onClick={()=>setForm(f=>({...f,para_locked:!f.para_locked}))}
          style={{width:48,height:26,borderRadius:13,background:form.para_locked?'#185FA5':'#ddd',cursor:'pointer',position:'relative',transition:'background 0.2s',flexShrink:0}}>
          <div style={{position:'absolute',top:3,left:form.para_locked?22:3,width:20,height:20,borderRadius:'50%',background:'#fff',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
        </div>
      </div>

      <div style={{background:rgba(info.color,0.07),border:`1px solid ${rgba(info.color,0.2)}`,borderRadius:12,padding:'12px 16px',marginBottom:20,display:'flex',alignItems:'center',gap:10}}>
        <div>
          <div style={{fontSize:10,color:'#888',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:2}}>Kategorie (auto):</div>
          <div style={{fontSize:15,fontWeight:600,color:info.color}}>{info.label}{form.para_locked?' (gesperrt)':''}</div>
        </div>
        <div style={{fontSize:11,color:'#888',marginLeft:8}}>Score {catAvg(form.scores,cat,computed).toFixed(2)}</div>
        <div style={{display:'flex',gap:5,alignItems:'flex-end',marginLeft:'auto'}}>
          {CAT_ORDER.map(k=>{
            const c=CATS[k], s=catAvg(form.scores,k,computed), isM=k===cat
            return (
              <div key={k} title={`${c.label}: ${s.toFixed(2)}`} style={{width:22,display:'flex',flexDirection:'column-reverse',borderRadius:4,overflow:'hidden',height:28,background:'#e2e2e2',border:`1.5px solid ${isM?c.color:'transparent'}`}}>
                <div style={{width:'100%',height:`${(s/10*100).toFixed(0)}%`,background:isM?c.color:'#c0c0c0',transition:'height 0.2s'}}/>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{marginBottom:20}}>
        <div style={{width:'100%',height:260,borderRadius:12,overflow:'hidden',background:rgba(info.color,0.06),border:`1px solid ${rgba(info.color,0.15)}`,display:'flex',alignItems:'center',justifyContent:'center',position:'relative',marginBottom:10}}>
          {form.image
            ? <img src={form.image} alt={form.name} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:`center ${pos}%`}}/>
            : <div style={{textAlign:'center',color:'#bbb'}}><div style={{fontSize:48,marginBottom:8}}>👤</div><div style={{fontSize:12}}>Noch kein Foto</div></div>
          }
          {uploading && <div style={{position:'absolute',inset:0,background:'rgba(255,255,255,0.85)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:'#888'}}>Wird verarbeitet...</div>}
        </div>
        {form.image && (
          <div style={{marginBottom:10,padding:'10px 14px',background:'#f8f8f8',borderRadius:10,border:'1px solid #ececec'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
              <label style={{fontSize:11,color:'#888'}}>Bildausschnitt</label>
              <span style={{fontSize:11,color:'#888'}}>{pos}%</span>
            </div>
            <input type="range" min="0" max="100" step="1" value={pos} onChange={e=>setForm(f=>({...f,image_position:Number(e.target.value)}))} style={{width:'100%',accentColor:RED}}/>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#bbb',marginTop:2}}>
              <span>Gesicht / Oben</span><span>Koerper / Unten</span>
            </div>
          </div>
        )}
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <label style={{display:'flex',alignItems:'center',gap:7,border:'1px solid #e0e0e0',padding:'7px 14px',borderRadius:8,fontSize:12,cursor:'pointer',background:'#fff'}}>
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

      <div style={{marginBottom:20,padding:'14px 16px',background:'#f8f8f8',borderRadius:12,border:'1px solid #ececec'}}>
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
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:16}}>
          <span style={{fontSize:10,color:'#888'}}>Reichweite gesamt ({fmtReach(String(totalReach(form)))}):</span>
          <div style={{flex:1,height:4,background:'#e2e2e2',borderRadius:2,overflow:'hidden'}}>
            <div style={{width:`${computeReachScore(totalReach(form))/10*100}%`,height:'100%',background:'#0F7E45',borderRadius:2}}/>
          </div>
          <span style={{fontSize:11,fontWeight:500,color:'#0F7E45'}}>{computeReachScore(totalReach(form)).toFixed(1)}</span>
        </div>
        <div>
          <label style={{display:'block',fontSize:11,color:'#888',marginBottom:4}}>Kommentare / Notizen</label>
          <textarea value={form.comments} onChange={e=>updateField('comments',e.target.value)} placeholder="Interne Notizen zum Athleten..." rows={3} style={{...inp,resize:'vertical',lineHeight:'1.5'}}/>
        </div>
      </div>

      <div style={{marginBottom:24,padding:'14px 16px',background:'#fff8f0',borderRadius:12,border:'1px solid #fde8cc'}}>
        <div style={{fontSize:10,fontWeight:700,color:'#c47800',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:14}}>PR / Presse Stories</div>
        {(form.presse_storys||[]).map(story=>(
          <div key={story.id} style={{marginBottom:10,padding:'10px 12px',background:'#fff',borderRadius:8,border:'1px solid #ececec',position:'relative'}}>
            {story.url && <a href={story.url} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:'#c47800',fontWeight:600,wordBreak:'break-all',display:'block',marginBottom:story.text?4:0}}>{story.url}</a>}
            {story.text && <div style={{fontSize:12,color:'#444',lineHeight:1.5}}>{story.text}</div>}
            <button onClick={()=>removeStory(story.id)} style={{position:'absolute',top:8,right:10,background:'none',border:'none',color:'#ccc',fontSize:16,cursor:'pointer',padding:0}}>x</button>
          </div>
        ))}
        <div style={{background:'#fff',borderRadius:8,border:'1px solid #ececec',padding:'10px 12px'}}>
          <div style={{fontSize:10,color:'#aaa',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.08em'}}>Neue Story hinzufuegen</div>
          <input type="text" value={newStory.url} onChange={e=>setNewStory(s=>({...s,url:e.target.value}))} placeholder="URL / Link (optional)" style={{...inp,marginBottom:8,fontSize:12}}/>
          <textarea value={newStory.text} onChange={e=>setNewStory(s=>({...s,text:e.target.value}))} placeholder="Beschreibung oder Text..." rows={2} style={{...inp,marginBottom:8,resize:'vertical',fontSize:12,lineHeight:'1.5'}}/>
          <button onClick={addStory} style={{background:'#c47800',color:'#fff',border:'none',padding:'7px 16px',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>+ Hinzufuegen</button>
        </div>
      </div>

      <div style={{marginBottom:24,padding:'14px 16px',background:'#f0f4ff',borderRadius:12,border:'1px solid #dde5ff'}}>
        <div style={{fontSize:10,fontWeight:700,color:'#4466cc',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:14}}>Allgemeine Bewertung - fliesst in alle Kategorien ein</div>
        {GENERAL_CRIT.map(cr=>(
          <div key={cr.key} style={{marginBottom:12}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
              <label style={{fontSize:12,fontWeight:500,color:'#1a1a1a'}} title={cr.hint}>{cr.label} <span style={{fontSize:10,color:'#aab'}}>x{cr.w}</span></label>
              <span style={{fontSize:12,fontWeight:600,color:'#4466cc',minWidth:16,textAlign:'right'}}>{form.scores[cr.key]??5}</span>
            </div>
            <input type="range" min="1" max="10" step="1" value={form.scores[cr.key]??5} onChange={e=>updateScore(cr.key,Number(e.target.value))} style={{width:'100%',accentColor:'#4466cc'}}/>
          </div>
        ))}
      </div>

      <div style={{fontSize:10,fontWeight:700,color:'#888',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:14,paddingBottom:6,borderBottom:'1px solid #ececec'}}>Kategorie-Kriterien</div>

      {CAT_ORDER.map(k=>{
        const c=CATS[k], isM=k===cat, avg=catAvg(form.scores,k,computed)
        return (
          <div key={k} style={{marginBottom:24}}>
            <div style={{display:'flex',alignItems:'center',gap:8,paddingBottom:8,marginBottom:12,borderBottom:`2px solid ${isM?c.color:'#ececec'}`}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:isM?c.color:'#ddd',flexShrink:0}}/>
              <span style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',color:isM?c.color:'#aaa'}}>{c.label}</span>
              <span style={{marginLeft:'auto',fontSize:11,color:isM?c.color:'#aaa',fontWeight:500}}>Avg {avg.toFixed(2)}</span>
            </div>
            {BY_CAT[k].map(cr=>(
              <div key={cr.key} style={{marginBottom:12}}>
                {cr.checkbox ? (
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',background:'#f8f8f8',borderRadius:8,border:'1px solid #ececec'}}>
                    <div>
                      <div style={{fontSize:12,fontWeight:500,color:'#1a1a1a'}}>{cr.label}</div>
                      <div style={{fontSize:10,color:'#aaa',marginTop:1}}>{cr.hint} - x{cr.w}</div>
                    </div>
                    <div onClick={()=>updateScore(cr.key,(form.scores[cr.key]??1)>=10?1:10)}
                      style={{width:44,height:24,borderRadius:12,background:(form.scores[cr.key]??1)>=10?c.color:'#ddd',cursor:'pointer',position:'relative',transition:'background 0.2s',flexShrink:0}}>
                      <div style={{position:'absolute',top:2,left:(form.scores[cr.key]??1)>=10?20:2,width:20,height:20,borderRadius:'50%',background:'#fff',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                      <label style={{fontSize:12,color:'#1a1a1a'}} title={cr.hint}>{cr.label} <span style={{fontSize:10,color:'#bbb'}}>x{cr.w}</span></label>
                      <span style={{fontSize:12,fontWeight:600,color:isM?c.color:'#1a1a1a',minWidth:16,textAlign:'right'}}>{form.scores[cr.key]??5}</span>
                    </div>
                    <input type="range" min="1" max="10" step="1" value={form.scores[cr.key]??5} onChange={e=>updateScore(cr.key,Number(e.target.value))} style={{width:'100%',accentColor:c.color}}/>
                  </>
                )}
              </div>
            ))}
            <div style={{fontSize:10,color:'#bbb',textTransform:'uppercase',letterSpacing:'0.08em',margin:'12px 0 6px',paddingTop:8,borderTop:'1px dashed #ececec'}}>Auto-berechnet</div>
            {BY_COMP[k].map((cc,i)=>{
              const sc=computed[cc.key as keyof typeof computed]
              return (
                <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:7,padding:'6px 10px',background:'#f8f8f8',borderRadius:8}}>
                  <span style={{fontSize:11,color:'#aaa',minWidth:28}}>{cc.key==='social_reach_calc'?'SM':'EUR'}</span>
                  <span style={{fontSize:11,color:'#888',flex:1}}>{cc.label}</span>
                  <div style={{width:60,height:3,background:'#e2e2e2',borderRadius:2,overflow:'hidden'}}>
                    <div style={{width:`${(sc/10*100).toFixed(0)}%`,height:'100%',background:isM?c.color:'#ccc',borderRadius:2}}/>
                  </div>
                  <span style={{fontSize:11,fontWeight:500,color:isM?c.color:'#aaa',minWidth:20,textAlign:'right'}}>{sc.toFixed(1)}</span>
                  <span style={{fontSize:10,color:'#bbb',minWidth:28,textAlign:'right'}}>x{cc.w}</span>
                </div>
              )
            })}
          </div>
        )
      })}

      <div style={{display:'flex',gap:8,paddingTop:16,borderTop:'1px solid #ececec',marginTop:8}}>
        {!isNew && <button onClick={onDelete} style={{background:'none',border:'1px solid #ececec',color:'#bbb',padding:'9px 16px',borderRadius:8,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>Loeschen</button>}
        <button onClick={onBack} style={{background:'none',border:'1px solid #ddd',color:'#1a1a1a',padding:'9px 16px',borderRadius:8,fontSize:13,cursor:'pointer',fontFamily:'inherit',marginLeft:isNew?'auto':0}}>Abbrechen</button>
        <button onClick={handleSave} disabled={saving||uploading} style={{background:RED,color:'#fff',border:'none',padding:'9px 24px',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit',opacity:(saving||uploading)?0.7:1}}>
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
          setAthletes(data.map(a=>({
            reach_insta:'', reach_tiktok:'', reach_youtube:'',
            image_position:15, comments:'', presse_storys:[], para_locked:false, ...a
          })))
          setIsLive(true)
        } else setAthletes([])
      } catch { setAthletes([]) }
      setLoaded(true)
    }
    load()
  },[])

  const openAdd = () => { setEditData(blankAthlete(Date.now())); setView('edit') }
  const openEdit = (a: Athlete) => { setEditData({...a, scores:{...a.scores}}); setView('edit') }
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

  if (!loaded) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'#888',fontSize:14}}>Lade...</div>

  const grouped: Record<string, Athlete[]> = {hero:[],medal:[],para:[],inspiring:[],rising:[]}
  for (const a of athletes) {
    const cat = autoAssign(a, getComputed(a))
    if (grouped[cat]) grouped[cat].push(a)
  }
  for (const k of CAT_ORDER) {
    grouped[k].sort((a,b)=>catAvg(b.scores,k,getComputed(b))-catAvg(a.scores,k,getComputed(a)))
  }

  return (
    <div style={{minHeight:'100vh',background:'#fafafa',display:'flex',flexDirection:'column'}}>
      <header style={{display:'flex',alignItems:'center',gap:12,padding:'0 24px',height:70,borderBottom:`2.5px solid ${RED}`,background:'#fff',flexShrink:0}}>
        <CitroenLogo size={55}/>
        <div>
          <div style={{fontSize:10,color:RED,letterSpacing:'0.15em',textTransform:'uppercase',fontWeight:600}}>Citroen</div>
          <div style={{fontSize:17,fontWeight:600,lineHeight:1}}>Athlete Squad Matrix</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,marginLeft:16,padding:'3px 10px',borderRadius:20,background:isLive?'#f0fdf4':'#fef2f2',border:`1px solid ${isLive?'#86efac':'#fca5a5'}`}}>
          <div style={{width:7,height:7,borderRadius:'50%',background:isLive?'#22c55e':RED,boxShadow:isLive?'0 0 0 2px rgba(34,197,94,0.3)':'none'}}/>
          <span style={{fontSize:11,fontWeight:500,color:isLive?'#16a34a':RED}}>{isLive?'Live':'Offline'}</span>
        </div>
        {view==='grid' && (
          <button onClick={openAdd} style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6,background:RED,color:'#fff',border:'none',padding:'9px 18px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
            + Athlet hinzufuegen
          </button>
        )}
      </header>

      {view==='grid' ? (
        <>
          <div style={{padding:'20px 24px 16px',borderBottom:'1px solid #ececec',background:'#fff',flexShrink:0}}>
            <div style={{fontSize:11,color:'#bbb',textTransform:'uppercase',letterSpacing:'0.14em',marginBottom:4}}>Citroen - Road to LA28</div>
            <div style={{fontSize:26,fontWeight:700,color:'#1a1a1a',letterSpacing:'-0.02em'}}>Athlete Squad</div>
          </div>
          {athletes.length===0 ? (
            <div style={{textAlign:'center',padding:80,color:'#aaa',flex:1}}>
              <p style={{fontSize:14}}>Noch keine Athleten. Klick auf Athlet hinzufuegen.</p>
            </div>
          ) : (
            <div style={{display:'flex',flex:1,overflow:'hidden'}}>
              {CAT_ORDER.map((k,colIdx)=>{
                const c=CATS[k], list=grouped[k]
                return (
                  <div key={k} style={{flex:'1 1 0',minWidth:0,borderRight:colIdx<CAT_ORDER.length-1?'1px solid #ececec':'none',display:'flex',flexDirection:'column',overflow:'hidden',background:'#fafafa'}}>
                    <div style={{padding:'14px 14px 12px',borderBottom:`3px solid ${c.color}`,background:'#fff',flexShrink:0}}>
                      <div style={{fontSize:12,fontWeight:700,color:c.color,textTransform:'uppercase',letterSpacing:'0.08em',textAlign:'center'}}>{c.label}</div>
                      <div style={{fontSize:11,color:'#bbb',textAlign:'center',marginTop:3}}>{list.length} {list.length===1?'Athlet':'Athleten'}</div>
                    </div>
                    <div style={{flex:1,overflowY:'auto',padding:'12px 10px',display:'flex',flexDirection:'column',gap:12}}>
                      {list.map((a,idx)=>(
                        <div key={a.id} style={{position:'relative',flexShrink:0}}>
                          <div style={{position:'absolute',top:8,right:8,zIndex:2,width:22,height:22,borderRadius:'50%',background:c.color,color:'#fff',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 6px rgba(0,0,0,0.2)'}}>
                            {idx+1}
                          </div>
                          <AthleteCard athlete={a} onClick={()=>openEdit(a)}/>
                        </div>
                      ))}
                      {list.length===0 && (
                        <div style={{textAlign:'center',padding:'40px 16px',color:'#ccc',fontSize:12,border:'1px dashed #ddd',borderRadius:12,margin:'8px 0'}}>
                          Noch kein Athlet
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      ) : editData ? (
        <div style={{flex:1,overflowY:'auto'}}>
          <EditView data={editData} isNew={!athletes.find(a=>a.id===editData.id)} onSave={handleSave} onDelete={handleDelete} onBack={goBack}/>
        </div>
      ) : null}
    </div>
  )
}
