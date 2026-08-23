from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..deps import get_current_user
from ..models import User
from ..rate_limit import limiter
from ..request_utils import client_ip, privacy_key
from ..schemas import ChangePasswordIn, LoginIn, LoginOut, UserOut
from ..security import (
    create_access_token,
    hash_password,
    password_needs_rehash,
    verify_dummy_password,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _utc(dt):
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


@router.post("/login", response_model=LoginOut)
def login(request: Request, payload: LoginIn, db: Session = Depends(get_db)):
    ip = client_ip(request)
    email_key = privacy_key(payload.email)

    # Cheap checks happen before Argon2, limiting CPU abuse without an external Redis hop.
    limiter.check(f"login-ip:{ip}", limit=20, window_seconds=15 * 60)
    limiter.check(f"login-account:{email_key}", limit=8, window_seconds=15 * 60)

    user = db.scalar(select(User).where(User.email == payload.email))
    now = datetime.now(timezone.utc)

    if not user:
        verify_dummy_password(payload.password)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Correo o contraseña incorrectos.")

    locked_until = _utc(user.locked_until)
    if locked_until and locked_until > now:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiados intentos. Intentá nuevamente más tarde.",
            headers={"Retry-After": str(max(1, int((locked_until - now).total_seconds())))},
        )

    if locked_until and locked_until <= now:
        user.failed_login_attempts = 0
        user.locked_until = None

    valid = user.active and verify_password(payload.password, user.password_hash)
    if not valid:
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= settings.login_max_failures:
            user.failed_login_attempts = 0
            user.locked_until = now + timedelta(minutes=settings.login_lock_minutes)
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Correo o contraseña incorrectos.")

    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login_at = now
    if password_needs_rehash(user.password_hash):
        user.password_hash = hash_password(payload.password)
    db.commit()
    db.refresh(user)

    token, expires_in = create_access_token(user.id, user.role, user.business_id, user.token_version)
    return LoginOut(access_token=token, expires_in=expires_in, user=user)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.post("/change-password", response_model=UserOut)
def change_password(
    request: Request,
    payload: ChangePasswordIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    limiter.check(f"change-password:{user.id}:{client_ip(request)}", limit=5, window_seconds=30 * 60)
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="La contraseña actual no es correcta.")
    if verify_password(payload.new_password, user.password_hash):
        raise HTTPException(status_code=400, detail="La nueva contraseña debe ser diferente.")

    user.password_hash = hash_password(payload.new_password)
    user.token_version += 1  # immediately revokes all existing JWTs
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    db.refresh(user)
    return user
