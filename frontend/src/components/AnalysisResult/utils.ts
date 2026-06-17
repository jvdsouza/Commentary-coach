import type { NoteCategory, NoteSeverity, ChunkAnalysisResult } from '@commentary-coach/shared'

export const SEVERITY_BORDER_COLORS: Record<NoteSeverity, string> = {
  high: '#f87171',
  medium: '#fbbf24',
  low: '#60a5fa',
  positive: '#4ade80',
}

export const SEVERITY_LABELS: Record<NoteSeverity, string> = {
  positive: 'Strength',
  low: 'Tip',
  medium: 'Focus',
  high: 'Priority',
}

export const SEVERITY_BADGE_CLASSES: Record<NoteSeverity, string> = {
  high: 'text-red-400 bg-red-400/10 border-red-400/30',
  medium: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  low: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  positive: 'text-green-400 bg-green-400/10 border-green-400/30',
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export const CATEGORY_ORDER: NoteCategory[] = [
  'strength',
  'hype',
  'storytelling',
  'clarity',
  'pacing',
  'dead_air',
  'caster_synergy',
  'teaching_opportunity',
  'jargon',
  'filler_repetition',
]

const SEVERITY_RANK: Record<NoteSeverity, number> = {
  high: 4,
  medium: 3,
  low: 2,
  positive: 1,
}

export function speakersInChunks(chunkResults: ChunkAnalysisResult[]): string[] {
  const seen = new Set<string>()
  for (const chunk of chunkResults) {
    for (const note of chunk.notes) {
      if (note.speaker) seen.add(note.speaker)
    }
  }
  return [...seen].sort()
}

export function filterChunksBySpeaker(
  chunkResults: ChunkAnalysisResult[],
  speaker: string
): ChunkAnalysisResult[] {
  return chunkResults
    .map((chunk) => ({ ...chunk, notes: chunk.notes.filter((n) => n.speaker === speaker) }))
    .filter((chunk) => chunk.notes.length > 0)
}

export function topBySeverity<T extends { severity: NoteSeverity }>(notes: T[]): T {
  return notes.reduce((best, note) =>
    SEVERITY_RANK[note.severity] > SEVERITY_RANK[best.severity] ? note : best
  )
}

export const CATEGORY_LABELS: Record<NoteCategory, string> = {
  strength: 'Strengths',
  hype: 'Hype',
  storytelling: 'Storytelling',
  clarity: 'Clarity',
  pacing: 'Pacing',
  dead_air: 'Dead Air',
  caster_synergy: 'Caster Synergy',
  teaching_opportunity: 'Teaching Opportunities',
  jargon: 'Jargon',
  filler_repetition: 'Filler & Repetition',
}
