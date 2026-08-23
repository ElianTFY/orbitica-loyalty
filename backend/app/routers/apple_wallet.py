import hmac
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import AppleWalletRegistration, Customer
from ..wallets import apple_pass_auth_token, apple_pkpass

router = APIRouter(prefix="/api/apple-wallet", tags=["apple-wallet"])
logger = logging.getLogger(__name__)


class PushTokenIn(BaseModel):
    pushToken: str = Field(min_length=16, max_length=255)


class WalletLogsIn(BaseModel):
    logs: list[str] = Field(default_factory=list, max_length=20)


def _customer(db: Session, pass_type_identifier: str, serial_number: str) -> Customer:
    if (
        not settings.apple_wallet_updates_configured
        or pass_type_identifier != settings.apple_pass_type_identifier
    ):
        raise HTTPException(401, "No autorizado.")
    customer = db.get(Customer, serial_number)
    if not customer or not customer.active:
        raise HTTPException(401, "No autorizado.")
    return customer


def _authorize(request: Request, customer: Customer) -> None:
    value = request.headers.get("authorization", "")
    prefix = "ApplePass "
    if not value.startswith(prefix):
        raise HTTPException(401, "No autorizado.")
    supplied = value[len(prefix):].strip()
    expected = apple_pass_auth_token(customer.id)
    if not supplied or not hmac.compare_digest(supplied, expected):
        raise HTTPException(401, "No autorizado.")


def _update_tag(value: datetime) -> int:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return int(value.timestamp() * 1_000_000)


@router.post(
    "/v1/devices/{device_library_identifier}/registrations/{pass_type_identifier}/{serial_number}"
)
def register_pass(
    request: Request,
    device_library_identifier: str,
    pass_type_identifier: str,
    serial_number: str,
    payload: PushTokenIn,
    db: Session = Depends(get_db),
):
    customer = _customer(db, pass_type_identifier, serial_number)
    _authorize(request, customer)
    if len(device_library_identifier) > 255:
        raise HTTPException(400, "Identificador de dispositivo inválido.")

    registration = db.scalar(
        select(AppleWalletRegistration).where(
            AppleWalletRegistration.customer_id == customer.id,
            AppleWalletRegistration.device_library_identifier == device_library_identifier,
        )
    )
    if registration:
        registration.push_token = payload.pushToken
        registration.updated_at = datetime.now(timezone.utc)
        db.commit()
        return Response(status_code=200)

    db.add(
        AppleWalletRegistration(
            customer_id=customer.id,
            device_library_identifier=device_library_identifier,
            push_token=payload.pushToken,
        )
    )
    db.commit()
    return Response(status_code=201)


@router.delete(
    "/v1/devices/{device_library_identifier}/registrations/{pass_type_identifier}/{serial_number}"
)
def unregister_pass(
    request: Request,
    device_library_identifier: str,
    pass_type_identifier: str,
    serial_number: str,
    db: Session = Depends(get_db),
):
    customer = _customer(db, pass_type_identifier, serial_number)
    _authorize(request, customer)
    registration = db.scalar(
        select(AppleWalletRegistration).where(
            AppleWalletRegistration.customer_id == customer.id,
            AppleWalletRegistration.device_library_identifier == device_library_identifier,
        )
    )
    if registration:
        db.delete(registration)
        db.commit()
    return Response(status_code=200)


@router.get(
    "/v1/devices/{device_library_identifier}/registrations/{pass_type_identifier}"
)
def list_updated_passes(
    device_library_identifier: str,
    pass_type_identifier: str,
    passes_updated_since: str | None = Query(default=None, alias="passesUpdatedSince"),
    db: Session = Depends(get_db),
):
    if (
        not settings.apple_wallet_updates_configured
        or pass_type_identifier != settings.apple_pass_type_identifier
    ):
        return Response(status_code=204)

    customers = list(
        db.scalars(
            select(Customer)
            .join(
                AppleWalletRegistration,
                AppleWalletRegistration.customer_id == Customer.id,
            )
            .where(
                AppleWalletRegistration.device_library_identifier == device_library_identifier,
                Customer.active.is_(True),
            )
        ).all()
    )
    if not customers:
        return Response(status_code=204)

    since: int | None = None
    if passes_updated_since:
        try:
            since = int(passes_updated_since)
        except ValueError:
            since = None

    changed = customers if since is None else [c for c in customers if _update_tag(c.updated_at) > since]
    if not changed:
        return Response(status_code=204)

    last_updated = max(_update_tag(c.updated_at) for c in customers)
    return JSONResponse(
        {
            "serialNumbers": [c.id for c in changed],
            "lastUpdated": str(last_updated),
        },
        headers={"Cache-Control": "no-store"},
    )


@router.get("/v1/passes/{pass_type_identifier}/{serial_number}")
def updated_pass(
    request: Request,
    pass_type_identifier: str,
    serial_number: str,
    db: Session = Depends(get_db),
):
    customer = _customer(db, pass_type_identifier, serial_number)
    _authorize(request, customer)
    business = customer.business
    if not business or not business.active:
        raise HTTPException(401, "No autorizado.")
    try:
        payload = apple_pkpass(business, customer)
    except Exception as exc:
        logger.exception("Could not build updated Apple Wallet pass for %s", customer.id)
        raise HTTPException(503, "No se pudo actualizar el pase.") from exc
    return Response(
        payload,
        media_type="application/vnd.apple.pkpass",
        headers={"Cache-Control": "no-store"},
    )


@router.post("/v1/log")
def wallet_logs(payload: WalletLogsIn):
    for line in payload.logs:
        logger.info("Apple Wallet client log: %s", line[:500])
    return Response(status_code=200)
