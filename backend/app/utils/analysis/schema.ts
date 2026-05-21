import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import type { EasyInputMessage } from "openai/resources/responses/responses";
import type { TranscriptChunk } from "@/app/utils/AssemblyAI/types";

const noteSchema = z.object({
  startMs: z.number(),
  endMs: z.number(),
  category: z.enum([
    "strength",
    "clarity",
    "pacing",
    "dead_air",
    "hype",
    "jargon",
    "storytelling",
    "caster_synergy",
    "filler_repetition",
    "teaching_opportunity",
  ]),
  severity: z.enum(["positive", "low", "medium", "high"]),
  title: z.string(),
  observation: z.string(),
  evidence: z.string(),
  whyItMatters: z.string(),
  suggestion: z.string(),
  speaker: z.string().nullable().optional(),
});

const chunkSummarySchema = z.object({
  whatHappened: z.string(),
  overallCommentaryQuality: z.enum(["strong", "mixed", "needs_work"]),
  mainTakeaway: z.string(),
});

export const chunkAnalysisSchema = z.object({
  chunkStartMs: z.number(),
  chunkEndMs: z.number(),
  notes: z.array(noteSchema),
  chunkSummary: chunkSummarySchema,
});

export const CHUNK_ANALYSIS_FORMAT = zodTextFormat(
  chunkAnalysisSchema,
  "commentary_chunk_analysis"
);

const SYSTEM_MESSAGE: EasyInputMessage = {
  role: "system",
  content: `
You are an expert esports commentary coach.

Analyze commentary for:
- pacing
- clarity
- beginner accessibility
- hype timing
- storytelling
- filler/repetition
- caster synergy

Rules:
- Only use evidence from the transcript
- Return specific coaching feedback
- Include positive strengths
- Return timestamps exactly as provided
- Keep suggestions actionable
  `,
};

export const buildOpenAIConfig = (transcriptChunk: TranscriptChunk) => ({
  model: "gpt-5.3-instant",
  input: [
    SYSTEM_MESSAGE,
    { role: "user", content: JSON.stringify(transcriptChunk) } satisfies EasyInputMessage,
  ],
  text: { format: CHUNK_ANALYSIS_FORMAT },
});
