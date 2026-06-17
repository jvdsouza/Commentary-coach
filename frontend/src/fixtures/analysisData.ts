import type { AnalysisData } from '@commentary-coach/shared'

export const sampleAnalysisData: AnalysisData = {
  reviewId: 'sample-fixture-id',
  chunkResults: [
    {
      chunkStartMs: 0,
      chunkEndMs: 300000,
      chunkSummary: {
        whatHappened:
          'Opening segment covering the first round of the set. Both casters establish the matchup context and player backgrounds before the action kicks off.',
        overallCommentaryQuality: 'mixed',
        mainTakeaway:
          'Good setup energy but the two casters talked over each other during the first neutral exchange.',
      },
      notes: [
        {
          startMs: 12000,
          endMs: 22000,
          category: 'storytelling',
          severity: 'positive',
          title: 'Strong player introduction',
          observation:
            'Speaker A gave a concise, compelling background on the player matchup before round 1.',
          evidence: '"These two have met five times at majors — A has never won a single set."',
          whyItMatters:
            'Stakes framing at the start pulls viewers in and makes every round feel meaningful.',
          suggestion: 'Keep using historical context to set stakes at the top of a set.',
          speaker: 'A',
        },
        {
          startMs: 45000,
          endMs: 58000,
          category: 'caster_synergy',
          severity: 'medium',
          title: 'Simultaneous call collision',
          observation:
            'Both casters called the whiff punish at the same time, muddying the moment.',
          evidence: 'Overlapping audio at 0:45 during the Kazuya f,n,d,df+2 punish.',
          whyItMatters:
            'Double-calling a key moment halves its impact — viewers lose the clarity of the read.',
          suggestion:
            'Establish a lead/colour dynamic: one caster calls the action, the other adds context after.',
          speaker: undefined,
        },
        {
          startMs: 180000,
          endMs: 195000,
          category: 'hype',
          severity: 'positive',
          title: 'Excellent comeback anticipation',
          observation:
            'Speaker B built tension perfectly during the low-health comeback attempt.',
          evidence: '"He only needs one touch — and he knows EXACTLY what he is looking for!"',
          whyItMatters: 'Controlled hype at the right moment creates a peak viewing experience.',
          suggestion: 'Note the pacing here — silence before the exclamation amplified the impact.',
          speaker: 'B',
        },
        {
          startMs: 250000,
          endMs: 265000,
          category: 'jargon',
          severity: 'low',
          title: 'Unexplained frame data reference',
          observation:
            'Speaker A mentioned "+5 on block" without context for a new-viewer accessible broadcast.',
          evidence: '"That move is plus five on block so he can just press his fastest button."',
          whyItMatters:
            'Casual viewers tuning in for a major may not understand frame advantage without grounding.',
          suggestion:
            'Follow up technical terms with a one-sentence plain-English translation.',
          speaker: 'A',
        },
      ],
    },
    {
      chunkStartMs: 270000,
      chunkEndMs: 570000,
      chunkSummary: {
        whatHappened:
          'Second chunk covers rounds 2 and 3. The momentum shifted dramatically with a comeback in round 2 and a dominant round 3 close.',
        overallCommentaryQuality: 'strong',
        mainTakeaway:
          'Both casters were in sync during the clutch moments — the best segment of the session.',
      },
      notes: [
        {
          startMs: 310000,
          endMs: 325000,
          category: 'pacing',
          severity: 'low',
          title: 'Slow neutral commentary',
          observation:
            'Extended silence during a long neutral phase made the commentary feel absent.',
          evidence: '14-second gap between caster lines during a poking exchange.',
          whyItMatters:
            'Silence during deliberate neutral play is sometimes correct, but 14 seconds loses the thread.',
          suggestion:
            'Fill slow neutral with player tendencies, historical patterns, or what each player is fishing for.',
          speaker: 'B',
        },
        {
          startMs: 390000,
          endMs: 410000,
          category: 'clarity',
          severity: 'positive',
          title: 'Clean read explanation',
          observation: 'Speaker A clearly explained why the player chose a risky low crush.',
          evidence:
            '"He has been high-profiling all game — this was the adaptation and it landed."',
          whyItMatters:
            'Explaining the meta-level read rewards attentive viewers and educates newer ones.',
          suggestion: 'This is the gold standard for analysis commentary — replicate this pattern.',
          speaker: 'A',
        },
        {
          startMs: 510000,
          endMs: 530000,
          category: 'hype',
          severity: 'high',
          title: 'Missed hype peak at match point',
          observation:
            'Commentary volume and energy stayed flat during the final combo that ended the set.',
          evidence: 'Monotone delivery during a 10-hit wall splat combo into KO.',
          whyItMatters:
            'Match-ending moments are the biggest payoff for viewers — they expect energy to peak here.',
          suggestion:
            'Treat every potential KO hit as a crescendo moment. Build the sentence so the last word lands with the KO.',
          speaker: 'B',
        },
      ],
    },
  ],
  synthesis: {
    overallSummary:
      'A solid commentary session with clear individual strengths from both casters. Speaker A brings strong analytical depth while Speaker B excels at emotional highs. The main area holding the broadcast back is caster coordination — specifically the lack of a defined lead/colour dynamic which caused collisions and missed shared peaks.',
    topStrengths: [
      {
        title: 'Analytical storytelling',
        description:
          'Both casters consistently explained the "why" behind player decisions, not just the "what," giving viewers genuine insight into high-level Tekken.',
        evidence:
          'Seen in the player introduction, the low-crush read explanation, and the comeback anticipation build.',
      },
      {
        title: 'Momentum awareness',
        description:
          'The casters reliably identified momentum shifts and signalled them clearly to the audience, keeping viewers oriented during fast exchanges.',
        evidence: 'Comeback framing in chunk 1 and round 3 pacing in chunk 2.',
      },
    ],
    topImprovementAreas: [
      {
        title: 'Caster role definition',
        description:
          'Without a clear lead/colour split, both casters sometimes compete for the same call rather than complementing each other.',
        suggestion:
          'Agree before the session: one caster owns action calls, the other adds analysis. Swap roles between games if needed.',
      },
      {
        title: 'Accessibility bridging',
        description:
          'Technical terms appear without plain-English follow-ups, creating an engagement gap for casual viewers during a potentially high-reach broadcast.',
        suggestion:
          'After every frame data or system-mechanic reference, add a one-sentence translation aimed at a viewer who has watched but never played.',
      },
    ],
    nextSessionFocus: {
      title: 'Lead/Colour role discipline',
      rationale:
        'The biggest single gains will come from eliminating call collisions and creating space for each caster\'s strengths. Speaker A\'s analysis lands better when it has a clean "stage" after Speaker B\'s action call.',
      drills: [
        'Record a 10-minute session where Speaker A is designated lead (action calls only) and Speaker B is colour (analysis, history, emotion). Swap for the next 10 minutes.',
        'After each round, do a 30-second debrief in-cast: one caster sets up a question, the other answers. Practice the handoff.',
        'Watch back one game with the audio track and mark every moment where you both spoke simultaneously. Count and discuss.',
      ],
    },
    speakerFeedback: [
      {
        speaker: 'A',
        summary:
          'Speaker A anchored the broadcast with sharp technical analysis and strong narrative framing, consistently making individual moments feel meaningful. The main growth area is meeting newer viewers where they are — translating that expertise into language anyone can follow.',
        topStrengths: [
          {
            title: 'Deep system knowledge',
            description:
              'Comfortable referencing frame data, matchup history, and character-specific tech in real time.',
            evidence: 'Frame data call and the low-crush read explanation.',
          },
          {
            title: 'Stakes framing',
            description:
              'Excellent at establishing narrative context that makes individual moments feel significant.',
            evidence: 'The player history introduction at the top of the set.',
          },
        ],
        topImprovementAreas: [
          {
            title: 'Accessibility calibration',
            description:
              'Technical depth occasionally outpaces audience entry points, especially in mixed-skill broadcasts.',
            suggestion:
              'Add a "for those at home" sentence after any frame data or system reference.',
          },
        ],
        nextSessionFocus: {
          title: 'Accessibility bridging',
          rationale:
            'Your analysis is your strongest asset — making it land for every viewer in the room will multiply its impact.',
          drills: [
            'For every technical term you use in practice, immediately say it again in plain English.',
            'After the session, pick the three most technical things you said and rewrite them for a non-player.',
          ],
        },
      },
      {
        speaker: 'B',
        summary:
          "Speaker B's instinct for emotional pacing was the highlight of the session, landing the comeback moment with textbook tension and release. Energy tends to dip during slower neutral exchanges, and that's the clearest opportunity to keep the broadcast feeling consistently alive.",
        topStrengths: [
          {
            title: 'Emotional timing',
            description:
              'Exceptional instinct for when to build tension and when to release — the comeback segment was textbook.',
            evidence: 'The low-health comeback hype call in chunk 1.',
          },
        ],
        topImprovementAreas: [
          {
            title: 'Neutral phase engagement',
            description:
              'Energy drops noticeably during long neutral exchanges, creating dead air that makes the broadcast feel slow.',
            suggestion:
              'Prepare a mental library of "neutral filler" — player tendencies, what each character wants, historical patterns.',
          },
          {
            title: 'Climax delivery',
            description:
              'Match-ending moments need a vocal peak that matches their significance.',
            suggestion:
              'Practice the last five seconds of a combo finish: build the sentence so the final word lands with the KO.',
          },
        ],
        nextSessionFocus: {
          title: 'Neutral phase commentary',
          rationale:
            'Filling slow moments with quality content will eliminate the perceived pacing gaps and keep viewer engagement consistent throughout the set.',
          drills: [
            'Watch VODs of long neutral exchanges and write commentary out loud in real time — no pauses allowed.',
            'Build a "cheat sheet" of 10 neutral-phase talking points for the character matchups you most commonly cast.',
          ],
        },
      },
    ],
  },
}
