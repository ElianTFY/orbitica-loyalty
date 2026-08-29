from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.config import settings
from ..core.exceptions import DomainException, UnauthorizedException, ValidationException
from ..core.rate_limit import limiter
from ..core.security import (
    create_access_token,
    hash_password,
    password_needs_rehash,
    verify_dummy_password,
    verify_password,
)
from ..models import User
from ..schemas.auth import ChangePasswordIn, LoginIn, LoginOut


def _utc(dt):
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


class AuthService:
    @staticmethod
    def authenticate(db: Session, payload: LoginIn, client_ip: str, email_key: str) -> LoginOut:
        limiter.check(f"login-ip:{client_ip}", limit=20, window_seconds=15 * 60)
        limiter.check(f"login-account:{email_key}", limit=8, window_seconds=15 * 60)

        user = db.scalar(select(User).where(User.email == payload.email))
        now = datetime.now(timezone.utc)

        if not user:
            verify_dummy_password(payload.password)
            raise UnauthorizedException("Correo o contrase?a incorrectos.")

        locked_until = _utc(user.locked_until)
        if locked_until and locked_until > now:
            retry_after = max(1, int((locked_until - now).total_seconds()))
            raise DomainException(
                "Demasiados intentos. Intent? nuevamente m?s tarde.",
                code="ACCOUNT_LOCKED",
                status_code=429,
                details={"retry_after": retry_after},
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
            raise UnauthorizedException("Correo o contrase?a incorrectos.")

        user.failed_login_attempts = 0
        user.locked_until = None
        user.last_login_at = now
        if password_needs_rehash(user.password_hash):
            user.password_hash = hash_password(payload.password)
        db.commit()
        db.refresh(user)

        token, expires_in = create_access_token(user.id, user.role, user.business_id, user.token_version)
        return LoginOut(access_token=token, expires_in=expires_in, user=user)

    @staticmethod
    def change_password(db: Session, user: User, payload: ChangePasswordIn, client_ip: str) -> User:
        limiter.check(f"change-password:{user.id}:{client_ip}", limit=5, window_seconds=30 * 60)
        if not verify_password(payload.current_password, user.password_hash):
            raise ValidationException("La contrase?a actual no es correcta.")
        if verify_password(payload.new_password, user.password_hash):
            raise ValidationException("La nueva contrase?a debe ser diferente.")

        user.password_hash = hash_password(payload.new_password)
        user.token_version += 1
        user.failed_login_attempts = 0
        user.locked_until = None
        db.commit()
        db.refresh(user)
        return user
