import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;
const BFF_SHARED_SECRET = process.env.BFF_SHARED_SECRET;
const MAX_BODY = 128 * 1024;
const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function csrfValid(request: NextRequest, csrfCookie?: string) {
  if (!MUTATING.has(request.method)) return true;
  const header = request.headers.get("x-csrf-token") || "";
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return false;
  return Boolean(csrfCookie && header && csrfCookie === header);
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  if (!BACKEND_URL || !BFF_SHARED_SECRET) {
    return Response.json({ detail: "Servidor no configurado." }, { status: 500 });
  }

  const cookieStore = await cookies();
  const { path } = await context.params;
  const isPublic = path[0] === "public";
  const csrfCookie = cookieStore.get("orbitica_csrf")?.value;
  if (!isPublic && !csrfValid(request, csrfCookie)) {
    return Response.json({ detail: "Solicitud inválida o vencida." }, { status: 403 });
  }
  if (isPublic && MUTATING.has(request.method)) {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) {
      return Response.json({ detail: "Solicitud no permitida." }, { status: 403 });
    }
  }

  const target = new URL(`${BACKEND_URL}/api/${path.join("/")}`);
  request.nextUrl.searchParams.forEach((value, key) => target.searchParams.append(key, value));

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  headers.set("X-Orbitica-BFF", BFF_SHARED_SECRET);
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) headers.set("X-Forwarded-For", forwarded);

  const token = cookieStore.get("orbitica_session")?.value;
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const method = request.method;
  let body: ArrayBuffer | undefined;
  if (method !== "GET" && method !== "HEAD") {
    body = await request.arrayBuffer();
    if (body.byteLength > MAX_BODY) {
      return Response.json({ detail: "Solicitud demasiado grande." }, { status: 413 });
    }
  }

  const upstream = await fetch(target, { method, headers, body, cache: "no-store" });

  const outHeaders = new Headers();
  const upstreamType = upstream.headers.get("content-type");
  if (upstreamType) outHeaders.set("Content-Type", upstreamType);
  const targetHeader = upstream.headers.get("x-qr-target");
  if (targetHeader) outHeaders.set("X-QR-Target", targetHeader);
  const retryAfter = upstream.headers.get("retry-after");
  if (retryAfter) outHeaders.set("Retry-After", retryAfter);
  outHeaders.set("Cache-Control", "no-store");

  return new Response(upstream.body, { status: upstream.status, headers: outHeaders });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
