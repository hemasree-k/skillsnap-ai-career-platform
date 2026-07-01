import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.engine import URL
import psycopg2
from dotenv import load_dotenv

# Load env variables from parent folder or current path
load_dotenv()

DATABASE_URL_STR = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/skillsnap")

# Helper function to ensure database exists before connecting SQLAlchemy
def ensure_database_exists(db_url_str: str):
    try:
        # Parse connection details from the URL
        # For simplicity, we can do it via psycopg2 using parts
        # If database creation fails, we fall back to SQLite or just log it
        if "sqlite" in db_url_str:
            return
            
        # Parse database name from URL
        # E.g. postgresql://postgres:postgres@localhost:5432/skillsnap
        db_name = db_url_str.split("/")[-1].split("?")[0]
        base_url = db_url_str.rsplit("/", 1)[0] + "/postgres"
        
        # Connect to default postgres DB first to check and create target DB
        print(f"Checking if database '{db_name}' exists...")
        conn = psycopg2.connect(
            host=db_url_str.split("@")[-1].split(":")[0].split("/")[0],
            port=db_url_str.split("@")[-1].split(":")[1].split("/")[0] if ":" in db_url_str.split("@")[-1].split("/")[0] else 5432,
            user=db_url_str.split("//")[-1].split(":")[0],
            password=db_url_str.split("//")[-1].split(":")[1].split("@")[0] if ":" in db_url_str.split("//")[-1] else "",
            dbname="postgres"
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        # Check if database exists
        cur.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s;", (db_name,))
        exists = cur.fetchone()
        
        if not exists:
            print(f"Database '{db_name}' does not exist. Creating...")
            cur.execute(f"CREATE DATABASE {db_name};")
            print(f"Database '{db_name}' successfully created.")
        else:
            print(f"Database '{db_name}' already exists.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Warning: Failed to ensure database exists: {e}. Attempting standard connection...")

# Call database check
ensure_database_exists(DATABASE_URL_STR)

engine = create_engine(DATABASE_URL_STR)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def run_migrations():
    try:
        print("Running PostgreSQL safe schema migrations...")
        with engine.begin() as conn:
            # Check and add columns dynamically
            conn.execute(text("ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS bio TEXT;"))
            conn.execute(text("ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS contact JSON;"))
            conn.execute(text("ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS portfolio_score INTEGER DEFAULT 70;"))
            conn.execute(text("ALTER TABLE resumes ADD COLUMN IF NOT EXISTS interview_readiness INTEGER DEFAULT 0;"))
            print("Schema migrations completed successfully.")
    except Exception as e:
        print(f"Warning: Safe migrations check skipped or encountered error (e.g., SQLite or tables not created yet): {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

