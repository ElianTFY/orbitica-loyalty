import base64

from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.serialization import Encoding, NoEncryption, PrivateFormat

from app.config import settings
from app.notifications import _web_push_private_key


def test_base64_pem_vapid_key_loads(monkeypatch):
    key = ec.generate_private_key(ec.SECP256R1())
    pem = key.private_bytes(Encoding.PEM, PrivateFormat.PKCS8, NoEncryption())
    monkeypatch.setattr(
        settings,
        "web_push_vapid_private_key_base64",
        base64.b64encode(pem).decode("ascii"),
    )

    vapid = _web_push_private_key()

    assert vapid.public_key is not None
