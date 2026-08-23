"""Generate a Web Push VAPID keypair for Render environment variables.

Run locally from the repository root:
    python scripts/generate_vapid.py

The private value is a secret. Never commit the printed values.
"""

import base64

from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.serialization import Encoding, NoEncryption, PrivateFormat, PublicFormat


def b64url(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def main() -> None:
    private_key = ec.generate_private_key(ec.SECP256R1())
    private_pem = private_key.private_bytes(
        Encoding.PEM,
        PrivateFormat.PKCS8,
        NoEncryption(),
    )
    public_point = private_key.public_key().public_bytes(
        Encoding.X962,
        PublicFormat.UncompressedPoint,
    )

    print("WEB_PUSH_VAPID_PUBLIC_KEY=" + b64url(public_point))
    print(
        "WEB_PUSH_VAPID_PRIVATE_KEY_BASE64="
        + base64.b64encode(private_pem).decode("ascii")
    )
    print("WEB_PUSH_VAPID_SUBJECT=mailto:TU_CORREO")


if __name__ == "__main__":
    main()
