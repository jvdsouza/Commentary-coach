import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../openai", () => ({
  callResponsesAPI: vi.fn(),
}));

import { analyzeChunk, synthesizeResults } from "./index";
import { callResponsesAPI } from "../openai";
import type { TranscriptChunk } from "../AssemblyAI/types";
import type { ChunkAnalysisResult } from "./types";
import type { SynthesisResult } from "@commentary-coach/shared";

const mockCall = vi.mocked(callResponsesAPI);

const chunk: TranscriptChunk = {
  startMs: 0,
  endMs: 300_000,
  segments: [{ startMs: 0, endMs: 5000, text: "Hello" }],
};

const makeNote = (overrides?: Partial<ChunkAnalysisResult["notes"][0]>) => ({
  startMs: 0,
  endMs: 5000,
  category: "pacing" as const,
  severity: "medium" as const,
  title: "Test",
  observation: "Obs",
  evidence: "Ev",
  whyItMatters: "Matters",
  suggestion: "Suggest",
  ...overrides,
});

const makeChunkResult = (overrides?: Partial<ChunkAnalysisResult>): ChunkAnalysisResult => ({
  chunkStartMs: 0,
  chunkEndMs: 300_000,
  notes: [],
  chunkSummary: {
    whatHappened: "Some gameplay",
    overallCommentaryQuality: "mixed",
    mainTakeaway: "Decent",
  },
  ...overrides,
});

const stubSynthesis: SynthesisResult = {
  topStrengths: [],
  topImprovementAreas: [],
  nextSessionFocus: { title: "Focus", rationale: "Because", drills: [] },
  overallSummary: "Good session",
  speakerFeedback: [],
};

beforeEach(() => vi.clearAllMocks());

describe("analyzeChunk", () => {
  it("calls callResponsesAPI once and returns its result", async () => {
    const expected = makeChunkResult();
    mockCall.mockResolvedValueOnce(expected);

    const result = await analyzeChunk(chunk);

    expect(mockCall).toHaveBeenCalledOnce();
    expect(result).toBe(expected);
  });
});

describe("synthesizeResults", () => {
  it("calls callResponsesAPI once and returns its result", async () => {
    mockCall.mockResolvedValueOnce(stubSynthesis);

    const result = await synthesizeResults([makeChunkResult()]);

    expect(mockCall).toHaveBeenCalledOnce();
    expect(result).toBe(stubSynthesis);
  });

  it("flattens notes from all chunks into allChunkNotes", async () => {
    mockCall.mockResolvedValueOnce(stubSynthesis);
    const note1 = makeNote({ title: "Note1" });
    const note2 = makeNote({ title: "Note2" });

    await synthesizeResults([
      makeChunkResult({ notes: [note1] }),
      makeChunkResult({ notes: [note2] }),
    ]);

    const [callArg] = mockCall.mock.calls[0] as [{ input: Array<{ content: string }> }];
    const payload = JSON.parse(callArg.input[1].content);
    expect(payload.allChunkNotes).toHaveLength(2);
    expect(payload.allChunkNotes).toContainEqual(note1);
    expect(payload.allChunkNotes).toContainEqual(note2);
  });

  it("collects summaries from all chunks into allChunkSummaries", async () => {
    mockCall.mockResolvedValueOnce(stubSynthesis);
    const summary1 = { whatHappened: "Early game", overallCommentaryQuality: "strong" as const, mainTakeaway: "Good" };
    const summary2 = { whatHappened: "Late game", overallCommentaryQuality: "needs_work" as const, mainTakeaway: "Bad" };

    await synthesizeResults([
      makeChunkResult({ chunkSummary: summary1 }),
      makeChunkResult({ chunkSummary: summary2 }),
    ]);

    const [callArg] = mockCall.mock.calls[0] as [{ input: Array<{ content: string }> }];
    const payload = JSON.parse(callArg.input[1].content);
    expect(payload.allChunkSummaries).toEqual([summary1, summary2]);
  });

  it("passes empty arrays when given no chunk results", async () => {
    mockCall.mockResolvedValueOnce(stubSynthesis);

    await synthesizeResults([]);

    const [callArg] = mockCall.mock.calls[0] as [{ input: Array<{ content: string }> }];
    const payload = JSON.parse(callArg.input[1].content);
    expect(payload.allChunkNotes).toEqual([]);
    expect(payload.allChunkSummaries).toEqual([]);
  });
});
