import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Github, ArrowRight, Shield, GitBranch, Star, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/connect-github")({
  head: () => ({
    meta: [
      { title: "Connect GitHub — SkillSnap" },
      { name: "description", content: "Connect your GitHub to surface proof-of-work from your top repositories." },
    ],
  }),
  component: ConnectGithub,
});

function ConnectGithub() {
  const [username, setUsername] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const resumeId = typeof window !== "undefined" ? localStorage.getItem("skillsnap_resume_id") : null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsConnecting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("https://skillsnap-ai-career-platform.onrender.com/api/github/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          resume_id: resumeId ? parseInt(resumeId) : null
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.detail || "Failed to analyze GitHub profile.");
      }

      const data = await response.json();
      if (data.success) {
        setResult(data);
      } else {
        throw new Error("Analysis failed. Try checking your username.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not connect to GitHub. Ensure username is correct.");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <div className="mb-10">
        <p className="text-sm text-primary">Step 2 of 3</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">Connect GitHub</h1>
        <p className="mt-3 text-muted-foreground">
          Your repositories become evidence — turning claims into proof.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {!result ? (
          <form onSubmit={handleConnect} className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-background">
                <Github className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-medium">GitHub Account</p>
                <p className="text-sm text-muted-foreground">We analyze public repositories and language metrics</p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter GitHub username (e.g. octocat)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isConnecting}
                className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none transition-smooth placeholder:text-muted-foreground/50"
              />
              <button
                type="submit"
                disabled={isConnecting || !username.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition-smooth hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? (
                  <>
                    Analyzing... <Loader2 className="h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <>
                    Connect <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Connected successfully!</p>
                <p className="text-sm text-muted-foreground">GitHub profile <strong>@{result.username}</strong> is linked.</p>
              </div>
              <div className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-center">
                <span className="text-xs text-muted-foreground block">Developer Score</span>
                <span className="text-xl font-bold text-primary">{result.developer_score}</span>
              </div>
            </div>

            <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border/50 bg-background/50 p-4">
                <p className="text-xs text-muted-foreground">Public Repositories</p>
                <p className="text-lg font-semibold mt-1">{result.repo_count}</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/50 p-4">
                <p className="text-xs text-muted-foreground">Contribution Level</p>
                <p className="text-lg font-semibold mt-1 text-primary">{result.contribution_estimate}</p>
              </div>
            </div>

            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">Top Languages Detected</p>
              <div className="flex flex-wrap gap-1.5">
                {result.languages.map((l: string) => (
                  <span key={l} className="rounded-full bg-accent border border-border px-3 py-1 text-xs font-semibold text-primary">
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
          {[
            { icon: GitBranch, label: "Top repos", value: result ? "Analyzed" : "Detected" },
            { icon: Star, label: "Languages", value: result ? `${result.languages.length} identified` : "Aggregated" },
            { icon: Shield, label: "Permissions", value: "Read only" },
          ].map((s) => (
            <div key={s.label} className="p-5">
              <s.icon className="h-4 w-4 text-primary" />
              <p className="mt-2 text-xs text-muted-foreground">{s.label}</p>
              <p className="font-medium text-sm">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-none" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-12 flex items-center justify-between border-t border-border pt-6 text-sm">
        <Link to="/upload-resume" className="text-muted-foreground transition-smooth hover:text-foreground">← Resume</Link>
        <Link to="/connect-linkedin" className="text-primary transition-smooth hover:opacity-80 font-medium">Next: LinkedIn →</Link>
      </div>
    </main>
  );
}
