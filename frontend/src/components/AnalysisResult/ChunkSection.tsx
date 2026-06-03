import React from 'react'
import type { ChunkAnalysisResult } from '@commentary-coach/shared'

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const qualityLabel: Record<ChunkAnalysisResult['chunkSummary']['overallCommentaryQuality'], string> = {
  strong: '✓ Strong',
  mixed: '~ Mixed',
  needs_work: '✗ Needs work',
}

interface Props {
  chunkResult: ChunkAnalysisResult
  index: number
}

const ChunkSection: React.FC<Props> = ({ chunkResult, index }) => {
  const { chunkSummary, notes, chunkStartMs, chunkEndMs } = chunkResult
  return (
    <div>
      <h3>
        Chunk {index + 1} &nbsp;
        <small>{formatTime(chunkStartMs)} – {formatTime(chunkEndMs)}</small>
        &nbsp;·&nbsp;{qualityLabel[chunkSummary.overallCommentaryQuality]}
      </h3>
      <p>{chunkSummary.whatHappened}</p>
      <p><strong>Takeaway:</strong> {chunkSummary.mainTakeaway}</p>
      {notes.length > 0 && (
        <ul>
          {notes.map((note, i) => (
            <li key={i}>
              {note.speaker && <strong>[{note.speaker}]</strong>}{' '}
              <strong>[{note.severity}] {note.title}</strong> — {note.observation}
              {note.suggestion && <span> · {note.suggestion}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ChunkSection
