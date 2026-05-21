import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3001";

export function proxy(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(request),
    });
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(corsHeaders(request))) {
    response.headers.set(key, value);
  }
  return response;
}

function corsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get("origin") ?? "";
  const allowedOrigin = origin === ALLOWED_ORIGIN ? origin : "";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export const config = {
  matcher: "/api/:path*",
};
