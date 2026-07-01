from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    extracted_text = Column(Text, nullable=True)
    overall_score = Column(Integer, default=0)
    clarity_score = Column(Integer, default=0)
    impact_score = Column(Integer, default=0)
    ats_score = Column(Integer, default=0)
    interview_readiness = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    readiness = relationship("RecruiterReadiness", back_populates="resume", uselist=False, cascade="all, delete-orphan")
    portfolio = relationship("Portfolio", back_populates="resume", uselist=False, cascade="all, delete-orphan")
    interview_questions = relationship("InterviewQuestion", back_populates="resume", cascade="all, delete-orphan")
    roadmap_skills = relationship("SkillRoadmap", back_populates="resume", cascade="all, delete-orphan")
    github_profile = relationship("GitHubProfile", back_populates="resume", uselist=False, cascade="all, delete-orphan")
    linkedin_profile = relationship("LinkedInProfile", back_populates="resume", uselist=False, cascade="all, delete-orphan")
    weekly_roadmap = relationship("WeeklyRoadmap", back_populates="resume", uselist=False, cascade="all, delete-orphan")


class RecruiterReadiness(Base):
    __tablename__ = "recruiter_readiness"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), unique=True)
    readiness_score = Column(Integer, default=0)
    top_role_match = Column(String(255), nullable=True)
    trend_metric = Column(String(50), default="+0%")
    created_at = Column(DateTime, default=datetime.utcnow)

    resume = relationship("Resume", back_populates="readiness")


class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), unique=True)
    title = Column(String(255), nullable=True)
    subtitle = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    contact = Column(JSON, default=dict)
    portfolio_score = Column(Integer, default=70)
    projects = Column(JSON, default=list) # List of dict: {title, description, skills: []}
    skills = Column(JSON, default=list) # List of strings
    created_at = Column(DateTime, default=datetime.utcnow)

    resume = relationship("Resume", back_populates="portfolio")


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"))
    question_text = Column(Text, nullable=False)
    model_answer = Column(Text, nullable=True)
    order_num = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    resume = relationship("Resume", back_populates="interview_questions")


class SkillRoadmap(Base):
    __tablename__ = "skill_roadmap"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"))
    skill_name = Column(String(255), nullable=False)
    is_completed = Column(Boolean, default=False)
    priority = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    resume = relationship("Resume", back_populates="roadmap_skills")


class GitHubProfile(Base):
    __tablename__ = "github_profiles"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), unique=True)
    username = Column(String(255), nullable=False)
    repo_count = Column(Integer, default=0)
    languages = Column(JSON, default=list) # List of strings/dicts
    contribution_estimate = Column(String(255), default="Medium")
    skills = Column(JSON, default=list) # List of strings
    projects = Column(JSON, default=list) # List of dicts
    developer_score = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    resume = relationship("Resume", back_populates="github_profile")


class LinkedInProfile(Base):
    __tablename__ = "linkedin_profiles"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), unique=True)
    profile_url = Column(String(255), nullable=True)
    profile_strength = Column(Integer, default=0)
    missing_sections = Column(JSON, default=list)
    suggested_improvements = Column(JSON, default=list)
    recruiter_readiness = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    resume = relationship("Resume", back_populates="linkedin_profile")


class WeeklyRoadmap(Base):
    __tablename__ = "weekly_roadmaps"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), unique=True)
    weekly_data = Column(JSON, default=list) # List of dicts: {week, topic, resources: [], tasks: []}
    learning_priorities = Column(JSON, default=list) # List of strings
    created_at = Column(DateTime, default=datetime.utcnow)

    resume = relationship("Resume", back_populates="weekly_roadmap")

