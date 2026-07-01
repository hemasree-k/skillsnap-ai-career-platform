from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from ..models.database import get_db
from ..models.resume import Resume, LinkedInProfile
from ..integrations.linkedin_integration import LinkedInIntegration
from ..services.gemini_service import GeminiService

router = APIRouter(prefix="/api/linkedin", tags=["linkedin"])

class LinkedInConnectRequest(BaseModel):
    profile_url: Optional[str] = ""
    profile_text: Optional[str] = ""
    resume_id: Optional[int] = None

@router.post("/connect")
def connect_linkedin(req: LinkedInConnectRequest, db: Session = Depends(get_db)):
    try:
        # Validate and format input
        processed = LinkedInIntegration.process_profile_input(req.profile_url, req.profile_text)
        
        # Analyze using Gemini Service
        analysis = GeminiService.analyze_linkedin_profile(processed)
        
        # Resolve resume_id (if not provided, find the latest uploaded resume)
        resume_id = req.resume_id
        if not resume_id:
            latest_resume = db.query(Resume).order_by(Resume.created_at.desc()).first()
            if latest_resume:
                resume_id = latest_resume.id
                
        # Persist profile to DB
        profile = None
        if resume_id:
            profile = db.query(LinkedInProfile).filter(LinkedInProfile.resume_id == resume_id).first()
            
        if not profile:
            profile = LinkedInProfile(resume_id=resume_id)
            db.add(profile)
            
        profile.profile_url = processed["profile_url"]
        profile.profile_strength = analysis.get("profile_strength", 70)
        profile.missing_sections = analysis.get("missing_sections", [])
        profile.suggested_improvements = analysis.get("suggested_improvements", [])
        profile.recruiter_readiness = analysis.get("recruiter_readiness", 70)
        
        db.commit()
        db.refresh(profile)
        
        return {
            "success": True,
            "profile_url": profile.profile_url,
            "profile_strength": profile.profile_strength,
            "missing_sections": profile.missing_sections,
            "suggested_improvements": profile.suggested_improvements,
            "recruiter_readiness": profile.recruiter_readiness,
            "resume_id": profile.resume_id
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error in connect_linkedin: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to connect LinkedIn: {str(e)}")

@router.get("/profile")
def get_linkedin_profile(resume_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    # If no resume_id provided, fetch the latest connected profile
    if not resume_id:
        profile = db.query(LinkedInProfile).order_by(LinkedInProfile.created_at.desc()).first()
    else:
        profile = db.query(LinkedInProfile).filter(LinkedInProfile.resume_id == resume_id).first()
        
    if not profile:
        raise HTTPException(status_code=404, detail="LinkedIn profile connection not found.")
        
    return {
        "profile_url": profile.profile_url,
        "profile_strength": profile.profile_strength,
        "missing_sections": profile.missing_sections,
        "suggested_improvements": profile.suggested_improvements,
        "recruiter_readiness": profile.recruiter_readiness,
        "resume_id": profile.resume_id
    }
