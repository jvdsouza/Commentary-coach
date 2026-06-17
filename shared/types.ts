export type TranscriptSegment = {
  startMs: number;
  endMs: number;
  speaker?: string;
  text: string;
  sentiment?: "positive" | "neutral" | "negative";
};

export type TranscriptChunk = {
  startMs: number;
  endMs: number;
  segments: TranscriptSegment[];
};

export type NoteCategory =
  | "strength"
  | "clarity"
  | "pacing"
  | "dead_air"
  | "hype"
  | "jargon"
  | "storytelling"
  | "caster_synergy"
  | "filler_repetition"
  | "teaching_opportunity";


export type NoteSeverity = "positive" | "low" | "medium" | "high";

export type Note = {
  startMs: number;
  endMs: number;
  category: NoteCategory;
  severity: NoteSeverity;
  title: string;
  observation: string;
  evidence: string;
  whyItMatters: string;
  suggestion: string;
  speaker?: string;
};

export type ChunkSummary = {
  whatHappened: string;
  overallCommentaryQuality: "strong" | "mixed" | "needs_work";
  mainTakeaway: string;
};

export type ChunkAnalysisResult = {
  chunkStartMs: number;
  chunkEndMs: number;
  notes: Note[];
  chunkSummary: ChunkSummary;
};

export type TopStrength = {
  title: string;
  description: string;
  evidence: string;
};

export type TopImprovementArea = {
  title: string;
  description: string;
  suggestion: string;
};

export type NextSessionFocus = {
  title: string;
  rationale: string;
  drills: string[];
};

export type SpeakerFeedback = {
  speaker: string;
  summary: string;
  topStrengths: TopStrength[];
  topImprovementAreas: TopImprovementArea[];
  nextSessionFocus: NextSessionFocus;
};

export type SynthesisResult = {
  topStrengths: TopStrength[];
  topImprovementAreas: TopImprovementArea[];
  nextSessionFocus: NextSessionFocus;
  overallSummary: string;
  speakerFeedback: SpeakerFeedback[];
};

export type ExtractAudioResponse = {
  reviewId: string;
  chunks: TranscriptChunk[];
};

export type AnalysisData = {
  reviewId: string;
  chunkResults: ChunkAnalysisResult[];
  synthesis: SynthesisResult;
};
