import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def uid() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Business(Base):
    __tablename__ = "businesses"
    __table_args__ = (UniqueConstraint("slug", name="uq_business_slug"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    reward_name: Mapped[str] = mapped_column(String(120), default="Premio", nullable=False)
    stamps_required: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    primary_color: Mapped[str] = mapped_column(String(20), default="#2b76ff", nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    users: Mapped[list["User"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    customers: Mapped[list["Customer"]] = relationship(back_populates="business", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("email", name="uq_user_email"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    business_id: Mapped[str | None] = mapped_column(
        ForeignKey("businesses.id", ondelete="CASCADE"), nullable=True, index=True
    )
    email: Mapped[str] = mapped_column(String(180), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # superadmin | owner | staff
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    token_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    business: Mapped[Business | None] = relationship(back_populates="users")
    transactions: Mapped[list["LoyaltyTransaction"]] = relationship(back_populates="actor")


class Customer(Base):
    __tablename__ = "customers"
    __table_args__ = (
        UniqueConstraint("business_id", "phone", name="uq_business_phone"),
        UniqueConstraint("card_code", name="uq_customer_card_code"),
        UniqueConstraint("public_token", name="uq_customer_public_token"),
        Index("ix_customers_business_created", "business_id", "created_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    business_id: Mapped[str] = mapped_column(
        ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str] = mapped_column(String(40), nullable=False)
    email: Mapped[str | None] = mapped_column(String(180), nullable=True)
    card_code: Mapped[str] = mapped_column(String(16), unique=True, index=True, nullable=False)
    public_token: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    stamp_balance: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    rewards_redeemed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    business: Mapped[Business] = relationship(back_populates="customers")
    transactions: Mapped[list["LoyaltyTransaction"]] = relationship(
        back_populates="customer", cascade="all, delete-orphan"
    )


class LoyaltyTransaction(Base):
    __tablename__ = "loyalty_transactions"
    __table_args__ = (Index("ix_transactions_business_created", "business_id", "created_at"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    business_id: Mapped[str] = mapped_column(
        ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True
    )
    customer_id: Mapped[str] = mapped_column(
        ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    actor_user_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # stamp | redeem | adjustment
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    note: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    customer: Mapped[Customer] = relationship(back_populates="transactions")
    actor: Mapped[User | None] = relationship(back_populates="transactions")
