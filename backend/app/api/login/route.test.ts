import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/app/utils/db/users", () => ({
  findUserByName: vi.fn(),
}));

vi.mock("@/app/utils/auth", () => ({
  verifyAccessCode: vi.fn(),
  createToken: vi.fn(),
}));

import { POST } from "./route";
import { findUserByName } from "@/app/utils/db/users";
import { verifyAccessCode, createToken } from "@/app/utils/auth";

const mockFindUserByName = vi.mocked(findUserByName);
const mockVerifyAccessCode = vi.mocked(verifyAccessCode);
const mockCreateToken = vi.mocked(createToken);

const postJson = (body: unknown) =>
  POST(
    new Request("http://localhost/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    })
  );

beforeEach(() => vi.clearAllMocks());

describe("POST /api/login", () => {
  it("returns 400 when body is not valid JSON", async () => {
    const res = await postJson("not-json{{{");
    expect(res.status).toBe(400);
  });

  it("returns 400 when name is missing", async () => {
    const res = await postJson({ accessCode: "secret" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when accessCode is missing", async () => {
    const res = await postJson({ name: "Jason" });
    expect(res.status).toBe(400);
  });

  it("returns 401 with a generic message when no user matches the name", async () => {
    mockFindUserByName.mockResolvedValueOnce(null);

    const res = await postJson({ name: "Nobody", accessCode: "secret" });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Invalid name or access code");
    expect(mockVerifyAccessCode).not.toHaveBeenCalled();
  });

  it("returns 401 with a generic message when the access code doesn't match", async () => {
    mockFindUserByName.mockResolvedValueOnce({
      id: "user-1",
      name: "Jason",
      accessCodeHash: "salt:hash",
    });
    mockVerifyAccessCode.mockResolvedValueOnce(false);

    const res = await postJson({ name: "Jason", accessCode: "wrong" });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Invalid name or access code");
  });

  it("returns 200 with a bearer token on success", async () => {
    mockFindUserByName.mockResolvedValueOnce({
      id: "user-1",
      name: "Jason",
      accessCodeHash: "salt:hash",
    });
    mockVerifyAccessCode.mockResolvedValueOnce(true);
    mockCreateToken.mockReturnValueOnce("signed.token");

    const res = await postJson({ name: "Jason", accessCode: "correct" });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ token: "signed.token", name: "Jason" });
    expect(mockCreateToken).toHaveBeenCalledWith("user-1");
  });
});
