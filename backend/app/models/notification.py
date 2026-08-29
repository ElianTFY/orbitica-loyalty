from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base
from .base import uid, utcnow


class WebPushSubscription(Base):
    __tablename__ = "web_push_subscriptions"
    __table_args__ = (
        UniqueConstraint("endpoint_hash", name="uq_web_push_endpoint_hash"),
        Index("ix_web_push_customer_active", "customer_id", "active"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    customer_id: Mapped[str] = mapped_column(
        ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    endpoint_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    endpoint: Mapped[str] = mapped_column(Text, nullable=False)
    p256dh: Mapped[str] = mapped_column(String(255), nullable=False)
    auth: Mapped[str] = mapped_column(String(255), nullable=False)
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    customer: Mapped["Customer"] = relationship("Customer", back_populates="web_push_subscriptions")


class AppleWalletRegistration(Base):
    __tablename__ = "apple_wallet_registrations"
    __table_args__ = (
        UniqueConstraint("customer_id", "device_library_identifier", name="uq_apple_wallet_customer_device"),
        Index("ix_apple_wallet_device", "device_library_identifier"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    customer_id: Mapped[str] = mapped_column(
        ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    device_library_identifier: Mapped[str] = mapped_column(String(255), nullable=False)
    push_token: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    customer: Mapped["Customer"] = relationship("Customer", back_populates="apple_wallet_registrations")
