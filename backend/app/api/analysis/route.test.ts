import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/app/utils/analysis", () => ({
  analyzeChunk: vi.fn(),
  synthesizeResults: vi.fn(),
}));

vi.mock("@/app/utils/db/reviews", () => ({
  insertChunks: vi.fn().mockResolvedValue(new Map()),
  insertCoachingNotes: vi.fn().mockResolvedValue(undefined),
  insertSummary: vi.fn().mockResolvedValue(undefined),
  setReviewStatus: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "./route";
import { analyzeChunk, synthesizeResults } from "@/app/utils/analysis";

const mockAnalyzeChunk = vi.mocked(analyzeChunk);
const mockSynthesizeResults = vi.mocked(synthesizeResults);

const makeChunkResult = (id = 0) => ({
  chunkStartMs: id * 300_000,
  chunkEndMs: (id + 1) * 300_000,
  notes: [],
  chunkSummary: {
    whatHappened: `Chunk ${id}`,
    overallCommentaryQuality: "mixed" as const,
    mainTakeaway: "OK",
  },
});

const stubSynthesis = {
  topStrengths: [],
  topImprovementAreas: [],
  nextSessionFocus: { title: "Focus", rationale: "Why", drills: [] },
  overallSummary: "Good session",
  speakerFeedback: [],
};

const postJson = (chunks: unknown, reviewId: string | null = null) =>
  POST(
    new Request("http://localhost/api/analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId, chunks }),
    })
  );

beforeEach(() => vi.clearAllMocks());

describe("POST /api/analysis", () => {
  it("returns 400 when body is not valid JSON", async () => {
    const req = new Request("http://localhost/api/analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json{{{",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid JSON body");
  });

  it("returns 400 when chunks is not an array", async () => {
    const res = await postJson({ notAnArray: true });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/chunks array/i);
  });

  it("returns 400 when chunks is a string", async () => {
    const res = await postJson("just a string");
    expect(res.status).toBe(400);
  });

  it("returns 500 when analyzeChunk throws", async () => {
    mockAnalyzeChunk.mockRejectedValueOnce(new Error("OpenAI down"));

    const res = await postJson([{ startMs: 0, endMs: 300_000, segments: [] }]);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Chunk analysis failed");
    expect(json.message).toBe("OpenAI down");
  });

  it("returns 500 with chunkResults when synthesizeResults throws", async () => {
    const chunkResult = makeChunkResult(0);
    mockAnalyzeChunk.mockResolvedValueOnce(chunkResult);
    mockSynthesizeResults.mockRejectedValueOnce(new Error("Synthesis failed"));

    const res = await postJson([{ startMs: 0, endMs: 300_000, segments: [] }]);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Synthesis failed");
    expect(json.chunkResults).toEqual([chunkResult]);
  });

  it("returns 200 with chunkResults and synthesis on success", async () => {
    const chunkResult = makeChunkResult(0);
    mockAnalyzeChunk.mockResolvedValueOnce(chunkResult);
    mockSynthesizeResults.mockResolvedValueOnce(stubSynthesis);

    const res = await postJson([{ startMs: 0, endMs: 300_000, segments: [] }]);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.chunkResults).toEqual([chunkResult]);
    expect(json.synthesis).toEqual(stubSynthesis);
  });

  it("includes reviewId in the response", async () => {
    mockAnalyzeChunk.mockResolvedValueOnce(makeChunkResult(0));
    mockSynthesizeResults.mockResolvedValueOnce(stubSynthesis);

    const res = await postJson([{ startMs: 0, endMs: 300_000, segments: [] }], "test-review-id");
    const json = await res.json();
    expect(json.reviewId).toBe("test-review-id");
  });

  it("calls analyzeChunk once per chunk", async () => {
    mockAnalyzeChunk.mockResolvedValue(makeChunkResult(0));
    mockSynthesizeResults.mockResolvedValueOnce(stubSynthesis);

    const chunks = [
      { startMs: 0, endMs: 300_000, segments: [] },
      { startMs: 270_000, endMs: 570_000, segments: [] },
    ];
    await postJson(chunks);

    expect(mockAnalyzeChunk).toHaveBeenCalledTimes(2);
  });

  it("calls synthesizeResults with the array of chunk results", async () => {
    const chunkResult = makeChunkResult(0);
    mockAnalyzeChunk.mockResolvedValueOnce(chunkResult);
    mockSynthesizeResults.mockResolvedValueOnce(stubSynthesis);

    await postJson([{ startMs: 0, endMs: 300_000, segments: [] }]);

    expect(mockSynthesizeResults).toHaveBeenCalledWith([chunkResult]);
  });

  it("returns 200 for an empty array of chunks (edge case)", async () => {
    mockSynthesizeResults.mockResolvedValueOnce(stubSynthesis);

    const res = await postJson([]);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.chunkResults).toEqual([]);
  });
});
