import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ detail: "Solicitud no permitida." }, { status: 403 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set("orbitica_session", "", { httpOnly: true, path: "/", maxAge: 0 });
  response.cookies.set("orbitica_csrf", "", { path: "/", maxAge: 0 });
  return response;
}
