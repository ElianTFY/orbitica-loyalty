import hashlib

from fastapi import Request


def client_ip(request: Request) -> str:
    # Render/Vercel forward the client chain. The first hop is the originating address.
    # We also combine rate limits with account/phone keys, so spoofing one header alone
    # does not bypass the sensitive endpoint limits.
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",", 1)[0].strip()[:64]
    if request.client:
        return request.client.host[:64]
    return "unknown"


def privacy_key(value: str) -> str:
    return hashlib.sha256(value.strip().lower().encode("utf-8")).hexdigest()[:24]
