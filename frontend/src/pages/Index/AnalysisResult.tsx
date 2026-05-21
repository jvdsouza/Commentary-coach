import React from 'react'
import { TranscriptChunk } from './types'

interface Props {
  result: TranscriptChunk[]
}

const AnalysisResult: React.FC<Props> = ({ result }) => {
  return (
    <section>
      <h2>Analysis Results</h2>
      {result.map((chunk, chunkIndex) => (
        <div key={chunkIndex}>
          <h3>
            {(chunk.startMs / 1000).toFixed(0)}s – {(chunk.endMs / 1000).toFixed(0)}s
          </h3>
          {chunk.segments.map((segment, segIndex) => (
            <div key={segIndex}>
              <p>
                {segment.speaker ? `[${segment.speaker}] ` : ''}
                {(segment.startMs / 1000).toFixed(1)}s – {(segment.endMs / 1000).toFixed(1)}s
                {segment.sentiment ? ` · ${segment.sentiment}` : ''}
              </p>
              <p>{segment.text}</p>
            </div>
          ))}
        </div>
      ))}
    </section>
  )
}

export default AnalysisResult
