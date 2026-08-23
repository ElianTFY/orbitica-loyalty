import io
import secrets
import string

import qrcode
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import Business, Customer
from ..rate_limit import limiter
from ..request_utils import client_ip, privacy_key
from ..schemas import PublicBusinessOut, PublicCardOut, PublicJoinIn, PublicJoinOut

router = APIRouter(prefix="/api/public", tags=["public"])


def make_card_code() -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(10))


def normalize_phone(phone: str) -> str:
    raw = phone.strip()
    leading_plus = raw.startswith("+")
    digits = "".join(ch for ch in raw if ch.isdigit())
    return ("+" if leading_plus else "") + digits


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

    # Prevent database spam even if the originating-IP header is manipulated.
    limiter.check(
        f"join-phone:{business.id}:{privacy_key(phone)}",
        limit=4,
        window_seconds=60 * 60,
    )

    customer = db.scalar(
        select(Customer).where(Customer.business_id == business.id, Customer.phone == phone)
    )
    if customer:
        # Critical security fix: NEVER return an existing card's bearer token merely
        # because somebody knows its phone number.
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
            # A concurrent registration for the same phone should not reveal its token.
            existing = db.scalar(
                select(Customer).where(Customer.business_id == business.id, Customer.phone == phone)
            )
            if existing:
                raise HTTPException(409, "Ya existe una tarjeta con ese teléfono.")

    raise HTTPException(409, "No se pudo crear la tarjeta. Intentá nuevamente.")


@router.get("/card/{token}", response_model=PublicCardOut)
def public_card(request: Request, token: str, db: Session = Depends(get_db)):
    limiter.check(f"public-card:{client_ip(request)}", limit=180, window_seconds=60)
    if len(token) < 32 or len(token) > 64:
        raise HTTPException(404, "Tarjeta no encontrada.")

    customer = db.scalar(
        select(Customer).where(Customer.public_token == token, Customer.active.is_(True))
    )
    if not customer:
        raise HTTPException(404, "Tarjeta no encontrada.")

    business = db.get(Business, customer.business_id)
    if not business or not business.active:
        raise HTTPException(404, "Negocio no disponible.")

    return PublicCardOut(
        business=business,
        customer_name=customer.name,
        stamp_balance=customer.stamp_balance,
        rewards_redeemed=customer.rewards_redeemed,
        card_code=customer.card_code,
        updated_at=customer.updated_at,
    )


@router.get("/business/{slug}/qr")
def business_qr(request: Request, slug: str, db: Session = Depends(get_db)):
    limiter.check(f"public-qr:{client_ip(request)}", limit=60, window_seconds=60)
    business = db.scalar(select(Business).where(Business.slug == slug, Business.active.is_(True)))
    if not business:
        raise HTTPException(404, "Negocio no encontrado.")

    target = f"{settings.public_web_url.rstrip('/')}/join/{business.slug}"
    qr = qrcode.QRCode(
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        border=4,
        box_size=14,
    )
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
