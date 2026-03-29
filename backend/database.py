from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Primary attempt PostgreSQL database, fallback to Local sqlite
POSTGRES_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/flushion_db")

try:
    engine = create_engine(POSTGRES_URL)
    # FORCE the database connection check
    connection = engine.connect()
    connection.close()
    print("PostgreSQL Prompt Learning Database connected successfully.")
except Exception as e:
    print(f"Warning: PostgreSQL prompt-learning connection failed. Ensure pg_ctl is running. Fallback to SQLite. Error: {e}")
    engine = create_engine("sqlite:///./fallback.db", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
