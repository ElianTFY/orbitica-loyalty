import base64
import io
import json
import os
import tempfile
import zipfile
from datetime import datetime, timedelta, timezone
from hashlib import sha1
from pathlib import Path

import jwt
import requests
from cryptography.hazmat.primitives.serialization import Encoding, PrivateFormat, NoEncryption, pkcs12
from cryptography.x509 import load_pem_x509_certificate

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

    serial = customer.id
    pass_json = {
        "formatVersion": 1,
        "passTypeIdentifier": settings.apple_pass_type_identifier,
        "serialNumber": serial,
        "teamIdentifier": settings.apple_team_identifier,
        "organizationName": business.name,
        "description": f"Tarjeta de fidelidad {business.name}",
        "logoText": business.name,
        "foregroundColor": "rgb(255,255,255)",
        "backgroundColor": _hex_color(business.primary_color),
        "labelColor": "rgb(255,255,255)",
        "storeCard": {
            "primaryFields": [
                {"key": "balance", "label": "SELLOS", "value": f"{customer.stamp_balance}/{business.stamps_required}"}
            ],
            "secondaryFields": [
                {"key": "customer", "label": "CLIENTE", "value": customer.name},
                {"key": "reward", "label": "PREMIO", "value": business.reward_name},
            ],
            "auxiliaryFields": [
                {"key": "code", "label": "CÓDIGO", "value": customer.card_code}
            ],
        },
        "barcode": {
            "format": "PKBarcodeFormatQR",
            "message": customer.card_code,
            "messageEncoding": "iso-8859-1",
            "altText": customer.card_code,
        },
        "backFields": [
            {"key": "terms", "label": "Programa", "value": f"Acumulá {business.stamps_required} sellos y recibí: {business.reward_name}."},
            {"key": "web", "label": "Tarjeta web", "value": f"{settings.public_web_url.rstrip('/')}/card/{customer.public_token}"},
        ],
    }

    # Minimal SVG assets keep the pass valid without storing customer-uploaded images yet.
    icon_svg = '<svg xmlns="http://www.w3.org/2000/svg" width="58" height="58"><rect width="58" height="58" rx="10" fill="#111"/><text x="29" y="38" text-anchor="middle" font-size="30" fill="white">O</text></svg>'
    logo_svg = '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="100"><rect width="320" height="100" fill="transparent"/><text x="10" y="68" font-size="52" fill="white">Orbítica</text></svg>'

    files = {
        "pass.json": json.dumps(pass_json, ensure_ascii=False, separators=(",", ":")).encode(),
        "icon.svg": icon_svg.encode(),
        "icon@2x.svg": icon_svg.encode(),
        "logo.svg": logo_svg.encode(),
        "logo@2x.svg": logo_svg.encode(),
    }
    manifest = {name: sha1(data).hexdigest() for name, data in files.items()}
    manifest_bytes = json.dumps(manifest, separators=(",", ":")).encode()

    # Sign manifest with OpenSSL; cryptography does not provide the exact PKCS#7 detached flow needed here.
    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        (root / "manifest.json").write_bytes(manifest_bytes)
        (root / "cert.pem").write_bytes(cert.public_bytes(Encoding.PEM))
        (root / "wwdr.pem").write_bytes(wwdr.public_bytes(Encoding.PEM))
        (root / "key.pem").write_bytes(
            private_key.private_bytes(Encoding.PEM, PrivateFormat.TraditionalOpenSSL, NoEncryption())
        )
        result = os.system(
            f'openssl smime -binary -sign -certfile "{root / "wwdr.pem"}" -signer "{root / "cert.pem"}" '
            f'-inkey "{root / "key.pem"}" -in "{root / "manifest.json"}" -out "{root / "signature"}" '
            f'-outform DER >/dev/null 2>&1'
        )
        if result != 0:
            raise RuntimeError("No se pudo firmar el pase Apple Wallet.")
        signature = (root / "signature").read_bytes()

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

    service = json.loads(base64.b64decode(settings.google_wallet_service_account_json_base64))
    issuer_id = settings.google_wallet_issuer_id
    safe_slug = ''.join(ch if ch.isalnum() else '_' for ch in business.slug)
    class_id = f"{issuer_id}.orbitica_{safe_slug}"
    object_id = f"{issuer_id}.{customer.id.replace('-', '')}"

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
            {"id": "progress", "header": "Progreso", "body": f"{customer.stamp_balance}/{business.stamps_required} sellos"},
        ],
        "linksModuleData": {
            "uris": [
                {"uri": f"{settings.public_web_url.rstrip('/')}/card/{customer.public_token}", "description": "Abrir tarjeta web"}
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
        "origins": [settings.public_web_url.rstrip('/')],
        "payload": {
            "loyaltyClasses": [loyalty_class],
            "loyaltyObjects": [loyalty_object],
        },
    }
    token = jwt.encode(claims, service["private_key"], algorithm="RS256")
    return f"https://pay.google.com/gp/v/save/{token}"
