import os
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
is_gemini_configured = False

if api_key and not api_key.startswith("your_") and api_key.strip() != "":
    try:
        genai.configure(api_key=api_key.strip())
        is_gemini_configured = True
        print("Gemini API configured successfully.")
    except Exception as e:
        print(f"Error configuring Gemini API: {e}")

class GeminiService:
    @staticmethod
    def _get_mock_analysis(resume_text: str, filename: str) -> dict:
        """
        Generates realistic mockup career intelligence data based on keywords in the resume.
        Acts as a fallback when the Gemini API is not configured or fails.
        """
        # Simple keyword matching to guess role and skills
        text_lower = resume_text.lower() if resume_text else ""
        
        # Determine likely role match
        role = "Software Engineer"
        skills = []
        
        if "react" in text_lower or "frontend" in text_lower or "vue" in text_lower:
            role = "Senior Frontend Engineer"
            skills = ["React", "TypeScript", "Next.js", "TailwindCSS", "Redux", "Vite", "HTML5/CSS3"]
        elif "python" in text_lower or "django" in text_lower or "fastapi" in text_lower or "backend" in text_lower:
            role = "Backend Developer (Python)"
            skills = ["Python", "FastAPI", "PostgreSQL", "SQLAlchemy", "Docker", "Redis", "REST APIs"]
        elif "java" in text_lower or "spring" in text_lower:
            role = "Enterprise Java Engineer"
            skills = ["Java", "Spring Boot", "Hibernate", "Microservices", "PostgreSQL", "Kubernetes"]
        elif "node" in text_lower or "express" in text_lower:
            role = "Full Stack Developer"
            skills = ["Node.js", "Express", "React", "MongoDB", "TypeScript", "AWS", "GraphQL"]
        else:
            # General fallback
            skills = ["JavaScript", "Python", "SQL", "Git", "Docker", "REST APIs"]
            
        # Get user name if we can infer it (first line of resume usually)
        name = "Professional Builder"
        if resume_text:
            lines = [line.strip() for line in resume_text.split("\n") if line.strip()]
            if lines:
                # First non-empty line under 50 chars might be the name
                for l in lines[:3]:
                    if len(l) < 30 and not any(k in l.lower() for k in ["resume", "cv", "curriculum", "contact"]):
                        name = l
                        break

        # Calculate scores
        # We can randomize them slightly or use static realistic numbers
        overall = 84
        clarity = 86
        impact = 78
        ats = 88
        screen_prob = 74
        
        return {
            "overall_score": overall,
            "clarity_score": clarity,
            "impact_score": impact,
            "ats_score": ats,
            "top_role_match": role,
            "screen_probability": screen_prob,
            "trend_metric": "+14%",
            "portfolio_title": name,
            "portfolio_subtitle": f"Experienced {role} | Building high-performance software and systems",
            "portfolio_projects": [
                {
                    "title": "E-Commerce Microservices Platform",
                    "description": "Architected and deployed a highly scalable checkout service handling 5,000+ RPS. Reduced latency by 40% through distributed caching.",
                    "skills": [skills[0], skills[2], "PostgreSQL", "Docker"]
                },
                {
                    "title": "AI Analytics Dashboard",
                    "description": "Developed a real-time analytics visualization system with custom filtering and charting capabilities. Integrated automated data pipelines.",
                    "skills": [skills[0], skills[1], "TypeScript", "Websockets"]
                },
                {
                    "title": "Open Source CLI Tooling",
                    "description": "Created a lightweight developer utility with 200+ stars on GitHub, simplifying local environment configuration and diagnostics.",
                    "skills": [skills[0], "Node.js" if len(skills) > 4 else "Python", "Git"]
                }
            ],
            "portfolio_skills": skills[:6],
            "interview_questions": [
                {
                    "question_text": f"How do you optimize render cycles or API latency in a production {role} environment?",
                    "model_answer": "Optimizing latency/rendering involves: 1) Memoization and code splitting (e.g. React.memo, lazy loading), 2) Database indexing, connection pooling, and caching (e.g. Redis) on the backend, 3) Profiling code (using Chrome DevTools or APM tools) to locate hot paths, and 4) Minifying payloads and using CDNs for asset distribution."
                },
                {
                    "question_text": "Describe a time you encountered a production bug under pressure. How did you diagnose and fix it?",
                    "model_answer": "Under pressure, I follow a systematic checklist: 1) Rollback to the last known stable state to minimize user impact immediately, 2) Examine application logs, telemetry (Datadog/Sentry), and recent commits to identify the root cause, 3) Write a local reproduction test case, 4) Apply and verify the hotfix, and 5) Perform a post-mortem to prevent recurrence."
                },
                {
                    "question_text": "How do you handle technical debt when a feature needs to be shipped quickly?",
                    "model_answer": "To manage technical debt: 1) Agree on a 'technical budget' with stakeholders, 2) Document the shortcuts taken immediately using TODOs or Jira tickets, 3) Structure code modularly so refactoring is isolated, and 4) Schedule dedicated refactoring sprints or allocate 20% of engineering bandwidth to debt repayment."
                },
                {
                    "question_text": "Walk me through how you design an API endpoint for file uploads or complex data queries.",
                    "model_answer": "Designing APIs requires: 1) Selecting REST or GraphQL based on requirements, 2) Specifying clear path and query parameters, 3) Validating input schemas (e.g., using Pydantic), 4) Handling errors gracefully with standardized JSON responses (e.g. RFC 7807), and 5) Protecting endpoints with rate-limiting, authentication, and file type/size limits."
                }
            ],
            "roadmap_skills": [
                {"skill_name": f"Advanced {skills[0]} architectural patterns", "is_completed": True, "priority": 1},
                {"skill_name": "Docker containers & multi-stage builds", "is_completed": True, "priority": 2},
                {"skill_name": "Production metrics & alerting (Prometheus/Grafana)", "is_completed": False, "priority": 3},
                {"skill_name": "Distributed caching (Redis/Memcached)", "is_completed": False, "priority": 4},
                {"skill_name": "System Security & OAuth2 standards", "is_completed": False, "priority": 5}
            ]
        }

    @classmethod
    def analyze_resume(cls, resume_text: str, filename: str) -> dict:
        """
        Parses resume text using Gemini API and formats it into the expected dashboard structure.
        """
        if not is_gemini_configured or not resume_text:
            print("Gemini API not configured or resume text empty. Using mock service...")
            return cls._get_mock_analysis(resume_text, filename)

        try:
            # Create the model
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            prompt = f"""
            Analyze the following resume text extracted from the file '{filename}'.
            
            Resume Text:
            \"\"\"
            {resume_text}
            \"\"\"
            
            Extract and generate a career intelligence JSON profile. Respond with ONLY the raw JSON object. Do not include markdown code fence formatting.
            Structure:
            {{
              "overall_score": 82, // int 0-100
              "clarity_score": 88, // int 0-100
              "impact_score": 76,  // int 0-100
              "ats_score": 84,     // int 0-100
              "top_role_match": "Senior Frontend Engineer", // string
              "screen_probability": 71, // int 0-100
              "trend_metric": "+12%", // string
              "portfolio_title": "Jane Doe", // name from resume
              "portfolio_subtitle": "headline/bio", // summary headline
              "portfolio_projects": [
                 {{"title": "Project Title", "description": "1-2 sentence impact description", "skills": ["Skill1", "Skill2"]}}
              ], // list of 2-3 projects
              "portfolio_skills": ["Skill1", "Skill2"], // list of top 6 technical skills
              "interview_questions": [
                 {{"question_text": "question string", "model_answer": "answer guidelines"}}
              ], // list of 4 relevant interview questions
              "roadmap_skills": [
                 {{"skill_name": "skill to learn", "is_completed": false, "priority": 1}}
              ] // list of 5 prioritized next-step skills (make first 2 'is_completed': true to show progress)
            }}
            """
            
            # Request generation
            # Set response mime type to json to ensure structured response
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            
            data = json.loads(response.text.strip())
            return data
        except Exception as e:
            print(f"Gemini API analysis failed: {e}. Falling back to mock service...")
            return cls._get_mock_analysis(resume_text, filename)

    @classmethod
    def evaluate_interview_answer(cls, question: str, answer: str) -> dict:
        """
        Evaluates a user's answer to an interview question using the Gemini API.
        """
        if not is_gemini_configured:
            return cls._fallback_interview_evaluation(question, answer)

        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = f"""
            You are a technical recruiter. Evaluate the user's answer to the following interview question.
            
            Question: {question}
            User's Answer: {answer}
            
            Return a JSON object containing:
            1. "score" (int 0-100 indicating quality and depth)
            2. "feedback" (constructive feedback highlighting strengths and detailed areas of improvement)
            3. "sample_improved_answer" (a model answer incorporating the feedback)
            
            Respond with ONLY the raw JSON object. Do not include markdown code block syntax.
            """
            
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text.strip())
        except Exception as e:
            print(f"Gemini API evaluation failed: {e}. Using fallback...")
            return cls._fallback_interview_evaluation(question, answer)

    @staticmethod
    def _fallback_interview_evaluation(question: str, answer: str) -> dict:
        score = 75 if len(answer.strip()) > 30 else 40
        feedback = "Good start! Try expanding on your answer by using the STAR method (Situation, Task, Action, Result). Mention specific technical decisions, challenges you encountered, and the final impact/numbers."
        if len(answer.strip()) < 10:
            score = 10
            feedback = "Your answer is too short. Please provide a detailed response with details about your previous experience."
            
        return {
            "score": score,
            "feedback": feedback,
            "sample_improved_answer": "For example, you could say: 'In my last role, we had a page load latency of 3.2 seconds. I identified that large image assets and un-indexed SQL queries were causing this. I implemented WebP image compression, configured lazy loading, and created composite database indexes. This reduced page load time to 1.1 seconds and improved checkout conversion by 4%.'"
        }

    @classmethod
    def analyze_github_profile(cls, github_data: dict) -> dict:
        """
        Analyzes GitHub data using Gemini to extract developer score, projects, and skills.
        """
        if not is_gemini_configured:
            return cls._fallback_github_analysis(github_data)

        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = f"""
            Analyze the following GitHub developer profile and repositories data.
            
            GitHub Data:
            {json.dumps(github_data, indent=2)}
            
            Return a JSON object containing:
            1. "developer_score" (int 0-100 evaluating repository quality, languages, and activity)
            2. "repo_count" (int, total public repositories)
            3. "languages" (list of top languages used)
            4. "contribution_estimate" (string: "High", "Medium", or "Low" based on repository count and description qualities)
            5. "skills" (list of top 6 technical skills extracted from repository names and descriptions)
            6. "projects" (list of 2-3 portfolio-worthy projects extracted from repos: {{"title": "Title", "description": "1-2 sentence description", "skills": ["skill1", "skill2"]}})
            
            Respond with ONLY the raw JSON object. Do not include markdown code blocks.
            """
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text.strip())
        except Exception as e:
            print(f"Gemini GitHub analysis failed: {e}. Using fallback...")
            return cls._fallback_github_analysis(github_data)

    @staticmethod
    def _fallback_github_analysis(github_data: dict) -> dict:
        # Calculate heuristic developer score
        repo_count = github_data.get("repo_count", 0)
        followers = github_data.get("followers", 0)
        repos = github_data.get("repos", [])
        languages = github_data.get("languages", [])

        # Heuristic score builder
        base_score = 60
        base_score += min(repo_count * 2, 15)  # Max +15 from repos
        
        star_sum = sum(r.get("stars", 0) for r in repos)
        base_score += min(star_sum * 3, 15)   # Max +15 from stars
        base_score += min(followers * 2, 10)  # Max +10 from followers
        developer_score = min(max(base_score, 40), 100)

        # Heuristic skill extraction
        skills_set = set(languages)
        tech_keywords = {
            "react": "React", "django": "Django", "fastapi": "FastAPI", "flask": "Flask",
            "express": "Express.js", "node": "Node.js", "docker": "Docker", "kubernetes": "Kubernetes",
            "postgres": "PostgreSQL", "mysql": "MySQL", "mongodb": "MongoDB", "aws": "AWS",
            "gcp": "GCP", "tensorflow": "TensorFlow", "pytorch": "PyTorch", "spring": "Spring Boot",
            "laravel": "Laravel", "vue": "Vue.js", "angular": "Angular", "tailwind": "TailwindCSS"
        }
        for repo in repos:
            repo_text = f"{repo.get('name', '')} {repo.get('description', '')}".lower()
            for key, val in tech_keywords.items():
                if key in repo_text:
                    skills_set.add(val)
        
        skills = list(skills_set)[:6]
        if not skills:
            skills = ["Git", "GitHub", "Software Engineering"]

        # Heuristic project extraction (sort by stars first)
        sorted_repos = sorted(repos, key=lambda x: x.get("stars", 0), reverse=True)
        top_repos = sorted_repos[:3]
        
        projects = []
        for r in top_repos:
            projects.append({
                "title": r.get("name", "Project").replace("-", " ").title(),
                "description": r.get("description") or f"A repository containing codebase for {r.get('name')}.",
                "skills": [r.get("language")] if r.get("language") and r.get("language") != "Unknown" else ["Development"]
            })
            
        if not projects:
            projects = [{
                "title": "Main Repository",
                "description": "Primary developer workspace showing clean coding practices and modular structures.",
                "skills": ["Development"]
            }]

        contribution_estimate = "High" if repo_count > 15 or followers > 5 else ("Medium" if repo_count >= 5 else "Low")

        return {
            "developer_score": developer_score,
            "repo_count": repo_count,
            "languages": languages,
            "contribution_estimate": contribution_estimate,
            "skills": skills,
            "projects": projects
        }

    @classmethod
    def analyze_linkedin_profile(cls, profile_data: dict) -> dict:
        """
        Analyzes LinkedIn profile summary details using Gemini.
        """
        if not is_gemini_configured:
            return cls._fallback_linkedin_analysis(profile_data)

        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = f"""
            Analyze the following LinkedIn profile URL and description text.
            
            LinkedIn URL: {profile_data.get('profile_url', 'N/A')}
            LinkedIn Profile Text:
            \"\"\"
            {profile_data.get('profile_text', '')}
            \"\"\"
            
            Evaluate and return a JSON object with:
            1. "profile_strength" (int 0-100)
            2. "missing_sections" (list of missing sections in their profile, e.g. "Certifications", "Summary", "Detailed Projects")
            3. "suggested_improvements" (list of actionable steps to make the profile recruiter-ready)
            4. "recruiter_readiness" (int 0-100 indicating screening likelihood)
            
            Respond with ONLY the raw JSON object. Do not include markdown code block formatting.
            """
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text.strip())
        except Exception as e:
            print(f"Gemini LinkedIn analysis failed: {e}. Using fallback...")
            return cls._fallback_linkedin_analysis(profile_data)

    @staticmethod
    def _fallback_linkedin_analysis(profile_data: dict) -> dict:
        text = profile_data.get("profile_text", "").lower()
        url = profile_data.get("profile_url", "")

        # Calculate a heuristic profile strength
        strength = 40
        if url:
            strength += 15
        
        # Check text length
        text_len = len(text)
        if text_len > 800:
            strength += 30
        elif text_len > 300:
            strength += 15
        elif text_len > 50:
            strength += 5

        # Look for typical sections
        missing = []
        improvements = []

        sections = {
            "experience": ["experience", "worked at", "job", "position", "role"],
            "education": ["education", "university", "college", "degree", "school"],
            "skills": ["skills", "technologies", "proficient in"],
            "summary": ["about", "summary", "profile", "headline"],
            "projects": ["projects", "built", "portfolio"]
        }

        for sec, keywords in sections.items():
            if not any(kw in text for kw in keywords):
                missing.append(sec.title())
                improvements.append(f"Add a detailed {sec.title()} section to increase visibility.")
            else:
                strength += 5

        strength = min(strength, 100)

        # General improvements
        if text_len < 300:
            improvements.append("Write a detailed summary about your technical stack and career highlights.")
        if "cert" not in text:
            missing.append("Certifications")
            improvements.append("List industry certifications (AWS, Scrum, etc.) to attract recruiter searches.")
        improvements.append("Quantify work experience with metrics (e.g. 'improved performance by 30%').")

        recruiter_readiness = max(strength - 5, 30)

        return {
            "profile_strength": strength,
            "missing_sections": missing[:4],
            "suggested_improvements": improvements[:4],
            "recruiter_readiness": recruiter_readiness
        }

    @classmethod
    def generate_weekly_roadmap(cls, resume_text: str, target_role: str) -> dict:
        """
        Generates a 4-week structured roadmap based on skills gaps in the resume for a target role.
        """
        if not is_gemini_configured:
            return cls._fallback_roadmap(resume_text, target_role)

        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = f"""
            Analyze the following resume details and target role to generate a weekly skill roadmap.
            
            Resume Text:
            \"\"\"
            {resume_text}
            \"\"\"
            Target Role: {target_role}
            
            Generate a JSON object containing:
            1. "weekly_data" (list of 4 weeks: [{{"week": 1, "topic": "Focus Topic", "resources": ["Resource 1", "Resource 2"], "tasks": ["Task/Project 1", "Task/Project 2"]}}])
            2. "learning_priorities" (list of top 3 skills to focus on)
            
            Respond with ONLY the raw JSON object. Do not include markdown code block formatting.
            """
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text.strip())
        except Exception as e:
            print(f"Gemini roadmap generation failed: {e}. Using fallback...")
            return cls._fallback_roadmap(resume_text, target_role)

    @staticmethod
    def _fallback_roadmap(resume_text: str, target_role: str) -> dict:
        role = target_role.lower() if target_role else ""
        
        # Determine templates
        if "front" in role or "react" in role or "ui" in role:
            weekly_data = [
                {
                    "week": 1,
                    "topic": "Advanced React Patterns & State Management",
                    "resources": ["React Docs: Advanced Hooks & Context", "Zustand / Redux Toolkit Best Practices"],
                    "tasks": ["Refactor a local component to use custom hooks", "Implement centralized state with Zustand in a sample project"]
                },
                {
                    "week": 2,
                    "topic": "Frontend Build Tools & Performance Optimization",
                    "resources": ["Vite Config Guide", "Lighthouse Performance & Core Web Vitals Auditing"],
                    "tasks": ["Configure route-based code splitting / lazy loading", "Optimize image assets and achieve 95+ performance on Lighthouse"]
                },
                {
                    "week": 3,
                    "topic": "Modern Styling & Design Systems",
                    "resources": ["TailwindCSS v4 Documentation", "CSS Grid & Flexbox Masterclass"],
                    "tasks": ["Build a highly responsive dashboard layouts with clean CSS grids", "Configure a custom dark/light mode toggle with theme tokens"]
                },
                {
                    "week": 4,
                    "topic": "Frontend Testing & Quality Assurance",
                    "resources": ["Vitest & React Testing Library Tutorials", "Playwright E2E Testing Guide"],
                    "tasks": ["Write unit tests for core forms and components", "Implement a basic E2E smoke test for authentication flows"]
                }
            ]
            priorities = ["React Custom Hooks", "Web Performance (Core Web Vitals)", "TailwindCSS / Responsive CSS"]
        elif "back" in role or "python" in role or "django" in role or "fastapi" in role or "node" in role:
            weekly_data = [
                {
                    "week": 1,
                    "topic": "Advanced REST API Design & Request Validation",
                    "resources": ["FastAPI Pydantic Validation Guide", "RESTful API Design Standards (RFC 7807)"],
                    "tasks": ["Implement rigorous schema verification and custom error handling", "Configure CORS and rate limiting middleware"]
                },
                {
                    "week": 2,
                    "topic": "Relational Databases & SQLAlchemy ORM",
                    "resources": ["SQLAlchemy 2.0 Docs", "PostgreSQL Indexing & Optimization Strategies"],
                    "tasks": ["Write composite indexes and analyze query execution plans", "Set up Alembic migrations for schema alterations"]
                },
                {
                    "week": 3,
                    "topic": "Caching & Background Task Queues",
                    "resources": ["Redis Caching Guides", "Celery / Background Tasks in Python"],
                    "tasks": ["Configure Redis caching for hot endpoints", "Offload email notifications to asynchronous workers"]
                },
                {
                    "week": 4,
                    "topic": "Containerization & Security Standards",
                    "resources": ["Docker Multi-stage Builds Tutorial", "OAuth2 & JWT Security Flowcharts"],
                    "tasks": ["Write a production-grade Dockerfile matching security baselines", "Implement login authentication with signed JWTs"]
                }
            ]
            priorities = ["SQLAlchemy & Database Optimization", "Redis Caching", "Docker Containerization"]
        else:
            weekly_data = [
                {
                    "week": 1,
                    "topic": "Data Structures & Systems Design",
                    "resources": ["System Design Primer (GitHub)", "Grokking the System Design Interview"],
                    "tasks": ["Draw a high-level architecture diagram for a scalable web application", "Design schema layouts for transactional consistency"]
                },
                {
                    "week": 2,
                    "topic": "Production Containerization",
                    "resources": ["Docker & Docker Compose Guides", "Kubernetes Core Concepts"],
                    "tasks": ["Containerize a multi-service stack using Docker Compose", "Configure persistent volumes for local databases"]
                },
                {
                    "week": 3,
                    "topic": "CI/CD & Automated Testing",
                    "resources": ["GitHub Actions Documentation", "Unit and Integration Testing Best Practices"],
                    "tasks": ["Set up a GitHub Actions workflow to run linting and tests", "Configure automated build triggers"]
                },
                {
                    "week": 4,
                    "topic": "Cloud Deployment & Monitoring",
                    "resources": ["AWS / GCP Core Services Overview", "Prometheus & Grafana Alerting Setup"],
                    "tasks": ["Deploy a sample application using free tiers (Render/Fly.io)", "Configure basic logging and uptime checks"]
                }
            ]
            priorities = ["System Architecture Design", "Docker & Multi-container Compose", "CI/CD Pipelines"]

        return {
            "weekly_data": weekly_data,
            "learning_priorities": priorities
        }

    @classmethod
    def score_portfolio(cls, portfolio_data: dict) -> int:
        """
        Determines portfolio score out of 100 based on completeness.
        """
        score = 30 # Base score for existence
        if portfolio_data.get("title"): score += 15
        if portfolio_data.get("subtitle"): score += 15
        if portfolio_data.get("bio"): score += 15
        
        projects = portfolio_data.get("projects", [])
        if len(projects) >= 2:
            score += 15
        elif len(projects) == 1:
            score += 10
            
        skills = portfolio_data.get("skills", [])
        if len(skills) >= 4:
            score += 10
        elif len(skills) > 0:
            score += 5
            
        return min(score, 100)

