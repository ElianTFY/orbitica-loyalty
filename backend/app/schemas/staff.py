from pydantic import BaseModel, EmailStr, Field, field_validator
from .common import normalize_email, validate_strong_password
from .auth import UserOut


class StaffCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=12, max_length=200)
    role: str = Field(default="staff", pattern=r"^(staff|manager)$")

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
