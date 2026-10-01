"""App settings, read from environment variables (or backend/.env locally)."""

from functools import lru_cache
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: Literal["development", "production", "test"] = "development"
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db: str = "saran_demo"
    secret_key: str
    otp_mode: Literal["demo", "sms"] = "demo"
    cookie_secure: bool = False
    cors_origins: str = ""
    trust_proxy: bool = False  # true only when running behind a hosting proxy/load balancer

    # Session and OTP rules
    session_days: int = 7
    otp_length: int = 6
    otp_ttl_seconds: int = 300  # code valid for 5 minutes
    otp_max_attempts: int = 5  # wrong guesses before the code is thrown away
    otp_resend_seconds: int = 30  # minimum gap between two codes for the same number
    otp_per_phone_per_10min: int = 3
    otp_per_ip_per_hour: int = 20
    otp_verify_per_ip_per_hour: int = 60  # code checks (right or wrong) from one IP
    bcrypt_rounds: int = 12  # password hashing cost; tests lower it for speed

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @model_validator(mode="after")
    def check_safe_for_production(self):
        if len(self.secret_key) < 32 or self.secret_key == "change-me":
            raise ValueError("SECRET_KEY must be a random string of at least 32 characters")
        if self.app_env == "production":
            if not self.cookie_secure:
                raise ValueError("COOKIE_SECURE must be true in production")
            if self.otp_mode == "demo":
                raise ValueError("OTP_MODE=demo is not allowed in production")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
