import type { TranscriptChunk, TranscriptSegment, TranscriptResponse } from "./types";

const CHUNK_DURATION_MS = 5 * 60 * 1000;
const CHUNK_STEP_MS = CHUNK_DURATION_MS - 30 * 1000;

export function buildSegmentsFromTranscript(transcript: TranscriptResponse): TranscriptSegment[] {
  if (!transcript.utterances || transcript.utterances.length === 0) {
    return transcript.text ? [{ startMs: 0, endMs: 0, text: transcript.text }] : [];
  }

  return transcript.utterances.map((utterance) => ({
    startMs: utterance.start * 1000,
    endMs: utterance.end * 1000,
    speaker: utterance.speaker,
    text: utterance.text,
    sentiment: dominantSentiment(transcript.sentiment_analysis_results, utterance.start, utterance.end),
  }));
}

export function buildChunksFromSegments(segments: TranscriptSegment[]): TranscriptChunk[] {
  if (segments.length === 0) return [];

  const lastStart = Math.max(...segments.map((s) => s.startMs));
  const chunks: TranscriptChunk[] = [];
  let chunkStart = 0;

  while (chunkStart <= lastStart) {
    const chunkEnd = chunkStart + CHUNK_DURATION_MS;
    const chunkSegments = segments.filter(
      (s) => s.startMs >= chunkStart && s.startMs < chunkEnd
    );
    if (chunkSegments.length > 0) {
      chunks.push({ startMs: chunkStart, endMs: chunkEnd, segments: chunkSegments });
    }
    chunkStart += CHUNK_STEP_MS;
  }

  return chunks;
}

function dominantSentiment(
  results: TranscriptResponse["sentiment_analysis_results"],
  start: number,
  end: number
): TranscriptSegment["sentiment"] | undefined {
  if (!results || results.length === 0) return undefined;

  const counts = { positive: 0, neutral: 0, negative: 0 };
  for (const r of results) {
    if (r.start < end && r.end > start) {
      counts[r.sentiment.toLowerCase() as keyof typeof counts]++;
    }
  }

  const total = counts.positive + counts.neutral + counts.negative;
  if (total === 0) return undefined;

  return (Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0]) as TranscriptSegment["sentiment"];
}
