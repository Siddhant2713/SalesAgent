from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import settings

# Build engine args — PostgreSQL and SQLite need different configs
_is_sqlite = settings.database_url.startswith("sqlite")

if _is_sqlite:
    engine = create_engine(
        settings.database_url,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True,
    )
else:
    engine = create_engine(
        settings.database_url,
        pool_pre_ping=True,       # Detects and discards stale connections
        pool_size=2,              # 2 persistent connections per instance
        max_overflow=3,           # Up to 3 extra on demand
        pool_timeout=30,          # Wait up to 30s for a connection
        pool_recycle=1800,        # Recycle connections every 30 minutes
    )
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()  # Always runs — even on exception
