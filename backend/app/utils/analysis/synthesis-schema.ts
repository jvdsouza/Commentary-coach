import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
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

export const synthesisResultSchema = z.object({
  topStrengths: z.array(topStrengthSchema),
  topImprovementAreas: z.array(topImprovementAreaSchema),
  nextSessionFocus: nextSessionFocusSchema,
  overallSummary: z.string(),
});

export const SYNTHESIS_FORMAT = zodTextFormat(
  synthesisResultSchema,
  "commentary_synthesis"
);

const SYSTEM_MESSAGE: EasyInputMessage = {
  role: "system",
  content: `
You are an expert esports commentary coach reviewing a full session of commentary.

You will receive all coaching notes and chunk summaries from the session.

Your job is to synthesise this into a high-level session review:
- Identify the 2-4 most consistent strengths across the session
- Identify the 2-4 most impactful areas for improvement
- Recommend a single focus area for the next session with concrete drills
- Write a concise overall summary of the session

Rules:
- Draw conclusions across the whole session, not just individual moments
- Prioritise patterns that appear in multiple chunks over one-off events
- Keep drills specific and immediately actionable
- The overall summary should be 2-4 sentences
  `,
};

export const buildSynthesisConfig = (input: SynthesisInput) => ({
  model: "gpt-5.3-instant",
  input: [
    SYSTEM_MESSAGE,
    { role: "user", content: JSON.stringify(input) } satisfies EasyInputMessage,
  ],
  text: { format: SYNTHESIS_FORMAT },
});
