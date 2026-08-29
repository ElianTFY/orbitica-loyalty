from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator
from .common import ORMModel, normalize_email, validate_strong_password


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
