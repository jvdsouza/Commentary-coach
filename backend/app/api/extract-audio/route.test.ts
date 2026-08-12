import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/app/utils/auth", () => ({
  checkAuth: vi.fn().mockResolvedValue({ userId: "user-1" }),
}));

vi.mock("@/app/utils/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/app/utils/ffmpeg", () => ({
  extractAudio: vi.fn(),
  checkFfmpegAvailable: vi.fn().mockResolvedValue(true),
  getAudioDuration: vi.fn().mockResolvedValue(60),
}));

vi.mock("@/app/utils/file-handler", () => ({
  isValidVideoFile: vi.fn().mockReturnValue(true),
}));

vi.mock("@/app/utils/AssemblyAI", () => ({
  analyzeCommentary: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/app/utils/db/reviews", () => ({
  createReview: vi.fn().mockResolvedValue("review-1"),
  setReviewStatus: vi.fn().mockResolvedValue(undefined),
  insertSegments: vi.fn().mockResolvedValue(undefined),
  insertChunks: vi.fn().mockResolvedValue(new Map()),
}));

import { POST } from "./route";
import { checkAuth } from "@/app/utils/auth";
import { checkRateLimit } from "@/app/utils/rate-limit";

const mockCheckAuth = vi.mocked(checkAuth);
const mockCheckRateLimit = vi.mocked(checkRateLimit);

function makeRequest() {
  const formData = new FormData();
  formData.append(
    "video",
    new File([new Uint8Array([1, 2, 3])], "clip.mp4", { type: "video/mp4" })
  );
  return new Request("http://localhost/api/extract-audio", {
    method: "POST",
    body: formData,
  });
}

beforeEach(() => vi.clearAllMocks());

describe("POST /api/extract-audio", () => {
  it("returns 401 when checkAuth rejects the request", async () => {
    mockCheckAuth.mockResolvedValueOnce({
      error: Response.json({ error: "Unauthorized" }, { status: 401 }) as never,
    });

    const res = await POST(makeRequest() as never);
    expect(res.status).toBe(401);
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
  });

  it("passes the authenticated userId to checkRateLimit", async () => {
    mockCheckAuth.mockResolvedValueOnce({ userId: "user-42" });

    await POST(makeRequest() as never);
    expect(mockCheckRateLimit).toHaveBeenCalledWith("user-42");
  });

  it("returns 429 when checkRateLimit rejects the request", async () => {
    mockCheckRateLimit.mockResolvedValueOnce(
      Response.json({ error: "Too many requests" }, { status: 429 }) as never
    );

    const res = await POST(makeRequest() as never);
    expect(res.status).toBe(429);
  });
});
