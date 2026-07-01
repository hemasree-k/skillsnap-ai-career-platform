import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Linkedin, ArrowRight, Shield, Briefcase, Users, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/connect-linkedin")({
  head: () => ({
    meta: [
      { title: "Connect LinkedIn — SkillSnap" },
      { name: "description", content: "Connect LinkedIn so SkillSnap can map your experience to the roles you want." },
    ],
  }),
  component: ConnectLinkedIn,
});

function ConnectLinkedIn() {
  const [profileUrl, setProfileUrl] = useState("");
  const [profileText, setProfileText] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const resumeId = typeof window !== "undefined" ? localStorage.getItem("skillsnap_resume_id") : null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileUrl.trim() && !profileText.trim()) {
      setError("Please provide either a LinkedIn URL or profile text summary.");
      return;
    }

    setIsConnecting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("https://skillsnap-ai-career-platform.onrender.com/api/linkedin/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_url: profileUrl.trim(),
          profile_text: profileText.trim(),
          resume_id: resumeId ? parseInt(resumeId) : null
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.detail || "Failed to analyze LinkedIn profile.");
      }

      const data = await response.json();
      if (data.success) {
        setResult(data);
      } else {
        throw new Error("Analysis failed. Try checking your input details.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not evaluate LinkedIn profile. Ensure formats are correct.");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <div className="mb-10">
        <p className="text-sm text-primary">Step 3 of 3</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">Connect LinkedIn</h1>
        <p className="mt-3 text-muted-foreground">
          Map your experience against the roles you want and benchmark instantly.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {!result ? (
          <form onSubmit={handleConnect} className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-background text-[#0a66c2]">
                <Linkedin className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-medium">LinkedIn Profile Connection</p>
                <p className="text-sm text-muted-foreground">Provide URL and paste profile text details (e.g., bio, experience summary)</p>
              </div>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="LinkedIn Profile URL (e.g. https://linkedin.com/in/username)"
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                disabled={isConnecting}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none transition-smooth placeholder:text-muted-foreground/50"
              />
              <textarea
                placeholder="Paste your LinkedIn Experience, About, or Summary details here for deeper AI analysis..."
                rows={5}
                value={profileText}
                onChange={(e) => setProfileText(e.target.value)}
                disabled={isConnecting}
                className="w-full rounded-lg border border-border bg-background p-4 text-sm focus:border-primary focus:outline-none transition-smooth placeholder:text-muted-foreground/50 resize-none"
              />
              <button
                type="submit"
                disabled={isConnecting || (!profileUrl.trim() && !profileText.trim())}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-glow transition-smooth hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? (
                  <>
                    Evaluating Profile... <Loader2 className="h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <>
                    Connect & Analyze <ArrowRight className="h-4 w-4" />
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
                <p className="font-medium">Profile evaluated successfully!</p>
                <p className="text-sm text-muted-foreground">Your LinkedIn signal metrics are fully compiled.</p>
              </div>
              <div className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-center">
                <span className="text-xs text-muted-foreground block">Profile Strength</span>
                <span className="text-xl font-bold text-primary">{result.profile_strength}</span>
              </div>
            </div>

            <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border/50 bg-background/50 p-4">
                <p className="text-xs text-muted-foreground font-semibold">Missing Sections</p>
                <ul className="list-disc list-inside text-sm text-slate-300 mt-2 space-y-1">
                  {result.missing_sections.length > 0 ? (
                    result.missing_sections.map((s: string) => <li key={s}>{s}</li>)
                  ) : (
                    <li className="text-emerald-400 list-none font-medium">None! Fully complete.</li>
                  )}
                </ul>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/50 p-4">
                <p className="text-xs text-muted-foreground font-semibold font-semibold">Suggested Improvements</p>
                <ul className="list-disc list-inside text-sm text-slate-300 mt-2 space-y-1">
                  {result.suggested_improvements.length > 0 ? (
                    result.suggested_improvements.map((s: string) => <li key={s}>{s}</li>)
                  ) : (
                    <li className="text-emerald-400 list-none font-medium">Everything looks perfect!</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
          {[
            { icon: Briefcase, label: "Experience", value: result ? "Evaluated" : "Mapped" },
            { icon: Users, label: "Network", value: result ? "Analyzed" : "Benchmarked" },
            { icon: Shield, label: "Privacy", value: "You control" },
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
        <Link to="/connect-github" className="text-muted-foreground transition-smooth hover:text-foreground">← GitHub</Link>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-glow transition-smooth hover:opacity-90"
        >
          Go to Dashboard <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}
