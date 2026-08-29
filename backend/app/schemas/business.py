from datetime import datetime
from pydantic import BaseModel, Field
from .common import ORMModel


class BusinessOut(ORMModel):
    id: str
    name: str
    slug: str
    program_type: str
    reward_name: str
    stamps_required: int
    points_ratio: float
    points_currency_symbol: str
    primary_color: str
    logo_url: str | None
    welcome_message: str | None
    active: bool
    created_at: datetime


class BusinessSettingsIn(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    program_type: str | None = Field(default=None, pattern=r"^(stamps|points|hybrid)$")
    reward_name: str | None = Field(default=None, min_length=2, max_length=120)
    stamps_required: int | None = Field(default=None, ge=2, le=50)
    points_ratio: float | None = Field(default=None, ge=0.1, le=1000.0)
    points_currency_symbol: str | None = Field(default=None, max_length=10)
    primary_color: str | None = Field(default=None, pattern=r"^#[0-9A-Fa-f]{6}$")
    logo_url: str | None = Field(default=None, max_length=255)
    welcome_message: str | None = Field(default=None, max_length=255)


class PublicBusinessOut(ORMModel):
    name: str
    slug: str
    program_type: str
    reward_name: str
    stamps_required: int
    points_ratio: float
    points_currency_symbol: str
    primary_color: str
    logo_url: str | None
    welcome_message: str | None
