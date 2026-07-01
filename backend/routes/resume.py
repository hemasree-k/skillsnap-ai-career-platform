from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from ..models.database import get_db
from ..models.resume import Resume, RecruiterReadiness, Portfolio, InterviewQuestion, SkillRoadmap, WeeklyRoadmap, GitHubProfile, LinkedInProfile
from ..services.pdf_service import PDFService
from ..services.gemini_service import GeminiService

router = APIRouter(prefix="/api")

# Pydantic schemas
class AnswerRequest(BaseModel):
    question: str
    answer: str

class PortfolioRegenRequest(BaseModel):
    resume_id: int

class InterviewStartRequest(BaseModel):
    resume_id: int

@router.post("/resume/upload")
async def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Accepts PDF upload, extracts text, performs AI analysis, and saves results.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        # 1. Read PDF bytes
        content = await file.read()
        
        # 2. Extract Text
        text = PDFService.extract_text_from_pdf(content)
        
        # 3. Analyze text with Gemini
        analysis = GeminiService.analyze_resume(text, file.filename)
        
        # 4. Save to Database
        # Create Resume
        resume = Resume(
            filename=file.filename,
            extracted_text=text,
            overall_score=analysis.get("overall_score", 70),
            clarity_score=analysis.get("clarity_score", 70),
            impact_score=analysis.get("impact_score", 70),
            ats_score=analysis.get("ats_score", 70),
            interview_readiness=0
        )
        db.add(resume)
        db.flush() # Populate resume.id
        
        # Create Recruiter Readiness
        readiness = RecruiterReadiness(
            resume_id=resume.id,
            readiness_score=analysis.get("screen_probability", 70),
            top_role_match=analysis.get("top_role_match", "Developer"),
            trend_metric=analysis.get("trend_metric", "+0%")
        )
        db.add(readiness)
        
        # Create Portfolio
        portfolio = Portfolio(
            resume_id=resume.id,
            title=analysis.get("portfolio_title", "Portfolio Name"),
            subtitle=analysis.get("portfolio_subtitle", "Headline"),
            bio=analysis.get("portfolio_subtitle", ""),
            contact={"email": "contact@example.com", "github": "", "linkedin": ""},
            portfolio_score=70,
            projects=analysis.get("portfolio_projects", []),
            skills=analysis.get("portfolio_skills", [])
        )
        db.add(portfolio)
        
        # Create Interview Questions
        for idx, q in enumerate(analysis.get("interview_questions", [])):
            iq = InterviewQuestion(
                resume_id=resume.id,
                question_text=q.get("question_text", "Describe your project"),
                model_answer=q.get("model_answer", "N/A"),
                order_num=idx
            )
            db.add(iq)
            
        # Create Roadmap
        for idx, s in enumerate(analysis.get("roadmap_skills", [])):
            sr = SkillRoadmap(
                resume_id=resume.id,
                skill_name=s.get("skill_name", "Technical skill"),
                is_completed=s.get("is_completed", False),
                priority=s.get("priority", idx)
            )
            db.add(sr)
            
        db.commit()
        db.refresh(resume)
        
        # 5. Return success and ID
        return {
            "success": True,
            "resume_id": resume.id,
            "filename": resume.filename,
            "overall_score": resume.overall_score
        }
        
    except Exception as e:
        db.rollback()
        print(f"Error processing resume upload: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process resume: {str(e)}")


@router.get("/dashboard/demo")
async def get_demo_dashboard():
    """
    Returns standard demo metrics if no resume has been uploaded yet.
    """
    demo_data = GeminiService.analyze_resume("", "demo_resume.pdf")
    return {
        "resume_id": None,
        "scores": {
            "overall": demo_data.get("overall_score", 82),
            "clarity": demo_data.get("clarity_score", 88),
            "impact": demo_data.get("impact_score", 76),
            "ats": demo_data.get("ats_score", 84)
        },
        "readiness": {
            "score": demo_data.get("screen_probability", 71),
            "top_role": demo_data.get("top_role_match", "Senior Frontend Engineer"),
            "trend": demo_data.get("trend_metric", "+12%")
        },
        "portfolio": {
            "title": demo_data.get("portfolio_title", "Jane Doe"),
            "subtitle": demo_data.get("portfolio_subtitle", "Senior Frontend Engineer"),
            "bio": "Passionate developer crafting elegant solutions using modern stacks.",
            "contact": {"email": "jane.doe@example.com", "github": "janedoe", "linkedin": "linkedin.com/in/janedoe"},
            "portfolio_score": 85,
            "projects": demo_data.get("portfolio_projects", []),
            "skills": demo_data.get("portfolio_skills", [])
        },
        "interview_questions": [
            q.get("question_text") for q in demo_data.get("interview_questions", [])
        ],
        "interview_readiness": 75,
        "roadmap": [
            {"skill": s.get("skill_name"), "done": s.get("is_completed")} 
            for s in demo_data.get("roadmap_skills", [])
        ],
        "weekly_roadmap": [
            {
                "week": 1,
                "topic": "System Design Fundamentals",
                "resources": ["System Design Primer", "Designing Data-Intensive Applications"],
                "tasks": ["Draw a modular API layout", "Draft a database schema"]
            },
            {
                "week": 2,
                "topic": "Docker Containers & Orchestration",
                "resources": ["Docker Official Docs", "Kubernetes in Action"],
                "tasks": ["Write a multi-stage Dockerfile", "Deploy local stack in containers"]
            }
        ],
        "github_connected": True,
        "github": {
            "username": "janedoe",
            "developer_score": 88,
            "repo_count": 18,
            "languages": ["TypeScript", "Python"],
            "contribution_estimate": "High",
            "skills": ["React", "TypeScript", "Node.js", "Docker", "Python"],
            "projects": [
                {"title": "Open Source CLI", "description": "CLI utility for dev efficiency", "skills": ["Node.js", "TypeScript"]}
            ]
        },
        "linkedin_connected": True,
        "linkedin": {
            "profile_url": "https://linkedin.com/in/janedoe",
            "profile_strength": 92,
            "missing_sections": ["Certifications"],
            "suggested_improvements": ["Add detailed tags to projects"],
            "recruiter_readiness": 85
        }
    }


@router.get("/dashboard/{resume_id}")
async def get_dashboard(resume_id: int, db: Session = Depends(get_db)):
    """
    Loads all saved metrics associated with a resume.
    """
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume analysis not found.")
        
    # Read metrics from relationships
    readiness = resume.readiness
    portfolio = resume.portfolio
    questions = db.query(InterviewQuestion).filter(InterviewQuestion.resume_id == resume_id).order_by(InterviewQuestion.order_num).all()
    roadmap = db.query(SkillRoadmap).filter(SkillRoadmap.resume_id == resume_id).order_by(SkillRoadmap.priority).all()
    
    github = resume.github_profile
    linkedin = resume.linkedin_profile
    weekly = resume.weekly_roadmap
    
    # Calculate scores on the fly or get them
    portfolio_score = portfolio.portfolio_score if portfolio and portfolio.portfolio_score else 70
    if portfolio and not portfolio.portfolio_score:
        portfolio_score = GeminiService.score_portfolio({
            "title": portfolio.title,
            "subtitle": portfolio.subtitle,
            "bio": portfolio.bio,
            "projects": portfolio.projects,
            "skills": portfolio.skills
        })
        portfolio.portfolio_score = portfolio_score
        db.commit()
        
    return {
        "resume_id": resume.id,
        "scores": {
            "overall": resume.overall_score,
            "clarity": resume.clarity_score,
            "impact": resume.impact_score,
            "ats": resume.ats_score
        },
        "readiness": {
            "score": readiness.readiness_score if readiness else 0,
            "top_role": readiness.top_role_match if readiness else "Developer",
            "trend": readiness.trend_metric if readiness else "+0%"
        },
        "portfolio": {
            "title": portfolio.title if portfolio else "Portfolio Title",
            "subtitle": portfolio.subtitle if portfolio else "Headline",
            "bio": portfolio.bio if portfolio else "",
            "contact": portfolio.contact if portfolio else {},
            "portfolio_score": portfolio_score,
            "projects": portfolio.projects if portfolio else [],
            "skills": portfolio.skills if portfolio else []
        },
        "interview_questions": [q.question_text for q in questions],
        "interview_readiness": resume.interview_readiness,
        "roadmap": [
            {"skill": r.skill_name, "done": r.is_completed} 
            for r in roadmap
        ],
        "weekly_roadmap": weekly.weekly_data if weekly else [],
        "github_connected": github is not None,
        "github": {
            "username": github.username,
            "developer_score": github.developer_score,
            "repo_count": github.repo_count,
            "languages": github.languages,
            "contribution_estimate": github.contribution_estimate,
            "skills": github.skills,
            "projects": github.projects
        } if github else None,
        "linkedin_connected": linkedin is not None,
        "linkedin": {
            "profile_url": linkedin.profile_url,
            "profile_strength": linkedin.profile_strength,
            "missing_sections": linkedin.missing_sections,
            "suggested_improvements": linkedin.suggested_improvements,
            "recruiter_readiness": linkedin.recruiter_readiness
        } if linkedin else None
    }


@router.post("/interview/start")
async def start_interview(req: InterviewStartRequest, db: Session = Depends(get_db)):
    """
    Retrieves or generates interview questions for a resume.
    """
    resume = db.query(Resume).filter(Resume.id == req.resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")

    questions = db.query(InterviewQuestion).filter(InterviewQuestion.resume_id == req.resume_id).order_by(InterviewQuestion.order_num).all()
    
    if not questions:
        # Generate questions if they don't exist
        analysis = GeminiService.analyze_resume(resume.extracted_text or "", resume.filename)
        for idx, q in enumerate(analysis.get("interview_questions", [])):
            iq = InterviewQuestion(
                resume_id=resume.id,
                question_text=q.get("question_text", "Describe your project"),
                model_answer=q.get("model_answer", "N/A"),
                order_num=idx
            )
            db.add(iq)
        db.commit()
        questions = db.query(InterviewQuestion).filter(InterviewQuestion.resume_id == req.resume_id).order_by(InterviewQuestion.order_num).all()

    return {
        "success": True,
        "questions": [q.question_text for q in questions]
    }


@router.post("/interview/evaluate")
async def evaluate_interview(req: AnswerRequest, db: Session = Depends(get_db)):
    """
    Evaluates user response to a question using Gemini API.
    """
    result = GeminiService.evaluate_interview_answer(req.question, req.answer)
    
    # Save the score and update interview_readiness in Resume model
    try:
        iq = db.query(InterviewQuestion).filter(InterviewQuestion.question_text == req.question).first()
        if iq:
            resume = db.query(Resume).filter(Resume.id == iq.resume_id).first()
            if resume:
                resume.interview_readiness = result.get("score", 70)
                db.commit()
    except Exception as e:
        print(f"Error saving interview readiness score: {e}")
        
    return result


@router.post("/portfolio/generate")
async def generate_portfolio(req: PortfolioRegenRequest, db: Session = Depends(get_db)):
    """
    Regenerates the portfolio details for a resume.
    """
    resume = db.query(Resume).filter(Resume.id == req.resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")
        
    # Call Gemini to generate a fresh portfolio layout based on the text
    analysis = GeminiService.analyze_resume(resume.extracted_text or "", resume.filename)
    
    portfolio = db.query(Portfolio).filter(Portfolio.resume_id == req.resume_id).first()
    if not portfolio:
        portfolio = Portfolio(resume_id=req.resume_id)
        db.add(portfolio)
        
    portfolio.title = analysis.get("portfolio_title", "Portfolio Name")
    portfolio.subtitle = analysis.get("portfolio_subtitle", "Headline")
    portfolio.projects = analysis.get("portfolio_projects", [])
    portfolio.skills = analysis.get("portfolio_skills", [])
    
    # Custom improvements
    portfolio.bio = analysis.get("portfolio_subtitle", "Experienced Developer")
    portfolio.contact = {
        "email": "contact@example.com",
        "github": resume.github_profile.username if resume.github_profile else "",
        "linkedin": resume.linkedin_profile.profile_url if resume.linkedin_profile else ""
    }
    
    portfolio.portfolio_score = GeminiService.score_portfolio({
        "title": portfolio.title,
        "subtitle": portfolio.subtitle,
        "bio": portfolio.bio,
        "projects": portfolio.projects,
        "skills": portfolio.skills
    })
    
    db.commit()
    db.refresh(portfolio)
    
    return {
        "success": True,
        "portfolio": {
            "title": portfolio.title,
            "subtitle": portfolio.subtitle,
            "bio": portfolio.bio,
            "contact": portfolio.contact,
            "portfolio_score": portfolio.portfolio_score,
            "projects": portfolio.projects,
            "skills": portfolio.skills
        }
    }

