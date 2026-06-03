import React from 'react'
import type { SynthesisResult, SpeakerFeedback } from '@commentary-coach/shared'

function StrengthsList({ strengths }: { strengths: SynthesisResult['topStrengths'] }) {
  if (strengths.length === 0) return null
  return (
    <>
      <h3>Top Strengths</h3>
      <ul>
        {strengths.map((s, i) => (
          <li key={i}>
            <strong>{s.title}</strong> — {s.description}
            {s.evidence && <span> · <em>{s.evidence}</em></span>}
          </li>
        ))}
      </ul>
    </>
  )
}

function ImprovementsList({ areas }: { areas: SynthesisResult['topImprovementAreas'] }) {
  if (areas.length === 0) return null
  return (
    <>
      <h3>Top Improvement Areas</h3>
      <ul>
        {areas.map((a, i) => (
          <li key={i}>
            <strong>{a.title}</strong> — {a.description}
            {a.suggestion && <span> · {a.suggestion}</span>}
          </li>
        ))}
      </ul>
    </>
  )
}

function NextFocus({ focus }: { focus: SynthesisResult['nextSessionFocus'] }) {
  return (
    <>
      <h3>Next Session Focus: {focus.title}</h3>
      <p>{focus.rationale}</p>
      {focus.drills.length > 0 && (
        <ul>
          {focus.drills.map((drill, i) => (
            <li key={i}>{drill}</li>
          ))}
        </ul>
      )}
    </>
  )
}

function SpeakerCard({ feedback }: { feedback: SpeakerFeedback }) {
  return (
    <section>
      <h3>Speaker {feedback.speaker}</h3>
      <StrengthsList strengths={feedback.topStrengths} />
      <ImprovementsList areas={feedback.topImprovementAreas} />
      <NextFocus focus={feedback.nextSessionFocus} />
    </section>
  )
}

interface Props {
  synthesis: SynthesisResult
}

const SynthesisSection: React.FC<Props> = ({ synthesis }) => (
  <>
    <section>
      <h2>Overall Session Summary</h2>
      <p>{synthesis.overallSummary}</p>
      <StrengthsList strengths={synthesis.topStrengths} />
      <ImprovementsList areas={synthesis.topImprovementAreas} />
      <NextFocus focus={synthesis.nextSessionFocus} />
    </section>

    {synthesis.speakerFeedback.length > 0 && (
      <section>
        <h2>Per-Commentator Feedback</h2>
        {synthesis.speakerFeedback.map((sf, i) => (
          <SpeakerCard key={i} feedback={sf} />
        ))}
      </section>
    )}
  </>
)

export default SynthesisSection
