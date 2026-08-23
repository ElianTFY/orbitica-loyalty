from datetime import datetime
import re

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


def normalize_email(value: str) -> str:
    return value.strip().lower()


def validate_strong_password(value: str) -> str:
    if len(value) < 12:
        raise ValueError("La contraseña debe tener al menos 12 caracteres.")
    checks = [
        re.search(r"[a-z]", value),
        re.search(r"[A-Z]", value),
        re.search(r"\d", value),
        re.search(r"[^A-Za-z0-9]", value),
    ]
    if not all(checks):
        raise ValueError("Usá mayúscula, minúscula, número y símbolo.")
    return value


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class PublicBusinessOut(ORMModel):
    name: str
    slug: str
    reward_name: str
    stamps_required: int
    primary_color: str


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
    rewards_redeemed: int
    card_code: str
    updated_at: datetime


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=200)

    @field_validator("email")
    @classmethod
    def lower_email(cls, value: EmailStr) -> str:
        return normalize_email(str(value))


class ChangePasswordIn(BaseModel):
    current_password: str = Field(min_length=8, max_length=200)
    new_password: str = Field(min_length=12, max_length=200)

    @field_validator("new_password")
    @classmethod
    def strong_new_password(cls, value: str) -> str:
        return validate_strong_password(value)


class UserOut(ORMModel):
    id: str
    business_id: str | None
    email: EmailStr
    full_name: str
    role: str
    active: bool
    created_at: datetime


class LoginOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut


class BusinessOut(ORMModel):
    id: str
    name: str
    slug: str
    reward_name: str
    stamps_required: int
    primary_color: str
    active: bool
    created_at: datetime


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
    rewards_redeemed: int
    active: bool
    created_at: datetime
    updated_at: datetime


class StampIn(BaseModel):
    amount: int = Field(default=1, ge=1, le=10)
    note: str | None = Field(default=None, max_length=255)


class TransactionOut(BaseModel):
    id: str
    type: str
    amount: int
    note: str | None
    created_at: datetime
    actor_name: str | None = None


class CustomerDetailOut(CustomerOut):
    transactions: list[TransactionOut] = []


class BusinessSettingsIn(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    reward_name: str | None = Field(default=None, min_length=2, max_length=120)
    stamps_required: int | None = Field(default=None, ge=2, le=50)
    primary_color: str | None = Field(default=None, pattern=r"^#[0-9A-Fa-f]{6}$")


class StaffCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=12, max_length=200)

    @field_validator("email")
    @classmethod
    def lower_email(cls, value: EmailStr) -> str:
        return normalize_email(str(value))

    @field_validator("password")
    @classmethod
    def strong_password(cls, value: str) -> str:
        return validate_strong_password(value)


class StaffOut(UserOut):
    pass


class DashboardActivity(BaseModel):
    id: str
    type: str
    amount: int
    created_at: datetime
    customer_name: str
    actor_name: str | None


class DashboardOut(BaseModel):
    business: BusinessOut
    customers: int
    active_cards: int
    stamps_awarded: int
    rewards_redeemed: int
    new_customers_month: int
    recent_activity: list[DashboardActivity]


class SuperBusinessCreate(BaseModel):
    business_name: str = Field(min_length=2, max_length=120)
    slug: str = Field(min_length=2, max_length=80, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    reward_name: str = Field(default="Premio", min_length=2, max_length=120)
    stamps_required: int = Field(default=10, ge=2, le=50)
    owner_name: str = Field(min_length=2, max_length=120)
    owner_email: EmailStr
    owner_password: str = Field(min_length=12, max_length=200)

    @field_validator("owner_email")
    @classmethod
    def lower_owner_email(cls, value: EmailStr) -> str:
        return normalize_email(str(value))

    @field_validator("owner_password")
    @classmethod
    def strong_owner_password(cls, value: str) -> str:
        return validate_strong_password(value)


class SuperBusinessOut(BaseModel):
    business: BusinessOut
    owner: UserOut
