from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator
from .common import ORMModel
from .business import PublicBusinessOut


class CustomerCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=6, max_length=40)
    email: EmailStr | None = None

    @field_validator("name", "phone")
    @classmethod
    def strip_fields(cls, value: str) -> str:
        return value.strip()


class CustomerOut(ORMModel):
    id: str
    name: str
    phone: str
    email: EmailStr | None
    card_code: str
    public_token: str
    stamp_balance: int
    point_balance: int
    total_visits: int
    rewards_redeemed: int
    last_visit_at: datetime | None
    active: bool
    created_at: datetime
    updated_at: datetime


class PublicJoinIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=6, max_length=40)
    email: EmailStr | None = None

    @field_validator("name", "phone")
    @classmethod
    def strip_fields(cls, value: str) -> str:
        return value.strip()


class PublicJoinOut(ORMModel):
    public_token: str
    card_code: str


class PublicCardOut(BaseModel):
    business: PublicBusinessOut
    customer_name: str
    stamp_balance: int
    point_balance: int
    total_visits: int
    rewards_redeemed: int
    card_code: str
    updated_at: datetime
