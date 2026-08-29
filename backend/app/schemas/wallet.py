from pydantic import BaseModel, Field, field_validator


class PushKeysIn(BaseModel):
    p256dh: str = Field(min_length=16, max_length=255)
    auth: str = Field(min_length=8, max_length=255)


class PushSubscriptionIn(BaseModel):
    endpoint: str = Field(min_length=20, max_length=2048)
    keys: PushKeysIn

    @field_validator("endpoint")
    @classmethod
    def https_endpoint(cls, value: str) -> str:
        value = value.strip()
        if not value.startswith("https://"):
            raise ValueError("El endpoint push debe usar HTTPS.")
        return value


class PushUnsubscribeIn(BaseModel):
    endpoint: str = Field(min_length=20, max_length=2048)

    @field_validator("endpoint")
    @classmethod
    def https_endpoint(cls, value: str) -> str:
        value = value.strip()
        if not value.startswith("https://"):
            raise ValueError("El endpoint push debe usar HTTPS.")
        return value
