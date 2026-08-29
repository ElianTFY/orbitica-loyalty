import secrets
import string
from datetime import datetime, timezone
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..core.exceptions import ConflictException, NotFoundException, ValidationException
from ..core.rate_limit import limiter
from ..models import Business, Customer, LoyaltyTransaction, User
from ..schemas.common import PaginatedResponse
from ..schemas.customer import CustomerCreate, CustomerDetailOut, CustomerOut, PublicJoinIn, PublicJoinOut
from ..schemas.loyalty import TransactionOut


def make_card_code() -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(10))


def normalize_phone(phone: str) -> str:
    raw = phone.strip()
    leading_plus = raw.startswith("+")
    digits = "".join(ch for ch in raw if ch.isdigit())
    return ("+" if leading_plus else "") + digits


class CustomerService:
    @staticmethod
    def get_scoped(db: Session, business_id: str, customer_id: str, lock: bool = False) -> Customer:
        stmt = select(Customer).where(Customer.id == customer_id, Customer.business_id == business_id)
        if lock:
            stmt = stmt.with_for_update()
        customer = db.scalar(stmt)
        if not customer:
            raise NotFoundException("Cliente no encontrado.")
        return customer

    @staticmethod
    def list_paginated(
        db: Session, business_id: str, query: str | None = None, page: int = 1, page_size: int = 20
    ) -> PaginatedResponse[CustomerOut]:
        stmt = select(Customer).where(Customer.business_id == business_id)
        if query and query.strip():
            term = f"%{query.strip()}%"
            stmt = stmt.where(
                Customer.name.ilike(term)
                | Customer.phone.ilike(term)
                | Customer.card_code.ilike(term)
            )

        total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        total_pages = max(1, (total + page_size - 1) // page_size)
        offset = (page - 1) * page_size

        items = list(
            db.scalars(
                stmt.order_by(Customer.created_at.desc()).offset(offset).limit(page_size)
            ).all()
        )
        return PaginatedResponse(
            items=[CustomerOut.model_validate(c) for c in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    @staticmethod
    def get_detail(db: Session, business: Business, customer_id: str) -> CustomerDetailOut:
        customer = CustomerService.get_scoped(db, business.id, customer_id)
        rows = db.execute(
            select(LoyaltyTransaction, User.full_name)
            .outerjoin(User, User.id == LoyaltyTransaction.actor_user_id)
            .where(LoyaltyTransaction.customer_id == customer.id)
            .order_by(LoyaltyTransaction.created_at.desc())
            .limit(100)
        ).all()

        txs = [
            TransactionOut(
                id=tx.id,
                type=tx.type,
                amount=tx.amount,
                note=tx.note,
                created_at=tx.created_at,
                actor_name=actor_name,
            )
            for tx, actor_name in rows
        ]
        data = CustomerOut.model_validate(customer).model_dump()
        return CustomerDetailOut(**data, transactions=txs)

    @staticmethod
    def create_admin(db: Session, business_id: str, payload: CustomerCreate) -> Customer:
        phone = normalize_phone(payload.phone)
        existing = db.scalar(
            select(Customer).where(Customer.business_id == business_id, Customer.phone == phone)
        )
        if existing:
            return existing

        for _ in range(4):
            customer = Customer(
                business_id=business_id,
                name=payload.name.strip(),
                phone=phone,
                email=str(payload.email).lower() if payload.email else None,
                card_code=make_card_code(),
                public_token=secrets.token_urlsafe(32),
            )
            db.add(customer)
            try:
                db.commit()
                db.refresh(customer)
                return customer
            except IntegrityError:
                db.rollback()
        raise ConflictException("No se pudo crear el cliente.")

    @staticmethod
    def public_join(
        db: Session, slug: str, payload: PublicJoinIn, client_ip: str, phone_key: str
    ) -> PublicJoinOut:
        limiter.check("join-global", limit=600, window_seconds=60)
        limiter.check(f"join-ip:{client_ip}", limit=12, window_seconds=10 * 60)

        business = db.scalar(select(Business).where(Business.slug == slug, Business.active.is_(True)))
        if not business:
            raise NotFoundException("Negocio no encontrado.")

        phone = normalize_phone(payload.phone)
        if len(phone.replace("+", "")) < 6:
            raise ValidationException("Tel?fono inv?lido.")

        limiter.check(f"join-phone:{business.id}:{phone_key}", limit=4, window_seconds=60 * 60)

        customer = db.scalar(select(Customer).where(Customer.business_id == business.id, Customer.phone == phone))
        if customer:
            raise ConflictException(
                "Ya existe una tarjeta con ese tel?fono. Abrila desde el dispositivo donde la guardaste o ped? ayuda al negocio."
            )

        for _ in range(4):
            customer = Customer(
                business_id=business.id,
                name=payload.name.strip(),
                phone=phone,
                email=str(payload.email).lower() if payload.email else None,
                card_code=make_card_code(),
                public_token=secrets.token_urlsafe(32),
            )
            db.add(customer)
            try:
                db.commit()
                db.refresh(customer)
                return PublicJoinOut(public_token=customer.public_token, card_code=customer.card_code)
            except IntegrityError:
                db.rollback()
                existing = db.scalar(
                    select(Customer).where(Customer.business_id == business.id, Customer.phone == phone)
                )
                if existing:
                    raise ConflictException("Ya existe una tarjeta con ese tel?fono.")

        raise ConflictException("No se pudo crear la tarjeta. Intent? nuevamente.")

    @staticmethod
    def rotate_token(db: Session, business_id: str, customer_id: str) -> Customer:
        customer = CustomerService.get_scoped(db, business_id, customer_id, lock=True)
        customer.public_token = secrets.token_urlsafe(32)
        customer.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(customer)
        return customer
