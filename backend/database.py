from __future__ import annotations

import os
from contextlib import contextmanager
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, declarative_base, sessionmaker

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DB = f"sqlite:///{BASE_DIR / 'scans.db'}"
DATABASE_URL = os.environ.get("DATABASE_URL", DEFAULT_DB)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def migrate_sqlite() -> None:
    """Add columns to existing SQLite DBs (create_all only adds new tables)."""
    if not DATABASE_URL.startswith("sqlite"):
        return
    with engine.connect() as conn:
        chk = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='scans'"),
        )
        if not chk.fetchone():
            return
        r = conn.execute(text("PRAGMA table_info(scans)"))
        existing = {row[1] for row in r.fetchall()}
        alters = []
        if "modules_json" not in existing:
            alters.append("ALTER TABLE scans ADD COLUMN modules_json TEXT")
        if "consent_at" not in existing:
            alters.append("ALTER TABLE scans ADD COLUMN consent_at TIMESTAMP")
        if "consent_ip" not in existing:
            alters.append("ALTER TABLE scans ADD COLUMN consent_ip VARCHAR(64)")
        for stmt in alters:
            conn.execute(text(stmt))
        conn.commit()


def init_db() -> None:
    from models import Finding, Scan, ScheduledScan  # noqa: F401

    Base.metadata.create_all(bind=engine)
    migrate_sqlite()


@contextmanager
def get_session() -> Session:
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
