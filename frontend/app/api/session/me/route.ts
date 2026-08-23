import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;
const BFF_SHARED_SECRET = process.env.BFF_SHARED_SECRET;

export async function GET() {
  if (!BACKEND_URL || !BFF_SHARED_SECRET) {
    return NextResponse.json({ detail: "Servidor no configurado." }, { status: 500 });
  }

  const token = (await cookies()).get("orbitica_session")?.value;
  if (!token) return NextResponse.json({ detail: "No autenticado." }, { status: 401 });

  const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Orbitica-BFF": BFF_SHARED_SECRET,
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({ detail: "Sesión inválida." }));
  const out = NextResponse.json(data, { status: response.status });
  if (response.status === 401) {
    out.cookies.set("orbitica_session", "", { path: "/", maxAge: 0 });
    out.cookies.set("orbitica_csrf", "", { path: "/", maxAge: 0 });
  }
  return out;
}
