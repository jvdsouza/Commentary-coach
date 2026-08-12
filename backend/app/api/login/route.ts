import { NextResponse } from "next/server";
import { findUserByName } from "@/app/utils/db/users";
import { verifyAccessCode, createToken } from "@/app/utils/auth";

/**
 * POST /api/login
 * Exchange a name + access code (issued out-of-band to beta testers) for a bearer token.
 */
export async function POST(request: Request) {
  let body: { name?: unknown; accessCode?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, accessCode } = body;
  if (typeof name !== "string" || !name || typeof accessCode !== "string" || !accessCode) {
    return NextResponse.json(
      { error: "name and accessCode are required" },
      { status: 400 }
    );
  }

  const user = await findUserByName(name);
  const unauthorized = () =>
    NextResponse.json({ error: "Invalid name or access code" }, { status: 401 });

  if (!user) return unauthorized();

  const valid = await verifyAccessCode(accessCode, user.accessCodeHash);
  if (!valid) return unauthorized();

  const token = createToken(user.id);
  return NextResponse.json({ token, name: user.name });
}
