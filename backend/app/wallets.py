import base64
import hmac
import io
import json
import subprocess
import tempfile
import zipfile
from datetime import datetime, timedelta, timezone
from hashlib import sha1, sha256
from pathlib import Path

import jwt
from cryptography.hazmat.primitives.serialization import Encoding, PrivateFormat, NoEncryption, pkcs12
from cryptography.x509 import load_pem_x509_certificate
from PIL import Image, ImageDraw

from .config import settings
from .models import Business, Customer


def _hex_color(value: str) -> str:
    value = (value or "#1f6feb").lstrip("#")
    if len(value) != 6:
        return "rgb(31,111,235)"
    try:
        r = int(value[0:2], 16)
        g = int(value[2:4], 16)
        b = int(value[4:6], 16)
        return f"rgb({r},{g},{b})"
    except ValueError:
        return "rgb(31,111,235)"


def _png(size: tuple[int, int], text: str) -> bytes:
    image = Image.new("RGBA", size, (17, 17, 17, 255))
    draw = ImageDraw.Draw(image)
    # Uses Pillow's built-in font so deployment does not depend on bundled font files.
    bbox = draw.textbbox((0, 0), text)
    x = max((size[0] - (bbox[2] - bbox[0])) // 2, 2)
    y = max((size[1] - (bbox[3] - bbox[1])) // 2, 2)
    draw.text((x, y), text, fill=(255, 255, 255, 255))
    out = io.BytesIO()
    image.save(out, format="PNG", optimize=True)
    return out.getvalue()


def apple_pass_auth_token(customer_id: str) -> str:
    """Return a stable, unguessable token embedded in an updateable Apple pass."""
    secret = settings.apple_wallet_web_service_secret.encode("utf-8")
    return hmac.new(secret, customer_id.encode("utf-8"), sha256).hexdigest()


def google_wallet_ids(business: Business, customer: Customer) -> tuple[str, str]:
    issuer_id = settings.google_wallet_issuer_id
    safe_slug = "".join(ch if ch.isalnum() else "_" for ch in business.slug)
    class_id = f"{issuer_id}.orbitica_{safe_slug}"
    object_id = f"{issuer_id}.{customer.id.replace('-', '')}"
    return class_id, object_id


def google_service_account() -> dict:
    return json.loads(base64.b64decode(settings.google_wallet_service_account_json_base64))


def apple_pkpass(business: Business, customer: Customer) -> bytes:
    if not settings.apple_wallet_configured:
        raise RuntimeError("Apple Wallet no está configurado.")

    p12 = base64.b64decode(settings.apple_pass_p12_base64)
    private_key, cert, _ = pkcs12.load_key_and_certificates(
        p12,
        settings.apple_pass_p12_password.encode() if settings.apple_pass_p12_password else None,
    )
    if not private_key or not cert:
        raise RuntimeError("Certificado Apple Wallet inválido.")

    wwdr = load_pem_x509_certificate(base64.b64decode(settings.apple_wwdr_cert_base64))
    pass_json = {
        "formatVersion": 1,
        "passTypeIdentifier": settings.apple_pass_type_identifier,
        "serialNumber": customer.id,
        "teamIdentifier": settings.apple_team_identifier,
        "organizationName": business.name,
        "description": f"Tarjeta de fidelidad {business.name}",
        "logoText": business.name,
        "foregroundColor": "rgb(255,255,255)",
        "backgroundColor": _hex_color(business.primary_color),
        "labelColor": "rgb(255,255,255)",
        "storeCard": {
            "primaryFields": [
                {
                    "key": "balance",
                    "label": "SELLOS",
                    "value": f"{customer.stamp_balance}/{business.stamps_required}",
                    "changeMessage": "Tus sellos ahora son %@.",
                }
            ],
            "secondaryFields": [
                {"key": "customer", "label": "CLIENTE", "value": customer.name},
                {"key": "reward", "label": "PREMIO", "value": business.reward_name},
            ],
            "auxiliaryFields": [
                {"key": "code", "label": "CÓDIGO", "value": customer.card_code}
            ],
            "backFields": [
                {
                    "key": "terms",
                    "label": "Programa",
                    "value": f"Acumulá {business.stamps_required} sellos y recibí: {business.reward_name}.",
                },
                {
                    "key": "web",
                    "label": "Tarjeta web",
                    "value": f"{settings.public_web_url.rstrip('/')}/card/{customer.public_token}",
                },
            ],
        },
        "barcode": {
            "format": "PKBarcodeFormatQR",
            "message": customer.card_code,
            "messageEncoding": "iso-8859-1",
            "altText": customer.card_code,
        },
    }

    if settings.apple_wallet_updates_configured:
        pass_json["webServiceURL"] = f"{settings.public_api_url.rstrip('/')}/api/apple-wallet"
        pass_json["authenticationToken"] = apple_pass_auth_token(customer.id)

    files = {
        "pass.json": json.dumps(pass_json, ensure_ascii=False, separators=(",", ":")).encode("utf-8"),
        "icon.png": _png((29, 29), "O"),
        "icon@2x.png": _png((58, 58), "O"),
        "logo.png": _png((160, 50), business.name[:18]),
        "logo@2x.png": _png((320, 100), business.name[:18]),
    }
    manifest = {name: sha1(data).hexdigest() for name, data in files.items()}
    manifest_bytes = json.dumps(manifest, separators=(",", ":")).encode("utf-8")

    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        manifest_path = root / "manifest.json"
        cert_path = root / "cert.pem"
        wwdr_path = root / "wwdr.pem"
        key_path = root / "key.pem"
        signature_path = root / "signature"
        manifest_path.write_bytes(manifest_bytes)
        cert_path.write_bytes(cert.public_bytes(Encoding.PEM))
        wwdr_path.write_bytes(wwdr.public_bytes(Encoding.PEM))
        key_path.write_bytes(
            private_key.private_bytes(Encoding.PEM, PrivateFormat.TraditionalOpenSSL, NoEncryption())
        )
        subprocess.run(
            [
                "openssl", "smime", "-binary", "-sign",
                "-certfile", str(wwdr_path),
                "-signer", str(cert_path),
                "-inkey", str(key_path),
                "-in", str(manifest_path),
                "-out", str(signature_path),
                "-outform", "DER",
            ],
            check=True,
            capture_output=True,
        )
        signature = signature_path.read_bytes()

    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as zf:
        for name, data in files.items():
            zf.writestr(name, data)
        zf.writestr("manifest.json", manifest_bytes)
        zf.writestr("signature", signature)
    return out.getvalue()


def google_save_url(business: Business, customer: Customer) -> str:
    if not settings.google_wallet_configured:
        raise RuntimeError("Google Wallet no está configurado.")

    service = google_service_account()
    class_id, object_id = google_wallet_ids(business, customer)

    loyalty_class = {
        "id": class_id,
        "issuerName": business.name,
        "programName": f"{business.name} Cliente Frecuente",
        "reviewStatus": "UNDER_REVIEW",
    }
    loyalty_object = {
        "id": object_id,
        "classId": class_id,
        "state": "ACTIVE",
        "accountId": customer.card_code,
        "accountName": customer.name,
        "loyaltyPoints": {
            "label": "Sellos",
            "balance": {"int": customer.stamp_balance},
        },
        "barcode": {
            "type": "QR_CODE",
            "value": customer.card_code,
            "alternateText": customer.card_code,
        },
        "textModulesData": [
            {"id": "reward", "header": "Premio", "body": business.reward_name},
            {
                "id": "progress",
                "header": "Progreso",
                "body": f"{customer.stamp_balance}/{business.stamps_required} sellos",
            },
        ],
        "linksModuleData": {
            "uris": [
                {
                    "uri": f"{settings.public_web_url.rstrip('/')}/card/{customer.public_token}",
                    "description": "Abrir tarjeta web",
                }
            ]
        },
    }

    now = datetime.now(timezone.utc)
    claims = {
        "iss": service["client_email"],
        "aud": "google",
        "typ": "savetowallet",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=10)).timestamp()),
        "origins": [settings.public_web_url.rstrip("/")],
        "payload": {
            "loyaltyClasses": [loyalty_class],
            "loyaltyObjects": [loyalty_object],
        },
    }
    token = jwt.encode(claims, service["private_key"], algorithm="RS256")
    return f"https://pay.google.com/gp/v/save/{token}"
