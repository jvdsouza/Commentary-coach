import type { TranscriptChunk } from "@/app/utils/AssemblyAI/types";
import { buildOpenAIConfig } from "./schema";
import { buildSynthesisConfig, type SynthesisInput } from "./synthesis-schema";
import { callResponsesAPI } from "../openai";
import type { ChunkAnalysisResult } from "./types";
import type { SynthesisResult } from "@commentary-coach/shared";

export type { ChunkAnalysisResult };

export async function analyzeChunk(chunk: TranscriptChunk): Promise<ChunkAnalysisResult> {
  return callResponsesAPI<ChunkAnalysisResult>(buildOpenAIConfig(chunk));
}

export async function synthesizeResults(chunkResults: ChunkAnalysisResult[]): Promise<SynthesisResult> {
  const input: SynthesisInput = {
    allChunkNotes: chunkResults.flatMap((r) => r.notes),
    allChunkSummaries: chunkResults.map((r) => r.chunkSummary),
  };
  return callResponsesAPI<SynthesisResult>(buildSynthesisConfig(input));
}
