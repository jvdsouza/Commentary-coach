import { describe, it, expect } from "vitest";
import { checkRateLimit } from "./index";

let counter = 0;
const uniqueKey = () => `test-user-${Date.now()}-${counter++}`;

describe("checkRateLimit", () => {
  it("allows requests under the limit", async () => {
    const key = uniqueKey();
    for (let i = 0; i < 5; i++) {
      expect(await checkRateLimit(key)).toBeNull();
    }
  });

  it("rejects the 6th request within the window for the same key", async () => {
    const key = uniqueKey();
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(key);
    }
    const res = await checkRateLimit(key);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(429);
    expect(res?.headers.get("Retry-After")).toBeTruthy();
  });

  it("tracks each key's budget independently", async () => {
    const keyA = uniqueKey();
    const keyB = uniqueKey();
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(keyA);
    }
    // keyA is now exhausted, but keyB should be unaffected
    expect(await checkRateLimit(keyB)).toBeNull();
  });
});
