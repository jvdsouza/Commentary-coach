import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { NextResponse } from "next/server";

const scryptAsync = promisify(scrypt);
const SCRYPT_KEYLEN = 64;

function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET environment variable is not set");
  return secret;
}

export async function hashAccessCode(code: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(code, salt, SCRYPT_KEYLEN)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyAccessCode(code: string, hash: string): Promise<boolean> {
  const [salt, storedHex] = hash.split(":");
  if (!salt || !storedHex) return false;
  const stored = Buffer.from(storedHex, "hex");
  const derivedKey = (await scryptAsync(code, salt, SCRYPT_KEYLEN)) as Buffer;
  if (stored.length !== derivedKey.length) return false;
  return timingSafeEqual(stored, derivedKey);
}

export function createToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ userId })).toString("base64url");
  const signature = createHmac("sha256", authSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyToken(token: string): { userId: string } | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;

  const expectedSignature = createHmac("sha256", authSecret()).update(payload).digest("base64url");
  const signatureBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (signatureBuf.length !== expectedBuf.length || !timingSafeEqual(signatureBuf, expectedBuf)) {
    return null;
  }

  try {
    const { userId } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof userId === "string" ? { userId } : null;
  } catch {
    return null;
  }
}

export type AuthResult =
  | { userId: string; error?: undefined }
  | { userId?: undefined; error: NextResponse };

export async function checkAuth(request: Request): Promise<AuthResult> {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  const payload = token ? verifyToken(token) : null;

  if (!payload) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { userId: payload.userId };
}
