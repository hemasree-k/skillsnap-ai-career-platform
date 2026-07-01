import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from .models.database import engine, Base, run_migrations
from .routes.resume import router as resume_router
from .routes.github import router as github_router
from .routes.linkedin import router as linkedin_router
from .routes.roadmap import router as roadmap_router

# Create DB tables if they don't exist
try:
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized successfully.")
    # Run safe raw migrations to add new columns to existing tables
    run_migrations()
except Exception as e:
    print(f"Error initializing database tables: {e}")

app = FastAPI(
    title="SkillSnap AI Backend",
    description="FastAPI Backend for career analysis, recruiter readiness, portfolio generation and interview questions.",
    version="1.0.0"
)

# CORS configuration
# Allowing all origins for simple, painless integration with frontend local servers (Nitro, Vite, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(resume_router)
app.include_router(github_router)
app.include_router(linkedin_router)
app.include_router(roadmap_router)


@app.get("/")
def read_root():
    return {"message": "SkillSnap API is running successfully."}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"Starting server on {host}:{port}...")
    uvicorn.run("backend.main:app", host=host, port=port, reload=True)
