import React from 'react'
import type { AnalysisData } from '@commentary-coach/shared'
import SynthesisSection from './SynthesisSection'
import ChunkSection from './ChunkSection'

interface Props {
  result: AnalysisData
}

const AnalysisResult: React.FC<Props> = ({ result }) => (
  <section>
    <SynthesisSection synthesis={result.synthesis} />
    <hr />
    <h2>Chunk Breakdown</h2>
    {result.chunkResults.map((chunk, i) => (
      <ChunkSection key={i} chunkResult={chunk} index={i} />
    ))}
  </section>
)

export default AnalysisResult
