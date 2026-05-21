import { describe, it, expect } from "vitest";
import { buildSegmentsFromTranscript, buildChunksFromSegments } from "./segment-builder";
import type { TranscriptResponse, TranscriptSegment } from "./types";

const FIVE_MIN_MS = 5 * 60 * 1000;
const OVERLAP_MS = 30 * 1000;
const STEP_MS = FIVE_MIN_MS - OVERLAP_MS;

// ─── buildSegmentsFromTranscript ───────────────────────────────────────────

describe("buildSegmentsFromTranscript", () => {
  it("returns empty array when transcript has no text and no utterances", () => {
    const transcript: TranscriptResponse = { id: "1", status: "completed" };
    expect(buildSegmentsFromTranscript(transcript)).toEqual([]);
  });

  it("returns a single segment from full text when there are no utterances", () => {
    const transcript: TranscriptResponse = {
      id: "1",
      status: "completed",
      text: "Hello world",
    };
    expect(buildSegmentsFromTranscript(transcript)).toEqual([
      { startMs: 0, endMs: 0, text: "Hello world" },
    ]);
  });

  it("maps utterances to segments and converts seconds to milliseconds", () => {
    const transcript: TranscriptResponse = {
      id: "1",
      status: "completed",
      text: "Hello world",
      utterances: [
        { start: 1, end: 5, speaker: "A", text: "Hello" },
        { start: 6, end: 10, speaker: "B", text: "World" },
      ],
    };
    const segments = buildSegmentsFromTranscript(transcript);
    expect(segments[0].startMs).toBe(1000);
    expect(segments[0].endMs).toBe(5000);
    expect(segments[1].startMs).toBe(6000);
    expect(segments[1].endMs).toBe(10000);
  });

  it("sets speaker from utterance", () => {
    const transcript: TranscriptResponse = {
      id: "1",
      status: "completed",
      text: "Hi",
      utterances: [{ start: 0, end: 2, speaker: "Speaker A", text: "Hi" }],
    };
    const [segment] = buildSegmentsFromTranscript(transcript);
    expect(segment.speaker).toBe("Speaker A");
  });

  it("assigns sentiment from the dominant sentiment_analysis_results in the utterance window", () => {
    const transcript: TranscriptResponse = {
      id: "1",
      status: "completed",
      text: "Great game",
      utterances: [{ start: 0, end: 10, speaker: "A", text: "Great game" }],
      sentiment_analysis_results: [
        { text: "Great", start: 0, end: 3, sentiment: "POSITIVE", confidence: 0.9, speaker: "A" },
        { text: "game", start: 4, end: 10, sentiment: "POSITIVE", confidence: 0.8, speaker: "A" },
        { text: "ok", start: 5, end: 9, sentiment: "NEUTRAL", confidence: 0.7, speaker: "A" },
      ],
    };
    const [segment] = buildSegmentsFromTranscript(transcript);
    expect(segment.sentiment).toBe("positive");
  });

  it("assigns negative sentiment when it is dominant", () => {
    const transcript: TranscriptResponse = {
      id: "1",
      status: "completed",
      text: "Bad move",
      utterances: [{ start: 0, end: 5, speaker: "A", text: "Bad move" }],
      sentiment_analysis_results: [
        { text: "Bad", start: 0, end: 2, sentiment: "NEGATIVE", confidence: 0.9, speaker: "A" },
        { text: "move", start: 2, end: 5, sentiment: "NEGATIVE", confidence: 0.8, speaker: "A" },
        { text: "ok", start: 3, end: 4, sentiment: "POSITIVE", confidence: 0.5, speaker: "A" },
      ],
    };
    const [segment] = buildSegmentsFromTranscript(transcript);
    expect(segment.sentiment).toBe("negative");
  });

  it("leaves sentiment undefined when no sentiment results overlap the utterance", () => {
    const transcript: TranscriptResponse = {
      id: "1",
      status: "completed",
      text: "Hello",
      utterances: [{ start: 0, end: 5, speaker: "A", text: "Hello" }],
      sentiment_analysis_results: [
        { text: "Later", start: 100, end: 200, sentiment: "POSITIVE", confidence: 0.9, speaker: "A" },
      ],
    };
    const [segment] = buildSegmentsFromTranscript(transcript);
    expect(segment.sentiment).toBeUndefined();
  });

  it("leaves sentiment undefined when sentiment_analysis_results is absent", () => {
    const transcript: TranscriptResponse = {
      id: "1",
      status: "completed",
      text: "Hello",
      utterances: [{ start: 0, end: 5, speaker: "A", text: "Hello" }],
    };
    const [segment] = buildSegmentsFromTranscript(transcript);
    expect(segment.sentiment).toBeUndefined();
  });
});

// ─── buildChunksFromSegments ───────────────────────────────────────────────

describe("buildChunksFromSegments", () => {
  it("returns empty array for empty input", () => {
    expect(buildChunksFromSegments([])).toEqual([]);
  });

  it("places a single segment in a single chunk", () => {
    const segments: TranscriptSegment[] = [
      { startMs: 0, endMs: 5000, text: "Hello" },
    ];
    const chunks = buildChunksFromSegments(segments);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].startMs).toBe(0);
    expect(chunks[0].endMs).toBe(FIVE_MIN_MS);
    expect(chunks[0].segments).toHaveLength(1);
  });

  it("puts segments that start after 5 minutes into the next chunk", () => {
    const segments: TranscriptSegment[] = [
      { startMs: 0, endMs: 5000, text: "Early" },
      { startMs: FIVE_MIN_MS + 1000, endMs: FIVE_MIN_MS + 5000, text: "Late" },
    ];
    const chunks = buildChunksFromSegments(segments);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks[0].segments.map((s) => s.text)).toContain("Early");
    const lateChunk = chunks.find((c) => c.segments.some((s) => s.text === "Late"));
    expect(lateChunk).toBeDefined();
    expect(lateChunk?.startMs).toBe(STEP_MS);
  });

  it("duplicates segments in the 30-second overlap zone into both chunks", () => {
    const overlapStart = FIVE_MIN_MS - OVERLAP_MS + 1000;
    const segments: TranscriptSegment[] = [
      { startMs: 0, endMs: 1000, text: "First" },
      { startMs: overlapStart, endMs: overlapStart + 2000, text: "Overlap" },
      { startMs: FIVE_MIN_MS + 1000, endMs: FIVE_MIN_MS + 5000, text: "Second chunk only" },
    ];
    const chunks = buildChunksFromSegments(segments);

    const chunk1Texts = chunks[0].segments.map((s) => s.text);
    const chunk2Texts = chunks[1].segments.map((s) => s.text);

    expect(chunk1Texts).toContain("Overlap");
    expect(chunk2Texts).toContain("Overlap");
  });

  it("skips chunks that contain no segments", () => {
    // All segments well past the first chunk — chunk at 0 would be empty
    const segments: TranscriptSegment[] = [
      { startMs: FIVE_MIN_MS * 3, endMs: FIVE_MIN_MS * 3 + 1000, text: "Far" },
    ];
    const chunks = buildChunksFromSegments(segments);
    for (const chunk of chunks) {
      expect(chunk.segments.length).toBeGreaterThan(0);
    }
  });

  it("sets correct startMs and endMs on each chunk", () => {
    const segments: TranscriptSegment[] = [
      { startMs: 0, endMs: 1000, text: "A" },
      { startMs: STEP_MS + 1000, endMs: STEP_MS + 5000, text: "B" },
    ];
    const chunks = buildChunksFromSegments(segments);
    expect(chunks[0].startMs).toBe(0);
    expect(chunks[0].endMs).toBe(FIVE_MIN_MS);
    expect(chunks[1].startMs).toBe(STEP_MS);
    expect(chunks[1].endMs).toBe(STEP_MS + FIVE_MIN_MS);
  });
});
