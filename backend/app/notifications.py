import base64
import json
import logging
import ssl
import tempfile
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httpx
import jwt
from cryptography.hazmat.primitives.serialization import Encoding, PrivateFormat, NoEncryption, pkcs12
from pywebpush import WebPushException, webpush
from sqlalchemy import select

from .config import settings
from .database import SessionLocal
from .models import AppleWalletRegistration, Business, Customer, WebPushSubscription
from .wallets import google_service_account, google_wallet_ids

logger = logging.getLogger(__name__)

GOOGLE_SCOPE = "https://www.googleapis.com/auth/wallet_object.issuer"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_WALLET_API = "https://walletobjects.googleapis.com/walletobjects/v1"
APPLE_APNS_URL = "https://api.push.apple.com/3/device"


def _notification_copy(business: Business, customer: Customer, reason: str) -> tuple[str, str]:
    progress = f"{customer.stamp_balance}/{business.stamps_required}"
    if reason == "reward":
        return (
            f"🎉 Premio disponible en {business.name}",
            f"Llegaste a {progress} sellos. Ya podés canjear: {business.reward_name}.",
        )
    if reason == "redeem":
        return (
            f"Premio canjeado en {business.name}",
            f"Tu premio fue canjeado. Tu nuevo progreso es {progress} sellos.",
        )
    if reason == "program":
        return (
            f"{business.name} actualizó su programa",
            f"Tu tarjeta ahora requiere {business.stamps_required} sellos para: {business.reward_name}.",
        )
    return (
        f"Nuevo sello en {business.name}",
        f"Ahora tenés {progress} sellos. Premio: {business.reward_name}.",
    )


def _web_push_private_key() -> str:
    return base64.b64decode(settings.web_push_vapid_private_key_base64).decode("utf-8")


def _send_web_pushes(db, business: Business, customer: Customer, reason: str) -> None:
    if not settings.web_push_configured:
        return

    title, body = _notification_copy(business, customer, reason)
    payload = json.dumps(
        {
            "title": title,
            "body": body,
            "url": f"{settings.public_web_url.rstrip('/')}/card/{customer.public_token}",
            "tag": f"orbitica-card-{customer.id}",
        },
        ensure_ascii=False,
    )

    subscriptions = list(
        db.scalars(
            select(WebPushSubscription).where(
                WebPushSubscription.customer_id == customer.id,
                WebPushSubscription.active.is_(True),
            )
        ).all()
    )
    if not subscriptions:
        return

    private_key = _web_push_private_key()
    for subscription in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": subscription.endpoint,
                    "keys": {"p256dh": subscription.p256dh, "auth": subscription.auth},
                },
                data=payload,
                vapid_private_key=private_key,
                vapid_claims={"sub": settings.web_push_vapid_subject},
                ttl=60 * 60,
            )
        except WebPushException as exc:
            status = getattr(getattr(exc, "response", None), "status_code", None)
            if status in {404, 410}:
                subscription.active = False
                logger.info("Disabled expired Web Push subscription %s", subscription.id)
            else:
                logger.warning("Web Push failed for subscription %s: %s", subscription.id, exc)
        except Exception:
            logger.exception("Unexpected Web Push error for subscription %s", subscription.id)


def _google_access_token() -> str:
    service = google_service_account()
    now = datetime.now(timezone.utc)
    assertion = jwt.encode(
        {
            "iss": service["client_email"],
            "scope": GOOGLE_SCOPE,
            "aud": GOOGLE_TOKEN_URL,
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(minutes=55)).timestamp()),
        },
        service["private_key"],
        algorithm="RS256",
    )
    with httpx.Client(timeout=12.0) as client:
        response = client.post(
            GOOGLE_TOKEN_URL,
            data={
                "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
                "assertion": assertion,
            },
        )
        response.raise_for_status()
        return response.json()["access_token"]


def _google_patch_payload(business: Business, customer: Customer, notify: bool) -> dict:
    payload = {
        "loyaltyPoints": {
            "label": "Sellos",
            "balance": {"int": customer.stamp_balance},
        },
        "textModulesData": [
            {"id": "reward", "header": "Premio", "body": business.reward_name},
            {
                "id": "progress",
                "header": "Progreso",
                "body": f"{customer.stamp_balance}/{business.stamps_required} sellos",
            },
        ],
    }
    if notify:
        payload["notifyPreference"] = "NOTIFY_ON_UPDATE"
    return payload


def _update_google_wallet(business: Business, customer: Customer, notify: bool = True) -> None:
    if not settings.google_wallet_configured:
        return

    _, object_id = google_wallet_ids(business, customer)
    access_token = _google_access_token()
    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
    url = f"{GOOGLE_WALLET_API}/loyaltyObject/{object_id}"

    with httpx.Client(timeout=12.0) as client:
        response = client.patch(url, headers=headers, json=_google_patch_payload(business, customer, notify))
        if response.status_code == 404:
            # The customer has not saved the Google Wallet pass yet.
            return
        if response.status_code in {403, 429} and notify:
            # A notification quota can be exhausted while the pass itself still needs the update.
            response = client.patch(url, headers=headers, json=_google_patch_payload(business, customer, False))
        response.raise_for_status()


@contextmanager
def _apple_client():
    p12 = base64.b64decode(settings.apple_pass_p12_base64)
    private_key, cert, _ = pkcs12.load_key_and_certificates(
        p12,
        settings.apple_pass_p12_password.encode() if settings.apple_pass_p12_password else None,
    )
    if not private_key or not cert:
        raise RuntimeError("Certificado Apple Wallet inválido.")

    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        cert_path = root / "pass-cert.pem"
        key_path = root / "pass-key.pem"
        cert_path.write_bytes(cert.public_bytes(Encoding.PEM))
        key_path.write_bytes(
            private_key.private_bytes(Encoding.PEM, PrivateFormat.TraditionalOpenSSL, NoEncryption())
        )

        context = ssl.create_default_context()
        context.load_cert_chain(certfile=str(cert_path), keyfile=str(key_path))
        with httpx.Client(http2=True, verify=context, timeout=12.0) as client:
            yield client


def _notify_apple_wallet(db, customer: Customer) -> None:
    if not settings.apple_wallet_updates_configured:
        return

    registrations = list(
        db.scalars(
            select(AppleWalletRegistration).where(AppleWalletRegistration.customer_id == customer.id)
        ).all()
    )
    if not registrations:
        return

    with _apple_client() as client:
        for registration in registrations:
            try:
                response = client.post(
                    f"{APPLE_APNS_URL}/{registration.push_token}",
                    content=b"{}",
                    headers={
                        "apns-topic": settings.apple_pass_type_identifier,
                        "apns-push-type": "background",
                        "apns-priority": "5",
                        "content-type": "application/json",
                    },
                )
                if response.status_code == 200:
                    continue
                reason = ""
                try:
                    reason = response.json().get("reason", "")
                except Exception:
                    pass
                if response.status_code == 410 or reason in {"BadDeviceToken", "Unregistered"}:
                    db.delete(registration)
                    logger.info("Removed invalid Apple Wallet registration %s", registration.id)
                else:
                    logger.warning(
                        "Apple Wallet APNs update failed (%s %s) for registration %s",
                        response.status_code,
                        reason,
                        registration.id,
                    )
            except Exception:
                logger.exception("Apple Wallet APNs request failed for registration %s", registration.id)


def sync_customer_channels(customer_id: str, reason: str = "stamp") -> None:
    """Update all customer-facing channels after a committed loyalty change.

    Runs as a FastAPI background task so a temporary outage at Apple, Google or a
    browser push service never blocks the point-of-sale action.
    """
    with SessionLocal() as db:
        customer = db.get(Customer, customer_id)
        if not customer or not customer.active:
            return
        business = db.get(Business, customer.business_id)
        if not business or not business.active:
            return

        _send_web_pushes(db, business, customer, reason)
        try:
            _update_google_wallet(business, customer, notify=True)
        except Exception:
            logger.exception("Google Wallet update failed for customer %s", customer.id)
        try:
            _notify_apple_wallet(db, customer)
        except Exception:
            logger.exception("Apple Wallet update failed for customer %s", customer.id)
        db.commit()
