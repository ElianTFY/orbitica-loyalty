# Re-export from core for backwards compatibility
from .core.security import (
    hash_password,
    verify_password,
    password_needs_rehash,
    verify_dummy_password,
    create_access_token,
    decode_access_token,
)

__all__ = [
    "hash_password",
    "verify_password",
    "password_needs_rehash",
    "verify_dummy_password",
    "create_access_token",
    "decode_access_token",
]
