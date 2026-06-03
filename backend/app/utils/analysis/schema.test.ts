import { describe, it, expect } from "vitest";
import { buildOpenAIConfig, CHUNK_ANALYSIS_FORMAT } from "./schema";
import { MODELS } from "./config";
import type { TranscriptChunk } from "../AssemblyAI/types";

const mockChunk: TranscriptChunk = {
  startMs: 0,
  endMs: 300_000,
  segments: [{ startMs: 0, endMs: 5000, text: "Hello world", speaker: "A" }],
};

describe("buildOpenAIConfig", () => {
  it("uses the expected model", () => {
    expect(buildOpenAIConfig(mockChunk).model).toBe(MODELS.chunkAnalysis);
  });

  it("returns exactly two input messages", () => {
    expect(buildOpenAIConfig(mockChunk).input).toHaveLength(2);
  });

  it("first message is a non-empty system prompt", () => {
    const [system] = buildOpenAIConfig(mockChunk).input;
    expect(system.role).toBe("system");
    expect(typeof system.content).toBe("string");
    expect((system.content as string).trim().length).toBeGreaterThan(0);
  });

  it("second message is a user message with the serialized chunk", () => {
    const [, user] = buildOpenAIConfig(mockChunk).input;
    expect(user.role).toBe("user");
    expect(user.content).toBe(JSON.stringify(mockChunk));
  });

  it("includes the structured output format", () => {
    expect(buildOpenAIConfig(mockChunk).text).toEqual({ format: CHUNK_ANALYSIS_FORMAT });
  });

  it("serializes different chunks differently", () => {
    const chunkB: TranscriptChunk = { ...mockChunk, startMs: 270_000, endMs: 570_000 };
    const [, userA] = buildOpenAIConfig(mockChunk).input;
    const [, userB] = buildOpenAIConfig(chunkB).input;
    expect(userA.content).not.toBe(userB.content);
  });
});
