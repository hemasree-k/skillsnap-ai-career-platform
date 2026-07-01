from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from ..models.database import get_db
from ..models.resume import Resume, GitHubProfile
from ..integrations.github_integration import GitHubIntegration
from ..services.gemini_service import GeminiService

router = APIRouter(prefix="/api/github", tags=["github"])

class GitHubConnectRequest(BaseModel):
    username: str
    resume_id: Optional[int] = None

@router.post("/connect")
def connect_github(req: GitHubConnectRequest, db: Session = Depends(get_db)):
    username = req.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="Username is required.")
        
    try:
        # Fetch data from GitHub API
        github_data = GitHubIntegration.fetch_user_data(username)
        
        # Analyze using Gemini Service
        analysis = GeminiService.analyze_github_profile(github_data)
        
        # Resolve resume_id (if not provided, find the latest uploaded resume)
        resume_id = req.resume_id
        if not resume_id:
            latest_resume = db.query(Resume).order_by(Resume.created_at.desc()).first()
            if latest_resume:
                resume_id = latest_resume.id
                
        # Persist profile to DB
        profile = None
        if resume_id:
            profile = db.query(GitHubProfile).filter(GitHubProfile.resume_id == resume_id).first()
            
        if not profile:
            profile = GitHubProfile(resume_id=resume_id, username=username)
            db.add(profile)
            
        profile.username = username
        profile.repo_count = analysis.get("repo_count", 0)
        profile.languages = analysis.get("languages", [])
        profile.contribution_estimate = analysis.get("contribution_estimate", "Medium")
        profile.skills = analysis.get("skills", [])
        profile.projects = analysis.get("projects", [])
        profile.developer_score = analysis.get("developer_score", 70)
        
        db.commit()
        db.refresh(profile)
        
        return {
            "success": True,
            "username": profile.username,
            "repo_count": profile.repo_count,
            "languages": profile.languages,
            "contribution_estimate": profile.contribution_estimate,
            "skills": profile.skills,
            "projects": profile.projects,
            "developer_score": profile.developer_score,
            "resume_id": profile.resume_id
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"Error in connect_github: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to connect GitHub: {str(e)}")

@router.get("/{user}")
def get_github_profile(user: str, db: Session = Depends(get_db)):
    profile = db.query(GitHubProfile).filter(GitHubProfile.username == user).first()
    if not profile:
        raise HTTPException(status_code=404, detail="GitHub profile connection not found.")
        
    return {
        "username": profile.username,
        "repo_count": profile.repo_count,
        "languages": profile.languages,
        "contribution_estimate": profile.contribution_estimate,
        "skills": profile.skills,
        "projects": profile.projects,
        "developer_score": profile.developer_score,
        "resume_id": profile.resume_id
    }
