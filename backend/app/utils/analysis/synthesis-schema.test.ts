import { describe, it, expect } from "vitest";
import { buildSynthesisConfig, SYNTHESIS_FORMAT } from "./synthesis-schema";
import { MODELS } from "./config";
import type { Note, ChunkSummary } from "./types";

const mockNote: Note = {
  startMs: 0,
  endMs: 5000,
  category: "pacing",
  severity: "medium",
  title: "Slow pacing",
  observation: "Commentary is slow",
  evidence: "Long pauses throughout",
  whyItMatters: "Viewers disengage",
  suggestion: "Maintain tighter cadence",
};

const mockSummary: ChunkSummary = {
  whatHappened: "Early game skirmish",
  overallCommentaryQuality: "mixed",
  mainTakeaway: "Pacing needs improvement",
};

describe("buildSynthesisConfig", () => {
  it("uses the expected model", () => {
    const config = buildSynthesisConfig({ allChunkNotes: [], allChunkSummaries: [] });
    expect(config.model).toBe(MODELS.synthesis);
  });

  it("returns exactly two input messages", () => {
    const { input } = buildSynthesisConfig({ allChunkNotes: [], allChunkSummaries: [] });
    expect(input).toHaveLength(2);
  });

  it("first message is a non-empty system prompt", () => {
    const [system] = buildSynthesisConfig({ allChunkNotes: [], allChunkSummaries: [] }).input;
    expect(system.role).toBe("system");
    expect((system.content as string).trim().length).toBeGreaterThan(0);
  });

  it("user message contains the serialized synthesis input", () => {
    const synthInput = { allChunkNotes: [mockNote], allChunkSummaries: [mockSummary] };
    const [, user] = buildSynthesisConfig(synthInput).input;
    expect(user.role).toBe("user");
    expect(user.content).toBe(JSON.stringify(synthInput));
  });

  it("handles empty notes and summaries arrays", () => {
    const synthInput = { allChunkNotes: [], allChunkSummaries: [] };
    const [, user] = buildSynthesisConfig(synthInput).input;
    expect(user.content).toBe(JSON.stringify(synthInput));
  });

  it("includes the synthesis structured output format", () => {
    const config = buildSynthesisConfig({ allChunkNotes: [], allChunkSummaries: [] });
    expect(config.text).toEqual({ format: SYNTHESIS_FORMAT });
  });
});
