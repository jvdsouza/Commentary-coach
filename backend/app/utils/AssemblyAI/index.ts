import type { TranscriptChunk, TranscriptSegment, TranscriptResponse, LLMGatewayResponse } from "./types";
import { analyzeCommentaryWithSTT } from "./stt";
import { analyzeCommentaryWithLLMGateway } from "./llm-gateway";
import { getTranscript } from "./transcribe";

export type { TranscriptChunk, TranscriptSegment, TranscriptResponse, LLMGatewayResponse };
export { buildSegmentsFromTranscript, buildChunksFromSegments } from "./segment-builder";

export const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
export const ASSEMBLYAI_BASE_URL = "https://api.assemblyai.com";
export const LLM_GATEWAY_URL =
  process.env.ASSEMBLYAI_LLM_GATEWAY_URL ||
  "https://llm-gateway.assemblyai.com/v1/chat/completions";

export function getAuthorizationHeaders(includeJsonContent = true): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: ASSEMBLYAI_API_KEY || "",
  };

  if (includeJsonContent) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

export const analysisStrategies = {
  STT: analyzeCommentaryWithSTT,
  "llm-gateway": analyzeCommentaryWithLLMGateway,
};

export async function analyzeCommentary(options: {
  strategy?: keyof typeof analysisStrategies;
  audioInput?: Buffer | string;
  transcriptId?: string;
}): Promise<TranscriptChunk[]> {
  const { strategy = "STT", audioInput, transcriptId } = options;
  const analyzer = analysisStrategies[strategy];
  return analyzer(audioInput, transcriptId);
}

export async function getTranscriptStatus(transcriptId: string): Promise<TranscriptResponse> {
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error("ASSEMBLYAI_API_KEY environment variable is not set");
  }

  const headers = getAuthorizationHeaders(false);

  return getTranscript(transcriptId, headers);
}
