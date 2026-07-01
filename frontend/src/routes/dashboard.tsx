import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Sparkles, FileText, MessageSquare, Map as MapIcon, Trophy,
  ArrowUpRight, CheckCircle2, Circle, ExternalLink, Play,
  Loader2, X, ChevronRight, AlertCircle, Copy, Download, RefreshCw, Eye,
  Github, Linkedin, Mail, Link as LinkIcon
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SkillSnap" },
      { name: "description", content: "Your AI-powered career dashboard: resume score, portfolio, interview prep, skill roadmap, and recruiter readiness." },
    ],
  }),
  component: Dashboard,
});

interface Project {
  title: string;
  description: string;
  skills: string[];
}

interface PortfolioData {
  title: string;
  subtitle: string;
  bio?: string;
  contact?: {
    email?: string;
    github?: string;
    linkedin?: string;
  };
  portfolio_score?: number;
  projects: Project[];
  skills: string[];
}

interface ScoreDetail {
  overall: number;
  clarity: number;
  impact: number;
  ats: number;
}

interface ReadinessData {
  score: number;
  top_role: string;
  trend: string;
}

interface RoadmapSkill {
  skill: string;
  done: boolean;
}

interface GitHubData {
  username: string;
  developer_score: number;
  repo_count: number;
  languages: string[];
  contribution_estimate: string;
  skills: string[];
  projects: any[];
}

interface LinkedInData {
  profile_url: string;
  profile_strength: number;
  missing_sections: string[];
  suggested_improvements: string[];
  recruiter_readiness: number;
}

interface WeeklyRoadmapItem {
  week: number;
  topic: string;
  resources: string[];
  tasks: string[];
}

interface DashboardData {
  resume_id: number | null;
  scores: ScoreDetail;
  readiness: ReadinessData;
  portfolio: PortfolioData;
  interview_questions: string[];
  interview_readiness: number;
  roadmap: RoadmapSkill[];
  weekly_roadmap: WeeklyRoadmapItem[];
  github_connected: boolean;
  github: GitHubData | null;
  linkedin_connected: boolean;
  linkedin: LinkedInData | null;
}

function ScoreRing({ value, label }: { value: number; label: string }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-28 w-28 animate-fade-in">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="oklch(1 0 0 / 0.08)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={r} fill="none" stroke="url(#g)"
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.68 0.22 295)" />
              <stop offset="100%" stopColor="oklch(0.75 0.20 305)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-2xl font-semibold">{value}</span>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Card({
  icon: Icon, title, subtitle, action, children, className = "",
}: {
  icon: React.ElementType; title: string; subtitle?: string;
  action?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-border bg-surface p-6 transition-smooth hover:border-primary/30 ${className}`}>
      <header className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-primary">
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs for Skill Roadmap widget
  const [roadmapTab, setRoadmapTab] = useState<"skills" | "weekly">("skills");

  // Interview state
  const [isInterviewOpen, setIsInterviewOpen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    score: number;
    feedback: string;
    sample_improved_answer: string;
  } | null>(null);

  // Portfolio state
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const [portfolioTheme, setPortfolioTheme] = useState<"glass" | "sunset" | "emerald">("glass");
  const [isRegeneratingPortfolio, setIsRegeneratingPortfolio] = useState(false);
  const [portfolioNotification, setPortfolioNotification] = useState<string | null>(null);

  const resumeIdStr = typeof window !== "undefined" ? localStorage.getItem("skillsnap_resume_id") : null;
  const isDemo = !resumeIdStr;

  const fetchDashboardData = async (idStr: string | null) => {
    setIsLoading(true);
    setError(null);
    try {
      const endpoint = idStr
        ? `http://localhost:8010/api/dashboard/${idStr}`
        : "http://localhost:8010/api/dashboard/demo";
        
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error("Failed to load career analysis data.");
      }
      const dashboardJson = await response.json();
      setData(dashboardJson);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not retrieve data from the backend.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(resumeIdStr);
  }, [resumeIdStr]);

  const handleEvaluateAnswer = async () => {
    if (!data || !userAnswer.trim()) return;
    setIsEvaluating(true);
    setEvaluationResult(null);
    try {
      const questionText = data.interview_questions[currentQuestionIndex];
      const response = await fetch("http://localhost:8010/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questionText,
          answer: userAnswer,
        }),
      });

      if (!response.ok) {
        throw new Error("Evaluation request failed.");
      }

      const evalJson = await response.json();
      setEvaluationResult(evalJson);
      
      // Update local interview score representation
      setData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          interview_readiness: evalJson.score
        };
      });
    } catch (err: any) {
      console.error(err);
      setEvaluationResult({
        score: 50,
        feedback: "Could not connect to the AI evaluator. Try expanding your response with metrics and actions.",
        sample_improved_answer: "E.g., 'At my previous role, I resolved X by implementing Y, resulting in Z% improvement.'"
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleRegeneratePortfolio = async () => {
    if (!data || !data.resume_id) return;
    setIsRegeneratingPortfolio(true);
    setPortfolioNotification(null);
    try {
      const response = await fetch("http://localhost:8010/api/portfolio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_id: data.resume_id }),
      });

      if (!response.ok) throw new Error("Portfolio regeneration failed.");
      
      const result = await response.json();
      if (result.success) {
        setData(prev => prev ? { ...prev, portfolio: result.portfolio } : null);
        setPortfolioNotification("Portfolio regenerated successfully with new insights!");
      }
    } catch (err: any) {
      console.error(err);
      setPortfolioNotification("Could not regenerate portfolio. Try again later.");
    } finally {
      setIsRegeneratingPortfolio(false);
      setTimeout(() => setPortfolioNotification(null), 5000);
    }
  };

  const exportPortfolioAsHtml = () => {
    if (!data) return;
    const portfolio = data.portfolio;
    
    const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${portfolio.title} - Portfolio</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      font-family: 'Inter', sans-serif;
      background-color: #0b0f19;
      color: #f3f4f6;
      display: flex;
      justify-content: center;
      padding: 40px 20px;
    }
    .container {
      max-width: 800px;
      width: 100%;
    }
    header {
      text-align: center;
      margin-bottom: 50px;
    }
    h1 {
      font-size: 3rem;
      margin: 0 0 10px 0;
      background: linear-gradient(135deg, #a855f7, #ec4899);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle {
      font-size: 1.25rem;
      color: #9ca3af;
      margin: 0;
    }
    .bio {
      font-size: 1rem;
      color: #d1d5db;
      line-height: 1.6;
      margin: 20px 0;
      text-align: center;
      font-style: italic;
    }
    .contact-info {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-bottom: 30px;
      font-size: 0.9rem;
      color: #a855f7;
    }
    .contact-info a {
      color: #a855f7;
      text-decoration: none;
    }
    .contact-info a:hover {
      text-decoration: underline;
    }
    .section-title {
      font-size: 1.5rem;
      border-bottom: 2px solid #1f2937;
      padding-bottom: 10px;
      margin-top: 40px;
      margin-bottom: 20px;
      color: #a855f7;
    }
    .skills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .skill-badge {
      background-color: #1e1b4b;
      color: #c084fc;
      border: 1px solid #4338ca;
      padding: 8px 16px;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 600;
    }
    .project-card {
      background-color: #111827;
      border: 1px solid #1f2937;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
      transition: border-color 0.3s;
    }
    .project-card:hover {
      border-color: #4f46e5;
    }
    .project-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 10px 0;
    }
    .project-desc {
      color: #9ca3af;
      font-size: 0.95rem;
      line-height: 1.5;
      margin-bottom: 15px;
    }
    .project-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .tag {
      background-color: #374151;
      color: #e5e7eb;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
    }
    footer {
      text-align: center;
      margin-top: 60px;
      color: #4b5563;
      font-size: 0.8rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${portfolio.title}</h1>
      <p class="subtitle">${portfolio.subtitle}</p>
      <div class="bio">"${portfolio.bio || ''}"</div>
      <div class="contact-info">
        ${portfolio.contact?.email ? `<span>✉ ${portfolio.contact.email}</span>` : ''}
        ${portfolio.contact?.github ? `<span>GitHub: <a href="https://github.com/${portfolio.contact.github}" target="_blank">@${portfolio.contact.github}</a></span>` : ''}
        ${portfolio.contact?.linkedin ? `<span>LinkedIn: <a href="${portfolio.contact.linkedin}" target="_blank">Profile</a></span>` : ''}
      </div>
    </header>
    
    <div class="section-title">Core Skills</div>
    <div class="skills-grid">
      ${portfolio.skills.map(s => `<span class="skill-badge">${s}</span>`).join("\n      ")}
    </div>
    
    <div class="section-title">Featured Projects</div>
    ${portfolio.projects.map(p => `
    <div class="project-card">
      <div class="project-title">${p.title}</div>
      <p class="project-desc">${p.description}</p>
      <div class="project-tags">
        ${p.skills.map(t => `<span class="tag">${t}</span>`).join("\n        ")}
      </div>
    </div>`).join("")}
    
    <footer>
      Generated via SkillSnap AI Career Assistant
    </footer>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlTemplate], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${portfolio.title.toLowerCase().replace(/\s+/g, "_")}_portfolio.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyPortfolioToClipboard = () => {
    if (!data) return;
    const skillsText = data.portfolio.skills.join(", ");
    const projectsText = data.portfolio.projects.map(p => `- ${p.title}: ${p.description} (Built using: ${p.skills.join(", ")})`).join("\n");
    const textToCopy = `Portfolio: ${data.portfolio.title}\nHeadline: ${data.portfolio.subtitle}\nBio: ${data.portfolio.bio || ''}\n\nCore Skills:\n${skillsText}\n\nFeatured Projects:\n${projectsText}`;
    
    navigator.clipboard.writeText(textToCopy);
    alert("Portfolio text copied to clipboard!");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Loading career intelligence dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold">Error Loading Dashboard</h2>
        <p className="mt-2 text-muted-foreground">{error || "Could not retrieve data."}</p>
        <button
          onClick={() => fetchDashboardData(resumeIdStr)}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow transition-smooth hover:opacity-90"
        >
          <RefreshCw className="h-4 w-4" /> Try Again
        </button>
      </div>
    );
  }

  // Calculate skill roadmap progress
  const roadmapDoneCount = data.roadmap.filter(r => r.done).length;
  const roadmapTotalCount = data.roadmap.length || 1;
  const roadmapPercent = Math.round((roadmapDoneCount / roadmapTotalCount) * 100);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 md:py-14 animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <p className="text-sm text-primary">{isDemo ? "Demo Account" : "Active Profile"}</p>
            {isDemo && (
              <Link to="/upload-resume" className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all">
                Upload Real Resume
              </Link>
            )}
          </div>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight md:text-5xl">Your career, at a glance</h1>
        </div>
        <button
          onClick={() => setIsPortfolioOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition-smooth hover:opacity-90"
        >
          <Sparkles className="h-4 w-4" /> View Portfolio
        </button>
      </div>

      {/* 7-Score Panel (SUMMARY WIDGET) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-7 mb-8">
        {[
          { label: "Resume", val: data.scores.overall, color: "from-purple-500 to-pink-500" },
          { label: "Recruiter", val: data.readiness.score, color: "from-blue-500 to-indigo-500" },
          { label: "Portfolio", val: data.portfolio.portfolio_score ?? 70, color: "from-emerald-500 to-teal-500" },
          { label: "Interview", val: data.interview_readiness ?? 0, color: "from-amber-500 to-orange-500" },
          { label: "Roadmap", val: roadmapPercent, color: "from-rose-500 to-red-500" },
          { label: "GitHub Score", val: data.github_connected ? (data.github?.developer_score ?? 0) : null, color: "from-sky-500 to-blue-500", type: "github" },
          { label: "LinkedIn Score", val: data.linkedin_connected ? (data.linkedin?.profile_strength ?? 0) : null, color: "from-blue-600 to-cyan-500", type: "linkedin" }
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface p-4 text-center transition-smooth hover:border-primary/20">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold truncate">{s.label}</p>
            {s.val !== null ? (
              <div className={`mt-2 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${s.color}`}>
                {s.val}
              </div>
            ) : (
              <Link
                to={s.type === "github" ? "/connect-github" : "/connect-linkedin"}
                className="mt-2.5 text-xs font-semibold text-primary hover:underline block truncate"
              >
                Connect
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid gap-5 md:grid-cols-6">
        {/* Resume Score */}
        <Card
          icon={FileText}
          title="Resume Score"
          subtitle="Clarity · Impact · ATS"
          className="md:col-span-3 lg:col-span-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-6">
            <ScoreRing value={data.scores.overall} label="Overall" />
            <div className="flex-1 min-w-[150px] space-y-3 text-sm">
              {[
                { k: "Clarity", v: data.scores.clarity },
                { k: "Impact", v: data.scores.impact },
                { k: "ATS-ready", v: data.scores.ats },
              ].map((m) => (
                <div key={m.k}>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>{m.k}</span><span>{m.v}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-background">
                    <div className="h-full bg-gradient-primary" style={{ width: `${m.v}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Recruiter Readiness */}
        <Card
          icon={Trophy}
          title="Recruiter Readiness"
          subtitle="Likelihood of getting screened"
          className="md:col-span-3 lg:col-span-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-6">
            <ScoreRing value={data.readiness.score} label="Readiness" />
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground text-xs">Top role match</p>
              <p className="font-semibold">{data.readiness.top_role}</p>
              <div className="flex items-center gap-1.5 text-xs text-primary">
                <ArrowUpRight className="h-3.5 w-3.5" /> {data.readiness.trend} vs. last week
              </div>
            </div>
          </div>
        </Card>

        {/* Portfolio Preview */}
        <Card
          icon={Sparkles}
          title="Portfolio Preview"
          subtitle="Auto-generated from your work"
          className="md:col-span-6 lg:col-span-2"
          action={
            <button
              onClick={() => setIsPortfolioOpen(true)}
              className="inline-flex items-center gap-1 text-xs text-primary transition-smooth hover:opacity-80 font-medium"
            >
              Open <ExternalLink className="h-3 w-3" />
            </button>
          }
        >
          <div className="overflow-hidden rounded-lg border border-border bg-background">
            <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-destructive/70" />
              <span className="h-2 w-2 rounded-full bg-amber-500/70" />
              <span className="h-2 w-2 rounded-full bg-emerald-500/70" />
              <span className="ml-2 text-[10px] text-muted-foreground">skillsnap.app/{data.portfolio.title.toLowerCase().replace(/\s+/g, "")}</span>
            </div>
            <div className="space-y-2 p-4">
              <p className="text-sm font-semibold">{data.portfolio.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{data.portfolio.subtitle}</p>
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {data.portfolio.projects.slice(0, 3).map((p, i) => (
                  <div key={i} className="rounded bg-muted p-2 text-center text-[10px] font-medium border border-border/40 truncate">
                    {p.title}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* GitHub Stats Widget */}
        <Card
          icon={Github}
          title="GitHub Analysis"
          subtitle="Developer Proof-of-Work"
          className="md:col-span-3"
          action={
            !data.github_connected ? (
              <Link
                to="/connect-github"
                className="inline-flex items-center gap-1 rounded bg-primary/10 border border-primary/20 px-2 py-1 text-xs text-primary hover:bg-primary/20 transition-all"
              >
                Connect
              </Link>
            ) : null
          }
        >
          {data.github_connected && data.github ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">@{data.github.username}</p>
                  <p className="text-xs text-muted-foreground">{data.github.repo_count} public repos · {data.github.contribution_estimate} Activity</p>
                </div>
                <div className="rounded bg-primary/10 border border-primary/20 px-2.5 py-1 text-center">
                  <span className="text-[10px] text-muted-foreground block leading-none">Dev Score</span>
                  <span className="text-lg font-bold text-primary">{data.github.developer_score}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Top Languages</p>
                <div className="flex flex-wrap gap-1">
                  {data.github.languages.map(l => (
                    <span key={l} className="rounded bg-accent px-2 py-0.5 text-[10px] font-semibold text-primary border border-border">
                      {l}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Extracted Skills</p>
                <div className="flex flex-wrap gap-1">
                  {data.github.skills.slice(0, 5).map(s => (
                    <span key={s} className="rounded bg-muted px-2 py-0.5 text-[10px] text-slate-300 border border-border/40">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Github className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium">Verify your proof-of-work</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">Link your public GitHub profile to extract code skills and repository insights.</p>
              <Link
                to="/connect-github"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-surface-elevated transition-smooth"
              >
                Link Account
              </Link>
            </div>
          )}
        </Card>

        {/* LinkedIn Stats Widget */}
        <Card
          icon={Linkedin}
          title="LinkedIn Profile"
          subtitle="Recruiter Readiness"
          className="md:col-span-3"
          action={
            !data.linkedin_connected ? (
              <Link
                to="/connect-linkedin"
                className="inline-flex items-center gap-1 rounded bg-primary/10 border border-primary/20 px-2 py-1 text-xs text-primary hover:bg-primary/20 transition-all"
              >
                Connect
              </Link>
            ) : null
          }
        >
          {data.linkedin_connected && data.linkedin ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <a href={data.linkedin.profile_url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1">
                    Profile Linked <ExternalLink className="h-3 w-3" />
                  </a>
                  <p className="text-xs text-muted-foreground">Recruiter Score: {data.linkedin.recruiter_readiness}/100</p>
                </div>
                <div className="rounded bg-primary/10 border border-primary/20 px-2.5 py-1 text-center">
                  <span className="text-[10px] text-muted-foreground block leading-none">Strength</span>
                  <span className="text-lg font-bold text-primary">{data.linkedin.profile_strength}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Missing Sections</p>
                <div className="flex flex-wrap gap-1">
                  {data.linkedin.missing_sections.length > 0 ? (
                    data.linkedin.missing_sections.map(s => (
                      <span key={s} className="rounded bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5 text-[10px] font-medium">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-medium">None! Fully complete.</span>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Action items</p>
                <ul className="text-[10px] text-slate-300 list-disc list-inside space-y-0.5">
                  {data.linkedin.suggested_improvements.slice(0, 2).map((imp, idx) => (
                    <li key={idx} className="truncate">{imp}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Linkedin className="mx-auto h-8 w-8 text-[#0a66c2]/40 mb-2" />
              <p className="text-sm font-medium">Benchmark recruiter readiness</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">Import profile details to find content gaps and list structural improvement areas.</p>
              <Link
                to="/connect-linkedin"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-surface-elevated transition-smooth"
              >
                Link Account
              </Link>
            </div>
          )}
        </Card>

        {/* Interview Questions */}
        <Card
          icon={MessageSquare}
          title="Interview Questions"
          subtitle={`Tailored Prep (Readiness: ${data.interview_readiness ?? 0}%)`}
          className="md:col-span-3"
          action={
            <button
              onClick={() => {
                setEvaluationResult(null);
                setUserAnswer("");
                setIsInterviewOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-md bg-gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-glow transition-smooth hover:opacity-90"
            >
              <Play className="h-3 w-3" /> Start Interview
            </button>
          }
        >
          <ul className="divide-y divide-border">
            {data.interview_questions.map((q, i) => (
              <li key={i} className="flex items-start gap-3 py-3 text-sm">
                <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-accent text-[10px] font-semibold text-primary">
                  {i + 1}
                </span>
                <span className="line-clamp-2">{q}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Skill Roadmap Widget */}
        <Card
          icon={MapIcon}
          title="Skill Roadmap"
          subtitle="Your personalized path"
          className="md:col-span-3"
          action={
            <div className="flex gap-1.5 bg-muted/40 p-0.5 rounded-md text-xs border border-border/60">
              <button
                onClick={() => setRoadmapTab("skills")}
                className={`px-2 py-1 rounded transition-all ${roadmapTab === "skills" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
              >
                Skills
              </button>
              <button
                onClick={() => setRoadmapTab("weekly")}
                className={`px-2 py-1 rounded transition-all ${roadmapTab === "weekly" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
              >
                Weekly Plan
              </button>
            </div>
          }
        >
          {roadmapTab === "skills" ? (
            <div className="space-y-4">
              <ul className="space-y-3">
                {data.roadmap.map((r, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    {r.done
                      ? <CheckCircle2 className="h-4 w-4 flex-none text-primary" />
                      : <Circle className="h-4 w-4 flex-none text-muted-foreground" />}
                    <span className={r.done ? "text-muted-foreground line-through" : ""}>{r.skill}</span>
                  </li>
                ))}
              </ul>
              <div className="rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
                <span className="text-primary font-semibold">Tip:</span> Mastering the remaining roadmap skills unlocks higher screening likelihood for <strong>{data.readiness.top_role}</strong> roles.
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {data.weekly_roadmap && data.weekly_roadmap.length > 0 ? (
                data.weekly_roadmap.map((w, idx) => (
                  <div key={idx} className="border-l-2 border-primary/50 pl-4 py-1 space-y-1.5">
                    <p className="text-xs font-bold text-primary">Week {w.week}: {w.topic}</p>
                    <div className="space-y-1 text-xs text-slate-300">
                      <p className="font-semibold text-[10px] uppercase text-muted-foreground">Recommended Resources:</p>
                      <ul className="list-disc list-inside pl-1 space-y-0.5">
                        {w.resources.map((r, i) => <li key={i} className="truncate">{r}</li>)}
                      </ul>
                      <p className="font-semibold text-[10px] uppercase text-muted-foreground mt-2">Projects / Tasks:</p>
                      <ul className="list-disc list-inside pl-1 space-y-0.5">
                        {w.tasks.map((t, i) => <li key={i} className="truncate">{t}</li>)}
                      </ul>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No weekly roadmap generated yet. Connect profiles or upload a resume to trigger.
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* PORTFOLIO DIALOG MODAL */}
      {isPortfolioOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-2xl border border-border bg-background shadow-elegant overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
            {/* Header / Top Panel */}
            <div className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-destructive" />
                  <span className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                </div>
                <span className="text-xs text-muted-foreground font-mono">Portfolio Site Preview (Score: {data.portfolio.portfolio_score ?? 70})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportPortfolioAsHtml}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition-smooth hover:bg-surface-elevated"
                >
                  <Download className="h-3.5 w-3.5" /> Export HTML
                </button>
                <button
                  onClick={copyPortfolioToClipboard}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition-smooth hover:bg-surface-elevated"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy Text
                </button>
                {!isDemo && (
                  <button
                    onClick={handleRegeneratePortfolio}
                    disabled={isRegeneratingPortfolio}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition-smooth hover:bg-surface-elevated disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isRegeneratingPortfolio ? "animate-spin" : ""}`} /> Regenerate
                  </button>
                )}
                <button
                  onClick={() => setIsPortfolioOpen(false)}
                  className="rounded-full p-1 text-muted-foreground hover:bg-border transition-smooth"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Notification area */}
            {portfolioNotification && (
              <div className="bg-primary/10 border-b border-primary/20 text-primary px-6 py-2 text-xs text-center font-medium animate-fade-in">
                {portfolioNotification}
              </div>
            )}

            {/* Theme switcher */}
            <div className="flex justify-center gap-2 bg-muted/30 px-6 py-2.5 border-b border-border text-xs">
              <span className="text-muted-foreground self-center mr-2">Theme:</span>
              {[
                { id: "glass", label: "Midnight Glass" },
                { id: "sunset", label: "Neon Sunset" },
                { id: "emerald", label: "Emerald Matrix" }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setPortfolioTheme(t.id as any)}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    portfolioTheme === t.id
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Portfolio Render View */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-gradient-to-b from-background to-background">
              {/* Dynamic Theme Wrapping container */}
              <div className={`p-8 rounded-2xl border transition-all duration-500 ${
                portfolioTheme === "glass"
                  ? "bg-slate-900/60 border-slate-800/80 backdrop-blur-xl text-slate-100 shadow-glow"
                  : portfolioTheme === "sunset"
                  ? "bg-neutral-900 border-pink-500/20 text-neutral-100"
                  : "bg-black border-emerald-500/20 text-emerald-300 font-mono"
              }`}>
                {/* Hero */}
                <div className="text-center mb-12">
                  <h2 className={`text-4xl font-bold tracking-tight ${
                    portfolioTheme === "glass"
                      ? "text-gradient"
                      : portfolioTheme === "sunset"
                      ? "text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-amber-400"
                      : "text-emerald-400 animate-pulse"
                  }`}>
                    {data.portfolio.title}
                  </h2>
                  <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
                    {data.portfolio.subtitle}
                  </p>
                  {data.portfolio.bio && (
                    <p className="mt-4 text-sm max-w-lg mx-auto text-slate-300 border-t border-border/40 pt-4 leading-relaxed font-light italic">
                      "{data.portfolio.bio}"
                    </p>
                  )}
                  {data.portfolio.contact && (
                    <div className="mt-5 flex justify-center flex-wrap gap-4 text-xs text-muted-foreground">
                      {data.portfolio.contact.email && (
                        <span className="flex items-center gap-1 text-slate-300"><Mail className="h-3.5 w-3.5 text-primary" /> {data.portfolio.contact.email}</span>
                      )}
                      {data.portfolio.contact.github && (
                        <span className="flex items-center gap-1 text-slate-300"><Github className="h-3.5 w-3.5 text-primary" /> @{data.portfolio.contact.github}</span>
                      )}
                      {data.portfolio.contact.linkedin && (
                        <span className="flex items-center gap-1 text-slate-300"><Linkedin className="h-3.5 w-3.5 text-primary" /> Profile</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Skills Section */}
                <div className="mb-12">
                  <h3 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${
                    portfolioTheme === "emerald" ? "text-emerald-400" : "text-primary"
                  }`}>
                    Core Competencies
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.portfolio.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                          portfolioTheme === "glass"
                            ? "bg-primary/10 border-primary/20 text-primary-glow"
                            : portfolioTheme === "sunset"
                            ? "bg-pink-500/10 border-pink-500/20 text-pink-400"
                            : "bg-emerald-950/20 border-emerald-500/40 text-emerald-400"
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Projects Section */}
                <div>
                  <h3 className={`text-sm font-semibold uppercase tracking-wider mb-6 ${
                    portfolioTheme === "emerald" ? "text-emerald-400" : "text-primary"
                  }`}>
                    Featured Projects
                  </h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    {data.portfolio.projects.map((proj, idx) => (
                      <div
                        key={idx}
                        className={`p-5 rounded-xl border transition-all hover:scale-[1.01] ${
                          portfolioTheme === "glass"
                            ? "bg-slate-950/40 border-slate-800/60 hover:border-primary/40"
                            : portfolioTheme === "sunset"
                            ? "bg-neutral-950 border-neutral-800 hover:border-pink-500/30"
                            : "bg-neutral-950 border-emerald-900/60 hover:border-emerald-500/50"
                        }`}
                      >
                        <h4 className="font-semibold text-lg mb-2">{proj.title}</h4>
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                          {proj.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {proj.skills.map((t, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded bg-muted/50 text-[10px] text-muted-foreground border border-border/40"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INTERVIEW COACH DIALOG DRAWER */}
      {isInterviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm p-0">
          <div className="w-full max-w-xl h-full border-l border-border bg-background shadow-elegant flex flex-col animate-slide-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-surface px-6 py-4.5">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded bg-primary/10 text-primary">
                  <MessageSquare className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="font-semibold">AI Interview Coach</h2>
                  <p className="text-[10px] text-muted-foreground">Real-time answers evaluation</p>
                </div>
              </div>
              <button
                onClick={() => setIsInterviewOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-border transition-smooth"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Questions tracker */}
            <div className="flex items-center justify-between bg-muted/20 px-6 py-3 border-b border-border text-xs text-muted-foreground">
              <span>Question {currentQuestionIndex + 1} of {data.interview_questions.length}</span>
              <div className="flex gap-1">
                {data.interview_questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentQuestionIndex(idx);
                      setUserAnswer("");
                      setEvaluationResult(null);
                    }}
                    className={`h-2 w-8 rounded-full transition-all ${
                      idx === currentQuestionIndex
                        ? "bg-primary"
                        : idx < currentQuestionIndex
                        ? "bg-primary/30"
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Scrollable Workspace */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Question card */}
              <div className="bg-surface border border-border p-5 rounded-xl">
                <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-2">The Prompt</p>
                <p className="text-base font-medium">{data.interview_questions[currentQuestionIndex]}</p>
              </div>

              {/* Form or Evaluation view */}
              {!evaluationResult ? (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-muted-foreground">Your Answer</label>
                  <textarea
                    rows={6}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your response here. Try explaining the task details, action choices, and final outcome..."
                    className="w-full rounded-xl border border-border bg-surface p-4 text-sm focus:border-primary focus:outline-none transition-smooth resize-none placeholder:text-muted-foreground/50 text-slate-100"
                    disabled={isEvaluating}
                  />
                  <button
                    onClick={handleEvaluateAnswer}
                    disabled={isEvaluating || !userAnswer.trim()}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-glow transition-smooth hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isEvaluating ? (
                      <>
                        Evaluating Answer... <Loader2 className="h-4 w-4 animate-spin" />
                      </>
                    ) : (
                      <>
                        Submit Response <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  {/* Evaluation Score */}
                  <div className="flex items-center gap-4 bg-surface border border-border p-4.5 rounded-xl">
                    <div className="relative h-16 w-16 flex-none">
                      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="oklch(1 0 0 / 0.08)"
                          strokeWidth="3.5"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="var(--color-primary)"
                          strokeWidth="3.5"
                          strokeDasharray={`${evaluationResult.score}, 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 grid place-items-center">
                        <span className="text-sm font-bold">{evaluationResult.score}</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Performance Rating</p>
                      <p className="text-xs text-muted-foreground">
                        {evaluationResult.score >= 80 ? "Excellent response!" : evaluationResult.score >= 60 ? "Solid, but could be improved." : "Needs work."}
                      </p>
                    </div>
                  </div>

                  {/* Feedback */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Constructive Feedback</h4>
                    <p className="text-sm bg-muted/10 border border-border/40 p-4 rounded-xl leading-relaxed text-slate-300">
                      {evaluationResult.feedback}
                    </p>
                  </div>

                  {/* Sample answer */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Model Answer Pattern</h4>
                    <p className="text-sm bg-primary/5 border border-primary/10 p-4 rounded-xl leading-relaxed text-primary-glow font-medium italic">
                      {evaluationResult.sample_improved_answer}
                    </p>
                  </div>

                  {/* Action row */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        setEvaluationResult(null);
                        setUserAnswer("");
                      }}
                      className="flex-1 inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2.5 text-xs font-semibold transition-smooth hover:bg-surface-elevated"
                    >
                      Try Again
                    </button>
                    {currentQuestionIndex < data.interview_questions.length - 1 ? (
                      <button
                        onClick={() => {
                          setCurrentQuestionIndex(prev => prev + 1);
                          setUserAnswer("");
                          setEvaluationResult(null);
                        }}
                        className="flex-1 inline-flex items-center justify-center rounded-lg bg-gradient-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition-smooth hover:opacity-90"
                      >
                        Next Question
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsInterviewOpen(false)}
                        className="flex-1 inline-flex items-center justify-center rounded-lg bg-gradient-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition-smooth hover:opacity-90"
                      >
                        Complete Session
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
