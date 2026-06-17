import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { MODELS } from "./config";
import type { EasyInputMessage } from "openai/resources/responses/responses";
import type { Note, ChunkSummary } from "./types";

export type SynthesisInput = {
  allChunkNotes: Note[];
  allChunkSummaries: ChunkSummary[];
};

const topStrengthSchema = z.object({
  title: z.string(),
  description: z.string(),
  evidence: z.string(),
});

const topImprovementAreaSchema = z.object({
  title: z.string(),
  description: z.string(),
  suggestion: z.string(),
});

const nextSessionFocusSchema = z.object({
  title: z.string(),
  rationale: z.string(),
  drills: z.array(z.string()),
});

const speakerFeedbackSchema = z.object({
  speaker: z.string(),
  summary: z.string(),
  topStrengths: z.array(topStrengthSchema),
  topImprovementAreas: z.array(topImprovementAreaSchema),
  nextSessionFocus: nextSessionFocusSchema,
});

export const synthesisResultSchema = z.object({
  topStrengths: z.array(topStrengthSchema),
  topImprovementAreas: z.array(topImprovementAreaSchema),
  nextSessionFocus: nextSessionFocusSchema,
  overallSummary: z.string(),
  speakerFeedback: z.array(speakerFeedbackSchema),
});

export const SYNTHESIS_FORMAT = zodTextFormat(
  synthesisResultSchema,
  "commentary_synthesis"
);

const SYSTEM_MESSAGE: EasyInputMessage = {
  role: "system",
  content: `
You are an expert esports commentary coach reviewing a full session of commentary.

You will receive all coaching notes and chunk summaries from the session. Each note may have a "speaker" label (e.g. "A", "B") identifying which commentator made that call.

Your job is to synthesise this into a high-level session review with two layers:

OVERALL (across all commentators):
- Identify the 2-4 most consistent strengths across the session
- Identify the 2-4 most impactful areas for improvement
- Recommend a single focus area for the next session with concrete drills
- Write a concise overall summary of the session (2-4 sentences)

PER-SPEAKER (one entry per distinct speaker label found in the notes):
- Write a short narrative summary of how that speaker performed across the session (2-3 sentences)
- For each speaker, identify their 1-3 personal strengths
- Identify their 1-3 personal improvement areas
- Recommend one focused next-session drill for that speaker
- Only include speakers who have at least one attributed note

Rules:
- Draw conclusions across the whole session, not just individual moments
- Prioritise patterns that appear in multiple chunks over one-off events
- Keep drills specific and immediately actionable
- If no notes have speaker labels, return an empty speakerFeedback array
  `,
};

export const buildSynthesisConfig = (input: SynthesisInput) => ({
  model: MODELS.synthesis,
  input: [
    SYSTEM_MESSAGE,
    { role: "user", content: JSON.stringify(input) } satisfies EasyInputMessage,
  ],
  text: { format: SYNTHESIS_FORMAT },
});
