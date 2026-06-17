import React from 'react'
import type { ChunkAnalysisResult, Note } from '@commentary-coach/shared'
import { formatTime, CATEGORY_LABELS, SEVERITY_BORDER_COLORS, SEVERITY_LABELS, SEVERITY_BADGE_CLASSES } from './utils'

const QUALITY_CLASSES: Record<ChunkAnalysisResult['chunkSummary']['overallCommentaryQuality'], string> = {
  strong: 'text-green-400',
  mixed: 'text-amber-400',
  needs_work: 'text-red-400',
}

const QUALITY_LABELS: Record<ChunkAnalysisResult['chunkSummary']['overallCommentaryQuality'], string> = {
  strong: 'Strong',
  mixed: 'Mixed',
  needs_work: 'Needs work',
}

function NoteCard({ note }: { note: Note }) {
  return (
    <div
      className="bg-card rounded-lg border border-white/10 p-4 mb-3 last:mb-0"
      style={{ borderLeftWidth: '4px', borderLeftColor: SEVERITY_BORDER_COLORS[note.severity] }}
    >
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-faint">
          {CATEGORY_LABELS[note.category]}
        </span>
        <span className={`text-xs rounded-full px-2 py-0.5 font-medium border ${SEVERITY_BADGE_CLASSES[note.severity]}`}>
          {SEVERITY_LABELS[note.severity]}
        </span>
        {note.speaker && (
          <span className="text-xs bg-white/10 rounded-full px-2 py-0.5 text-muted">
            {note.speaker}
          </span>
        )}
        <span className="ml-auto font-mono text-xs text-faint tabular-nums">
          {formatTime(note.startMs)}–{formatTime(note.endMs)}
        </span>
      </div>
      <p className="font-semibold text-white text-sm mb-2">{note.title}</p>
      <p className="text-sm text-muted leading-relaxed">{note.observation}</p>
      {note.suggestion && (
        <p className="text-sm text-muted mt-3 pt-3 border-t border-white/10 leading-relaxed">
          <span className="text-white font-medium">Suggestion: </span>
          {note.suggestion}
        </p>
      )}
    </div>
  )
}

interface Props {
  chunkResult: ChunkAnalysisResult
  index: number
}

const ChunkSection: React.FC<Props> = ({ chunkResult, index }) => {
  const { chunkSummary, notes, chunkStartMs, chunkEndMs } = chunkResult
  return (
    <div className="mb-8 pb-8 border-b border-white/10 last:mb-0 last:pb-0 last:border-b-0">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <span className="font-mono text-xs bg-white/10 rounded px-2 py-1 text-muted tabular-nums">
          {formatTime(chunkStartMs)}–{formatTime(chunkEndMs)}
        </span>
        <span className={`text-sm font-medium ${QUALITY_CLASSES[chunkSummary.overallCommentaryQuality]}`}>
          {QUALITY_LABELS[chunkSummary.overallCommentaryQuality]}
        </span>
      </div>
      <p className="text-sm text-muted leading-relaxed mb-1">{chunkSummary.whatHappened}</p>
      <p className="text-sm mb-5">
        <span className="text-white font-medium">Takeaway: </span>
        <span className="text-muted">{chunkSummary.mainTakeaway}</span>
      </p>
      {notes.length > 0 ? (
        <div>
          {notes.map((note, i) => (
            <NoteCard key={i} note={note} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-faint italic">No notes for this segment.</p>
      )}
    </div>
  )
}

export default ChunkSection
