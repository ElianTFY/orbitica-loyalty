from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Orbítica Loyalty API"
    app_env: str = "development"
    database_url: str = "sqlite:///./orbitica.db"

    jwt_secret: str = "dev-only"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 8
    jwt_issuer: str = "orbitica-loyalty"
    jwt_audience: str = "orbitica-loyalty-web"

    # Shared only between the Next.js BFF and FastAPI. Never expose it to the browser.
    bff_shared_secret: str = ""
    public_web_url: str = "http://localhost:3000"

    # Login protection
    login_max_failures: int = 5
    login_lock_minutes: int = 15

    seed_demo: bool = True
    bootstrap_superadmin_email: str = ""
    bootstrap_superadmin_password: str = ""
    demo_business_name: str = "Barbería Porras"
    demo_business_slug: str = "porras"
    demo_owner_email: str = ""
    demo_owner_password: str = ""

    # Apple Wallet. Credentials stay server-side in Render only.
    apple_wallet_enabled: bool = False
    apple_pass_type_identifier: str = ""
    apple_team_identifier: str = ""
    apple_pass_p12_base64: str = ""
    apple_pass_p12_password: str = ""
    apple_wwdr_cert_base64: str = ""

    # Google Wallet. Store the downloaded service-account JSON as base64.
    google_wallet_enabled: bool = False
    google_wallet_issuer_id: str = ""
    google_wallet_service_account_json_base64: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if value.startswith("postgres://"):
            return "postgresql+psycopg://" + value[len("postgres://"):]
        if value.startswith("postgresql://") and "+psycopg" not in value:
            return "postgresql+psycopg://" + value[len("postgresql://"):]
        return value

    @property
    def production(self) -> bool:
        return self.app_env.lower() == "production"

    @property
    def apple_wallet_configured(self) -> bool:
        return bool(
            self.apple_wallet_enabled
            and self.apple_pass_type_identifier
            and self.apple_team_identifier
            and self.apple_pass_p12_base64
            and self.apple_wwdr_cert_base64
        )

    @property
    def google_wallet_configured(self) -> bool:
        return bool(
            self.google_wallet_enabled
            and self.google_wallet_issuer_id
            and self.google_wallet_service_account_json_base64
        )

    def validate_runtime(self) -> None:
        if not self.production:
            return
        if len(self.jwt_secret) < 32:
            raise RuntimeError("JWT_SECRET debe tener al menos 32 caracteres en producción.")
        if len(self.bff_shared_secret) < 32:
            raise RuntimeError("BFF_SHARED_SECRET debe tener al menos 32 caracteres en producción.")
        if self.apple_wallet_enabled and not self.apple_wallet_configured:
            raise RuntimeError("Apple Wallet está habilitado pero faltan credenciales.")
        if self.google_wallet_enabled and not self.google_wallet_configured:
            raise RuntimeError("Google Wallet está habilitado pero faltan credenciales.")


settings = Settings()
