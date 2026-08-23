import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;
const BFF_SHARED_SECRET = process.env.BFF_SHARED_SECRET;
const MAX_BODY = 16 * 1024;

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  if (!BACKEND_URL || !BFF_SHARED_SECRET) {
    return NextResponse.json({ detail: "Servidor no configurado." }, { status: 500 });
  }
  if (!sameOrigin(request)) {
    return NextResponse.json({ detail: "Solicitud no permitida." }, { status: 403 });
  }

  const body = await request.text();
  if (Buffer.byteLength(body, "utf8") > MAX_BODY) {
    return NextResponse.json({ detail: "Solicitud demasiado grande." }, { status: 413 });
  }

  const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Orbitica-BFF": BFF_SHARED_SECRET,
      "X-Forwarded-For": request.headers.get("x-forwarded-for") || "",
    },
    body,
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({ detail: "Error de autenticación." }));
  if (!response.ok) {
    return NextResponse.json(data, {
      status: response.status,
      headers: response.headers.get("retry-after") ? { "Retry-After": response.headers.get("retry-after")! } : undefined,
    });
  }

  const out = NextResponse.json({ user: data.user });
  const secure = process.env.NODE_ENV === "production";
  out.cookies.set("orbitica_session", data.access_token, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/",
    maxAge: data.expires_in,
  });
  out.cookies.set("orbitica_csrf", randomBytes(32).toString("base64url"), {
    httpOnly: false,
    secure,
    sameSite: "strict",
    path: "/",
    maxAge: data.expires_in,
  });
  return out;
}
