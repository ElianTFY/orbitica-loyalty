from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import settings


class Base(DeclarativeBase):
    pass


is_sqlite = settings.database_url.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

engine_kwargs = {
    "pool_pre_ping": True,
    "connect_args": connect_args,
}
if not is_sqlite:
    # Small, bounded pool: fast enough for the Starter service without exhausting
    # Postgres connections as worker count grows.
    engine_kwargs.update(pool_size=5, max_overflow=5, pool_recycle=1800)

engine = create_engine(settings.database_url, **engine_kwargs)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
