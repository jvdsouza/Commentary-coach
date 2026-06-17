import React from 'react'
import type { ChunkAnalysisResult, Note } from '@commentary-coach/shared'
import {
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  SEVERITY_BORDER_COLORS,
  SEVERITY_LABELS,
  SEVERITY_BADGE_CLASSES,
  topBySeverity,
} from './utils'

interface Props {
  chunkResults: ChunkAnalysisResult[]
}

const SkillsView: React.FC<Props> = ({ chunkResults }) => {
  const allNotes: Note[] = chunkResults.flatMap((chunk) => chunk.notes)

  const notesByCategory = new Map<string, Note[]>()
  for (const note of allNotes) {
    const bucket = notesByCategory.get(note.category) ?? []
    bucket.push(note)
    notesByCategory.set(note.category, bucket)
  }

  const visibleCategories = CATEGORY_ORDER.filter((cat) => notesByCategory.has(cat))

  if (visibleCategories.length === 0) {
    return <p className="text-sm text-faint italic">No notes found.</p>
  }

  return (
    <div className="space-y-3">
      {visibleCategories.map((category) => {
        const notes = notesByCategory.get(category)!
        const top = topBySeverity(notes)

        return (
          <div
            key={category}
            className="bg-card rounded-lg border border-white/10 p-4"
            style={{ borderLeftWidth: '4px', borderLeftColor: SEVERITY_BORDER_COLORS[top.severity] }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  {CATEGORY_LABELS[category]}
                </h3>
                <span className={`text-xs rounded-full px-2 py-0.5 font-medium border ${SEVERITY_BADGE_CLASSES[top.severity]}`}>
                  {SEVERITY_LABELS[top.severity]}
                </span>
              </div>
              <span className="text-xs text-faint">
                {notes.length} {notes.length === 1 ? 'note' : 'notes'}
              </span>
            </div>
            <p className="font-semibold text-white text-sm mb-2">{top.title}</p>
            <p className="text-sm text-muted leading-relaxed">{top.observation}</p>
            {top.suggestion && (
              <p className="text-sm text-muted mt-3 pt-3 border-t border-white/10 leading-relaxed">
                <span className="text-white font-medium">Suggestion: </span>
                {top.suggestion}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default SkillsView
