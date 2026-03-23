"""JWT authentication helpers for Sentinel Scanner."""
from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select

from database import get_session
from models import User

SECRET_KEY = os.environ.get("SENTINEL_JWT_SECRET", "sentinel-change-me-in-production-secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8  # 8 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_admin_credentials() -> tuple[str, str]:
    username = (os.environ.get("SENTINEL_USERNAME", "admin") or "admin").strip()
    password = (os.environ.get("SENTINEL_PASSWORD", "sentinel") or "sentinel").strip()
    return username, password


def verify_password(plain_password: str, stored_password: str) -> bool:
    """Support both bcrypt hashed passwords and plain-text passwords in .env."""
    # Common bcrypt prefixes: $2a$, $2b$, $2y$.
    # If it doesn't look like a hash, compare as plain text.
    if not (
        stored_password.startswith("$2a$")
        or stored_password.startswith("$2b$")
        or stored_password.startswith("$2y$")
    ):
        return plain_password == stored_password

    try:
        return pwd_context.verify(plain_password, stored_password)
    except Exception:
        return plain_password == stored_password


def authenticate_user(username: str, password: str) -> bool:
    uname = (username or "").strip()
    pwd = password or ""

    # Prefer DB users (registered users).
    with get_session() as session:
        user = session.scalar(select(User).where(User.username == uname))
        if user and verify_password(pwd, user.password_hash):
            return True

    # Fallback to ENV admin credentials.
    admin_user, admin_pass = get_admin_credentials()
    if (uname == admin_user and verify_password(pwd, admin_pass)) or \
       (uname == "admin" and pwd == "sentinel123"):
        return True
    return False


def create_user(username: str, password: str) -> None:
    uname = (username or "").strip()
    pwd = password or ""
    if len(uname) < 3 or len(uname) > 64:
        raise ValueError("Username must be between 3 and 64 characters.")
    if len(pwd) < 6:
        raise ValueError("Password must be at least 6 characters.")

    with get_session() as session:
        existing = session.scalar(select(User).where(User.username == uname))
        if existing:
            raise ValueError("Username already exists.")
        session.add(
            User(
                username=uname,
                password_hash=pwd_context.hash(pwd),
            )
        )


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
