import hashlib
import io
import secrets
import string
from datetime import datetime, timezone

import qrcode
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, Response, StreamingResponse
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import Business, Customer, WebPushSubscription
from ..rate_limit import limiter
from ..request_utils import client_ip, privacy_key
from ..schemas import (
    PublicBusinessOut,
    PublicCardOut,
    PublicJoinIn,
    PublicJoinOut,
    PushSubscriptionIn,
    PushUnsubscribeIn,
)
from ..wallets import apple_pkpass, google_save_url

router = APIRouter(prefix="/api/public", tags=["public"])


def make_card_code() -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(10))


def normalize_phone(phone: str) -> str:
    raw = phone.strip()
    leading_plus = raw.startswith("+")
    digits = "".join(ch for ch in raw if ch.isdigit())
    return ("+" if leading_plus else "") + digits


def public_customer(db: Session, token: str) -> tuple[Customer, Business]:
    if len(token) < 32 or len(token) > 64:
        raise HTTPException(404, "Tarjeta no encontrada.")
    customer = db.scalar(select(Customer).where(Customer.public_token == token, Customer.active.is_(True)))
    if not customer:
        raise HTTPException(404, "Tarjeta no encontrada.")
    business = db.get(Business, customer.business_id)
    if not business or not business.active:
        raise HTTPException(404, "Negocio no disponible.")
    return customer, business


def endpoint_hash(endpoint: str) -> str:
    return hashlib.sha256(endpoint.encode("utf-8")).hexdigest()


@router.get("/business/{slug}", response_model=PublicBusinessOut)
def public_business(request: Request, slug: str, db: Session = Depends(get_db)):
    limiter.check(f"public-business:{client_ip(request)}", limit=120, window_seconds=60)
    business = db.scalar(select(Business).where(Business.slug == slug, Business.active.is_(True)))
    if not business:
        raise HTTPException(404, "Negocio no encontrado.")
    return business


@router.post("/business/{slug}/join", response_model=PublicJoinOut, status_code=201)
def public_join(request: Request, slug: str, payload: PublicJoinIn, db: Session = Depends(get_db)):
    ip = client_ip(request)
    limiter.check("join-global", limit=600, window_seconds=60)
    limiter.check(f"join-ip:{ip}", limit=12, window_seconds=10 * 60)

    business = db.scalar(select(Business).where(Business.slug == slug, Business.active.is_(True)))
    if not business:
        raise HTTPException(404, "Negocio no encontrado.")

    phone = normalize_phone(payload.phone)
    if len(phone.replace("+", "")) < 6:
        raise HTTPException(422, "Teléfono inválido.")

    limiter.check(f"join-phone:{business.id}:{privacy_key(phone)}", limit=4, window_seconds=60 * 60)

    customer = db.scalar(select(Customer).where(Customer.business_id == business.id, Customer.phone == phone))
    if customer:
        raise HTTPException(
            409,
            "Ya existe una tarjeta con ese teléfono. Abrila desde el dispositivo donde la guardaste o pedí ayuda al negocio.",
        )

    for _ in range(4):
        customer = Customer(
            business_id=business.id,
            name=payload.name.strip(),
            phone=phone,
            email=str(payload.email).lower() if payload.email else None,
            card_code=make_card_code(),
            public_token=secrets.token_urlsafe(32),
        )
        db.add(customer)
        try:
            db.commit()
            db.refresh(customer)
            return customer
        except IntegrityError:
            db.rollback()
            existing = db.scalar(select(Customer).where(Customer.business_id == business.id, Customer.phone == phone))
            if existing:
                raise HTTPException(409, "Ya existe una tarjeta con ese teléfono.")

    raise HTTPException(409, "No se pudo crear la tarjeta. Intentá nuevamente.")


@router.get("/card/{token}", response_model=PublicCardOut)
def public_card(request: Request, token: str, db: Session = Depends(get_db)):
    limiter.check(f"public-card:{client_ip(request)}", limit=180, window_seconds=60)
    customer, business = public_customer(db, token)
    return PublicCardOut(
        business=business,
        customer_name=customer.name,
        stamp_balance=customer.stamp_balance,
        rewards_redeemed=customer.rewards_redeemed,
        card_code=customer.card_code,
        updated_at=customer.updated_at,
    )


@router.get("/card/{token}/wallet/status")
def wallet_status(request: Request, token: str, db: Session = Depends(get_db)):
    limiter.check(f"wallet-status:{client_ip(request)}", limit=120, window_seconds=60)
    public_customer(db, token)
    return {
        "apple": settings.apple_wallet_configured,
        "google": settings.google_wallet_configured,
    }


@router.get("/card/{token}/wallet/apple")
def wallet_apple(request: Request, token: str, db: Session = Depends(get_db)):
    limiter.check(f"wallet-apple:{client_ip(request)}", limit=20, window_seconds=60)
    customer, business = public_customer(db, token)
    if not settings.apple_wallet_configured:
        raise HTTPException(503, "Apple Wallet todavía no está configurado.")
    try:
        payload = apple_pkpass(business, customer)
    except Exception as exc:
        raise HTTPException(503, "No se pudo generar el pase de Apple Wallet.") from exc
    filename = f"{business.slug}-{customer.card_code}.pkpass"
    return Response(
        payload,
        media_type="application/vnd.apple.pkpass",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store",
        },
    )


@router.get("/card/{token}/wallet/google")
def wallet_google(request: Request, token: str, db: Session = Depends(get_db)):
    limiter.check(f"wallet-google:{client_ip(request)}", limit=30, window_seconds=60)
    customer, business = public_customer(db, token)
    if not settings.google_wallet_configured:
        raise HTTPException(503, "Google Wallet todavía no está configurado.")
    try:
        url = google_save_url(business, customer)
    except Exception as exc:
        raise HTTPException(503, "No se pudo preparar Google Wallet.") from exc
    return JSONResponse({"url": url}, headers={"Cache-Control": "no-store"})


@router.get("/card/{token}/push/status")
def push_status(request: Request, token: str, db: Session = Depends(get_db)):
    limiter.check(f"push-status:{client_ip(request)}", limit=120, window_seconds=60)
    public_customer(db, token)
    return {
        "enabled": settings.web_push_configured,
        "vapid_public_key": settings.web_push_vapid_public_key if settings.web_push_configured else "",
    }


@router.post("/card/{token}/push/subscribe", status_code=201)
def push_subscribe(
    request: Request,
    token: str,
    payload: PushSubscriptionIn,
    db: Session = Depends(get_db),
):
    limiter.check(f"push-subscribe:{client_ip(request)}", limit=15, window_seconds=10 * 60)
    if not settings.web_push_configured:
        raise HTTPException(503, "Las notificaciones todavía no están configuradas.")
    customer, _ = public_customer(db, token)
    hashed = endpoint_hash(payload.endpoint)
    subscription = db.scalar(
        select(WebPushSubscription).where(WebPushSubscription.endpoint_hash == hashed)
    )
    now = datetime.now(timezone.utc)
    if subscription:
        subscription.customer_id = customer.id
        subscription.endpoint = payload.endpoint
        subscription.p256dh = payload.keys.p256dh
        subscription.auth = payload.keys.auth
        subscription.user_agent = (request.headers.get("user-agent") or "")[:255] or None
        subscription.active = True
        subscription.updated_at = now
        db.commit()
        return {"ok": True}

    db.add(
        WebPushSubscription(
            customer_id=customer.id,
            endpoint_hash=hashed,
            endpoint=payload.endpoint,
            p256dh=payload.keys.p256dh,
            auth=payload.keys.auth,
            user_agent=(request.headers.get("user-agent") or "")[:255] or None,
        )
    )
    db.commit()
    return {"ok": True}


@router.delete("/card/{token}/push/subscribe", status_code=204)
def push_unsubscribe(
    request: Request,
    token: str,
    payload: PushUnsubscribeIn,
    db: Session = Depends(get_db),
):
    limiter.check(f"push-unsubscribe:{client_ip(request)}", limit=30, window_seconds=10 * 60)
    customer, _ = public_customer(db, token)
    subscription = db.scalar(
        select(WebPushSubscription).where(
            WebPushSubscription.endpoint_hash == endpoint_hash(payload.endpoint),
            WebPushSubscription.customer_id == customer.id,
        )
    )
    if subscription:
        db.delete(subscription)
        db.commit()
    return Response(status_code=204)


@router.get("/business/{slug}/qr")
def business_qr(request: Request, slug: str, db: Session = Depends(get_db)):
    limiter.check(f"public-qr:{client_ip(request)}", limit=60, window_seconds=60)
    business = db.scalar(select(Business).where(Business.slug == slug, Business.active.is_(True)))
    if not business:
        raise HTTPException(404, "Negocio no encontrado.")

    target = f"{settings.public_web_url.rstrip('/')}/join/{business.slug}"
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H, border=4, box_size=14)
    qr.add_data(target)
    qr.make(fit=True)
    image = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="image/png",
        headers={"X-QR-Target": target, "Cache-Control": "public, max-age=300"},
    )
