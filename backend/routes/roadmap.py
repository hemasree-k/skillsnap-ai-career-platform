from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from models.database import get_db
from models.resume import Resume, WeeklyRoadmap
from services.gemini_service import GeminiService

router = APIRouter(prefix="/api/roadmap", tags=["roadmap"])

class RoadmapRequest(BaseModel):
    resume_id: int
    target_role: Optional[str] = None

@router.post("")
def generate_or_get_roadmap(req: RoadmapRequest, db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == req.resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume details not found.")
        
    # Check if a roadmap already exists in database
    roadmap = db.query(WeeklyRoadmap).filter(WeeklyRoadmap.resume_id == req.resume_id).first()
    if roadmap:
        return {
            "success": True,
            "weekly_data": roadmap.weekly_data,
            "learning_priorities": roadmap.learning_priorities,
            "resume_id": roadmap.resume_id
        }
        
    # If not, let's generate it
    # We can infer target role from Recruiter Readiness model if not passed in request
    target_role = req.target_role
    if not target_role and resume.readiness:
        target_role = resume.readiness.top_role_match
    if not target_role:
        target_role = "Software Engineer"
        
    try:
        # Generate using Gemini
        analysis = GeminiService.generate_weekly_roadmap(resume.extracted_text or "", target_role)
        
        # Save to database
        roadmap = WeeklyRoadmap(
            resume_id=resume.id,
            weekly_data=analysis.get("weekly_data", []),
            learning_priorities=analysis.get("learning_priorities", [])
        )
        db.add(roadmap)
        db.commit()
        db.refresh(roadmap)
        
        return {
            "success": True,
            "weekly_data": roadmap.weekly_data,
            "learning_priorities": roadmap.learning_priorities,
            "resume_id": roadmap.resume_id
        }
    except Exception as e:
        print(f"Error generating weekly roadmap: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate roadmap: {str(e)}")
