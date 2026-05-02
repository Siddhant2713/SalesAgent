from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},  # Required for SQLite only
    pool_pre_ping=True,                          # Detect stale connections
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()  # Always runs — even on exception
