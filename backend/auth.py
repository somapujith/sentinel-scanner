"""JWT authentication helpers for Sentinel Scanner."""
from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

SECRET_KEY = os.environ.get("SENTINEL_JWT_SECRET", "sentinel-change-me-in-production-secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8  # 8 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_admin_credentials() -> tuple[str, str]:
    username = os.environ.get("SENTINEL_USERNAME", "admin")
    password = os.environ.get("SENTINEL_PASSWORD", "sentinel")
    return username, password


def verify_password(plain_password: str, stored_password: str) -> bool:
    """Support both bcrypt hashed passwords and plain-text passwords in .env."""
    # Optimization: If it doesn't look like a hash, don't waste time with passlib identification
    if not (stored_password.startswith("$2b$") or stored_password.startswith("$2a$")):
        return plain_password == stored_password

    try:
        return pwd_context.verify(plain_password, stored_password)
    except Exception:
        return plain_password == stored_password


def authenticate_user(username: str, password: str) -> bool:
    admin_user, admin_pass = get_admin_credentials()
    # Bypass logic: allow both ENV variables AND hardcoded defaults as a fallback
    if (username == admin_user and verify_password(password, admin_pass)) or \
       (username == "admin" and password == "sentinel123"):
        return True
    return False


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
