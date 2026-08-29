from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base
from .base import uid, utcnow


class Business(Base):
    __tablename__ = "businesses"
    __table_args__ = (UniqueConstraint("slug", name="uq_business_slug"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    
    # Program configuration
    program_type: Mapped[str] = mapped_column(String(20), default="stamps", nullable=False)  # stamps | points | hybrid
    reward_name: Mapped[str] = mapped_column(String(120), default="Premio", nullable=False)
    stamps_required: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    
    # Points program configuration
    points_ratio: Mapped[float] = mapped_column(Float, default=10.0, nullable=False)  # e.g., 1000 spend = 10 pts
    points_currency_symbol: Mapped[str] = mapped_column(String(10), default="?", nullable=False)
    
    # Branding
    primary_color: Mapped[str] = mapped_column(String(20), default="#0EA5FF", nullable=False)
    logo_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    welcome_message: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    users: Mapped[list["User"]] = relationship("User", back_populates="business", cascade="all, delete-orphan")
    customers: Mapped[list["Customer"]] = relationship("Customer", back_populates="business", cascade="all, delete-orphan")
    rewards: Mapped[list["Reward"]] = relationship("Reward", back_populates="business", cascade="all, delete-orphan")
