import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  hashAccessCode,
  verifyAccessCode,
  createToken,
  verifyToken,
  checkAuth,
} from "./index";

beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", "test-secret-do-not-use-in-prod");
});

describe("hashAccessCode / verifyAccessCode", () => {
  it("verifies a matching code against its hash", async () => {
    const hash = await hashAccessCode("correct-horse-battery-staple");
    expect(await verifyAccessCode("correct-horse-battery-staple", hash)).toBe(true);
  });

  it("rejects a non-matching code", async () => {
    const hash = await hashAccessCode("correct-horse-battery-staple");
    expect(await verifyAccessCode("wrong-code", hash)).toBe(false);
  });

  it("produces a different hash each time (random salt)", async () => {
    const hashA = await hashAccessCode("same-code");
    const hashB = await hashAccessCode("same-code");
    expect(hashA).not.toBe(hashB);
    expect(await verifyAccessCode("same-code", hashA)).toBe(true);
    expect(await verifyAccessCode("same-code", hashB)).toBe(true);
  });
});

describe("createToken / verifyToken", () => {
  it("round-trips the userId", () => {
    const token = createToken("user-123");
    expect(verifyToken(token)).toEqual({ userId: "user-123" });
  });

  it("rejects a tampered payload", () => {
    const token = createToken("user-123");
    const [payload, signature] = token.split(".");
    const tamperedPayload = Buffer.from(JSON.stringify({ userId: "someone-else" })).toString(
      "base64url"
    );
    expect(verifyToken(`${tamperedPayload}.${signature}`)).toBeNull();
    expect(payload).not.toBe(tamperedPayload);
  });

  it("rejects a token signed with a different secret", () => {
    const token = createToken("user-123");
    vi.stubEnv("AUTH_SECRET", "a-completely-different-secret");
    expect(verifyToken(token)).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(verifyToken("not-a-real-token")).toBeNull();
    expect(verifyToken("")).toBeNull();
    expect(verifyToken("only.two.parts.here")).toBeNull();
  });
});

describe("checkAuth", () => {
  const makeRequest = (headers: Record<string, string> = {}) =>
    new Request("http://localhost/api/analysis", { headers });

  it("resolves with the userId for a valid bearer token", async () => {
    const token = createToken("user-123");
    const result = await checkAuth(makeRequest({ Authorization: `Bearer ${token}` }));
    expect(result.error).toBeUndefined();
    expect(result.userId).toBe("user-123");
  });

  it("returns a 401 response when the Authorization header is missing", async () => {
    const result = await checkAuth(makeRequest());
    expect(result.userId).toBeUndefined();
    expect(result.error?.status).toBe(401);
  });

  it("returns a 401 response when the header doesn't use the Bearer scheme", async () => {
    const token = createToken("user-123");
    const result = await checkAuth(makeRequest({ Authorization: token }));
    expect(result.error?.status).toBe(401);
  });

  it("returns a 401 response for an invalid token", async () => {
    const result = await checkAuth(makeRequest({ Authorization: "Bearer garbage" }));
    expect(result.error?.status).toBe(401);
  });
});
