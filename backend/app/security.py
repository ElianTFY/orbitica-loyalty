import secrets
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError

from .config import settings

# Balanced for an interactive web app: strong memory-hard hashing without making
# normal logins unnecessarily slow on a small production instance.
_hasher = PasswordHasher(time_cost=2, memory_cost=65536, parallelism=2)
_dummy_hash = _hasher.hash("orbitica-dummy-password-never-used")


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _hasher.verify(password_hash, password)
    except (VerifyMismatchError, InvalidHashError):
        return False


def password_needs_rehash(password_hash: str) -> bool:
    try:
        return _hasher.check_needs_rehash(password_hash)
    except InvalidHashError:
        return True


def verify_dummy_password(password: str) -> None:
    """Spend comparable work when the email does not exist to reduce timing leaks."""
    try:
        _hasher.verify(_dummy_hash, password)
    except VerifyMismatchError:
        pass


def create_access_token(user_id: str, role: str, business_id: str | None, token_version: int) -> tuple[str, int]:
    expire_seconds = max(1, settings.jwt_expire_hours) * 3600
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "role": role,
        "business_id": business_id,
        "tv": token_version,
        "jti": secrets.token_urlsafe(18),
        "iat": now,
        "nbf": now,
        "exp": now + timedelta(seconds=expire_seconds),
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token, expire_seconds


def decode_access_token(token: str) -> dict:
    return jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=[settings.jwt_algorithm],
        issuer=settings.jwt_issuer,
        audience=settings.jwt_audience,
        options={"require": ["sub", "iat", "nbf", "exp", "iss", "aud", "jti", "tv"]},
    )
