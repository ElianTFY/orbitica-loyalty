from datetime import datetime
from pydantic import BaseModel, Field
from .common import ORMModel
from .customer import CustomerOut
from .business import BusinessOut


class RewardCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    stamps_required: int | None = Field(default=None, ge=1, le=100)
    points_required: int | None = Field(default=None, ge=1, le=100000)
    stock: int | None = Field(default=None, ge=0)
    expires_at: datetime | None = None


class RewardUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    stamps_required: int | None = Field(default=None, ge=1, le=100)
    points_required: int | None = Field(default=None, ge=1, le=100000)
    stock: int | None = Field(default=None, ge=0)
    active: bool | None = None
    expires_at: datetime | None = None


class RewardOut(ORMModel):
    id: str
    business_id: str
    name: str
    description: str | None
    stamps_required: int | None
    points_required: int | None
    stock: int | None
    active: bool
    expires_at: datetime | None
    created_at: datetime


class StampIn(BaseModel):
    amount: int = Field(default=1, ge=1, le=20)
    note: str | None = Field(default=None, max_length=255)


class PointsIn(BaseModel):
    amount: int = Field(ge=1, le=100000)
    spend_amount: float | None = Field(default=None, ge=0)
    note: str | None = Field(default=None, max_length=255)


class RedeemIn(BaseModel):
    reward_id: str | None = None
    note: str | None = Field(default=None, max_length=255)


class TransactionOut(BaseModel):
    id: str
    type: str
    amount: int
    note: str | None
    created_at: datetime
    actor_name: str | None = None
    reward_name: str | None = None


class CustomerDetailOut(CustomerOut):
    transactions: list[TransactionOut] = []


class DashboardActivity(BaseModel):
    id: str
    type: str
    amount: int
    created_at: datetime
    customer_name: str
    actor_name: str | None
    note: str | None = None


class DashboardOut(BaseModel):
    business: BusinessOut
    customers: int
    active_cards: int
    stamps_awarded: int
    points_awarded: int
    rewards_redeemed: int
    new_customers_month: int
    recent_activity: list[DashboardActivity]
