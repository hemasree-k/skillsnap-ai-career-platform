import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileText, Github, Linkedin, Sparkles, Target, Map, Trophy } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SkillSnap — AI Career Assistant" },
      { name: "description", content: "Upload your resume, connect GitHub and LinkedIn. Get a portfolio, recruiter score, and an AI-powered career roadmap." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-gradient-radial" />
        <div className="relative mx-auto max-w-5xl px-6 pt-24 pb-20 text-center md:pt-32 md:pb-28">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-powered career intelligence
          </div>
          <h1 className="text-balance text-5xl font-semibold tracking-tight md:text-7xl">
            Your career, <span className="text-gradient">snapped</span> into focus.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
            SkillSnap turns your resume, GitHub, and LinkedIn into a polished portfolio,
            a recruiter-readiness score, and a personalized roadmap to your next role.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/upload-resume"
              className="group inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-glow transition-smooth hover:opacity-90"
            >
              Analyze Resume
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-3 text-sm font-medium transition-smooth hover:bg-surface-elevated"
            >
              See dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Connect steps */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { to: "/upload-resume", icon: FileText, title: "Upload Resume", desc: "PDF, DOCX, or paste. We extract skills, impact, and gaps." },
            { to: "/connect-github", icon: Github, title: "Connect GitHub", desc: "Surface real proof-of-work from your top repositories." },
            { to: "/connect-linkedin", icon: Linkedin, title: "Connect LinkedIn", desc: "Map your experience against the roles you want." },
          ].map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="group relative overflow-hidden rounded-xl border border-border bg-surface p-6 transition-smooth hover:border-primary/40 hover:bg-surface-elevated"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
              <ArrowRight className="absolute right-5 top-6 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-28">
        <div className="mb-12 max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Everything you need, <span className="text-gradient">nothing you don't.</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Five signals that map exactly to what recruiters and hiring managers look for.
          </p>
        </div>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Target, title: "Resume Score", desc: "Clarity, impact, and ATS-readiness in one number." },
            { icon: Sparkles, title: "Portfolio Preview", desc: "A live, shareable portfolio generated from your work." },
            { icon: FileText, title: "Interview Questions", desc: "Role-specific prompts with model answers." },
            { icon: Map, title: "Skill Roadmap", desc: "The next 5 skills to learn, prioritized." },
            { icon: Trophy, title: "Recruiter Readiness", desc: "Probability of getting screened, per role." },
            { icon: Github, title: "Proof from Code", desc: "Your repos become evidence for your claims." },
          ].map((f) => (
            <div key={f.title} className="bg-background p-6">
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 pb-28">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-10 text-center md:p-16">
          <div className="pointer-events-none absolute inset-0 bg-gradient-radial opacity-60" />
          <div className="relative">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Ready to be <span className="text-gradient">recruiter-ready?</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Three minutes to set up. A lifetime of clearer career signals.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/upload-resume"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-glow transition-smooth hover:opacity-90"
              >
                Analyze Resume <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center rounded-lg border border-border bg-background px-5 py-3 text-sm font-medium transition-smooth hover:bg-surface-elevated"
              >
                Generate Portfolio
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} SkillSnap. Designed for the next generation of builders.
      </footer>
    </main>
  );
}
