import re
from typing import Generic, TypeVar
from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


def normalize_email(value: str) -> str:
    return value.strip().lower()


def validate_strong_password(value: str) -> str:
    if len(value) < 12:
        raise ValueError("La contrase?a debe tener al menos 12 caracteres.")
    checks = [
        re.search(r"[a-z]", value),
        re.search(r"[A-Z]", value),
        re.search(r"\d", value),
        re.search(r"[^A-Za-z0-9]", value),
    ]
    if not all(checks):
        raise ValueError("Us? may?scula, min?scula, n?mero y s?mbolo.")
    return value


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class ApiMessage(BaseModel):
    ok: bool = True
    message: str
