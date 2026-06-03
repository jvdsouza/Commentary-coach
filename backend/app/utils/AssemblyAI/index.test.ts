import { describe, it, expect } from "vitest";
import { getAuthorizationHeaders } from "./index";

// NOTE: ASSEMBLYAI_API_KEY is captured at module evaluation time as a const,
// so vi.stubEnv() + resetModules() would be needed to test different key values.
// These tests cover the structural behaviour of getAuthorizationHeaders only.

describe("getAuthorizationHeaders", () => {
  it("returns an Authorization header", () => {
    const headers = getAuthorizationHeaders();
    expect("Authorization" in headers).toBe(true);
    expect(typeof headers.Authorization).toBe("string");
  });

  it("includes Content-Type: application/json by default", () => {
    const headers = getAuthorizationHeaders();
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("includes Content-Type when includeJsonContent is explicitly true", () => {
    const headers = getAuthorizationHeaders(true);
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("omits Content-Type when includeJsonContent is false", () => {
    const headers = getAuthorizationHeaders(false);
    expect(headers["Content-Type"]).toBeUndefined();
  });

  it("returns a plain object with only the expected keys (true)", () => {
    const headers = getAuthorizationHeaders(true);
    expect(Object.keys(headers).sort()).toEqual(["Authorization", "Content-Type"].sort());
  });

  it("returns a plain object with only Authorization key (false)", () => {
    const headers = getAuthorizationHeaders(false);
    expect(Object.keys(headers)).toEqual(["Authorization"]);
  });
});
