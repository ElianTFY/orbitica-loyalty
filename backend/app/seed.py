import logging
from sqlalchemy import select
from sqlalchemy.orm import Session

from .core.config import settings
from .core.security import hash_password
from .models import Business, User
from .schemas.common import validate_strong_password

log = logging.getLogger("orbitica.seed")


def _validate_seed_password(label: str, password: str) -> None:
    if settings.production:
        try:
            validate_strong_password(password)
        except ValueError as exc:
            raise RuntimeError(f"{label} no cumple la pol?tica de contrase?a segura: {exc}") from exc


def seed_bootstrap(db: Session) -> None:
    if settings.bootstrap_superadmin_email and settings.bootstrap_superadmin_password:
        _validate_seed_password("BOOTSTRAP_SUPERADMIN_PASSWORD", settings.bootstrap_superadmin_password)
        email = settings.bootstrap_superadmin_email.strip().lower()
        user = db.scalar(select(User).where(User.email == email))
        if not user:
            db.add(
                User(
                    email=email,
                    full_name="Orb?tica Superadmin",
                    password_hash=hash_password(settings.bootstrap_superadmin_password),
                    role="superadmin",
                    business_id=None,
                )
            )
            db.commit()
            log.info("Superadmin inicial creado.")

    if not settings.seed_demo:
        return

    business = db.scalar(select(Business).where(Business.slug == settings.demo_business_slug))
    if not business:
        business = Business(
            name=settings.demo_business_name,
            slug=settings.demo_business_slug,
            program_type="stamps",
            reward_name="Corte gratis",
            stamps_required=10,
            primary_color="#0EA5FF",
        )
        db.add(business)
        db.commit()
        db.refresh(business)
        log.info("Negocio demo creado: %s", business.name)

    if settings.demo_owner_email and settings.demo_owner_password:
        _validate_seed_password("DEMO_OWNER_PASSWORD", settings.demo_owner_password)
        email = settings.demo_owner_email.strip().lower()
        owner = db.scalar(select(User).where(User.email == email))
        if not owner:
            db.add(
                User(
                    business_id=business.id,
                    email=email,
                    full_name="Due?o Barber?a Porras",
                    password_hash=hash_password(settings.demo_owner_password),
                    role="owner",
                )
            )
            db.commit()
            log.info("Owner demo creado.")
