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
  { key: 'para_medals',  label: 'Medaillen-Potenzial (Para)', cat: 'para',   w: 2.0, hint: 'Real
