import type { TranscriptChunk } from "./types";
import { buildSegmentsFromTranscript, buildChunksFromSegments } from "./segment-builder";
import { ASSEMBLYAI_API_KEY, getAuthorizationHeaders } from "./index";
import { transcribeAudio, getTranscript } from "./transcribe";

export async function analyzeCommentaryWithLLMGateway(
  audioInput?: Buffer | string,
  transcriptId?: string
): Promise<TranscriptChunk[]> {
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error("ASSEMBLYAI_API_KEY environment variable is not set");
  }

  const headers = getAuthorizationHeaders(true);
  let finalTranscriptId = transcriptId;

  if (!finalTranscriptId && audioInput) {
    console.log("[AssemblyAI] Starting transcription...");
    finalTranscriptId = await transcribeAudio(audioInput, headers);
  }

  if (!finalTranscriptId) {
    throw new Error("Either transcriptId or audioInput must be provided");
  }

  console.log(`[AssemblyAI] Retrieving transcript: ${finalTranscriptId}`);
  const transcript = await getTranscript(finalTranscriptId, headers);

  if (!transcript.text) {
    throw new Error("No transcript text available");
  }

  console.log("[AssemblyAI] Transcription complete");
  return buildChunksFromSegments(buildSegmentsFromTranscript(transcript));
}
