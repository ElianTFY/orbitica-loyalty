from pydantic import BaseModel, EmailStr, Field, field_validator
from .common import normalize_email, validate_strong_password
from .business import BusinessOut
from .auth import UserOut


class SuperBusinessCreate(BaseModel):
    business_name: str = Field(min_length=2, max_length=120)
    slug: str = Field(min_length=2, max_length=80, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    program_type: str = Field(default="stamps", pattern=r"^(stamps|points|hybrid)$")
    reward_name: str = Field(default="Premio", min_length=2, max_length=120)
    stamps_required: int = Field(default=10, ge=2, le=50)
    points_ratio: float = Field(default=10.0, ge=0.1, le=1000.0)
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
