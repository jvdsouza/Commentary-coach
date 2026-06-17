import React from 'react'
import type { AnalysisData } from '@commentary-coach/shared'
import ChunkSection from './ChunkSection'
import SkillsView from './SkillsView'
import Tabs from '../Tabs'
import { speakersInChunks, filterChunksBySpeaker } from './utils'
import type { Tab } from '../Tabs'

interface Props {
  result: AnalysisData
}

function quoteSpeakers(text: string, speakers: string[]): string {
  let result = text
  for (const label of speakers) {
    const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(new RegExp(`(?<!")(\\b${esc}\\b)(?!")`, 'g'), `"${label}"`)
  }
  return result
}

function breakdownTabs(chunkResults: AnalysisData['chunkResults']): Tab[] {
  return [
    {
      label: 'Chronological',
      content: chunkResults.map((chunk, i) => (
        <ChunkSection key={i} chunkResult={chunk} index={i} />
      )),
    },
    {
      label: 'By skill',
      content: <SkillsView chunkResults={chunkResults} />,
    },
  ]
}

function SpeakerPanel({
  summary,
  chunkResults,
}: {
  summary?: string
  chunkResults: AnalysisData['chunkResults']
}) {
  return (
    <div>
      {summary && <p className="text-sm text-muted leading-relaxed mb-6 max-w-[68ch]">{summary}</p>}
      <Tabs tabs={breakdownTabs(chunkResults)} variant="secondary" />
    </div>
  )
}

const AnalysisResult: React.FC<Props> = ({ result }) => {
  const { synthesis, chunkResults } = result
  const speakers = speakersInChunks(chunkResults)
  const allSpeakerLabels = synthesis.speakerFeedback.map((sf) => sf.speaker)

  const topStrength = synthesis.topStrengths[0]
  const focus = synthesis.nextSessionFocus

  const outerTabs: Tab[] = [
    ...speakers.map((speaker) => ({
      label: `Speaker ${speaker}`,
      content: (
        <SpeakerPanel
          summary={quoteSpeakers(
            synthesis.speakerFeedback.find((sf) => sf.speaker === speaker)?.summary ?? '',
            allSpeakerLabels
          )}
          chunkResults={filterChunksBySpeaker(chunkResults, speaker)}
        />
      ),
    })),
    {
      label: 'Overall',
      content: (
        <SpeakerPanel
          summary={quoteSpeakers(synthesis.overallSummary, allSpeakerLabels)}
          chunkResults={chunkResults}
        />
      ),
    },
  ]

  return (
    <section className="w-full">
      <h2 className="text-2xl font-bold text-white mb-6">Review Summary</h2>

      {(focus || topStrength) && (
        <div className="grid grid-cols-2 gap-3 mb-8">
          {focus && (
            <div className="bg-surface rounded-lg border border-white/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-faint mb-1.5">
                Session Focus
              </p>
              <p className="text-white font-medium leading-snug text-sm">{focus.title}</p>
            </div>
          )}
          {topStrength && (
            <div className="bg-surface rounded-lg border border-white/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-faint mb-1.5">
                Top Strength
              </p>
              <p className="text-white font-medium leading-snug text-sm">{topStrength.title}</p>
            </div>
          )}
        </div>
      )}

      <Tabs tabs={outerTabs} />
    </section>
  )
}

export default AnalysisResult
