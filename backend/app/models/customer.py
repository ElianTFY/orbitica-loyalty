from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base
from .base import uid, utcnow


class Customer(Base):
    __tablename__ = "customers"
    __table_args__ = (
        UniqueConstraint("business_id", "phone", name="uq_business_phone"),
        UniqueConstraint("card_code", name="uq_customer_card_code"),
        UniqueConstraint("public_token", name="uq_customer_public_token"),
        Index("ix_customers_business_created", "business_id", "created_at"),
        Index("ix_customers_business_search", "business_id", "name", "phone"),
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
    
    # Loyalty balances
    stamp_balance: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    point_balance: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_visits: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    rewards_redeemed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    last_visit_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    business: Mapped["Business"] = relationship("Business", back_populates="customers")
    transactions: Mapped[list["LoyaltyTransaction"]] = relationship(
        "LoyaltyTransaction", back_populates="customer", cascade="all, delete-orphan"
    )
    web_push_subscriptions: Mapped[list["WebPushSubscription"]] = relationship(
        "WebPushSubscription", back_populates="customer", cascade="all, delete-orphan"
    )
    apple_wallet_registrations: Mapped[list["AppleWalletRegistration"]] = relationship(
        "AppleWalletRegistration", back_populates="customer", cascade="all, delete-orphan"
    )
