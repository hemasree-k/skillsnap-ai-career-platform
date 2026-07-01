import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Upload, FileText, ArrowRight, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/upload-resume")({
  head: () => ({
    meta: [
      { title: "Upload Resume — SkillSnap" },
      { name: "description", content: "Upload your resume to get an instant AI-powered analysis and score." },
    ],
  }),
  component: UploadResume,
});

function UploadResume() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleFileChange = (selectedFile: File | null) => {
    setError(null);
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
        setError("Only PDF resumes are supported at this time.");
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("https://skillsnap-ai-career-platform.onrender.com/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errDetail = await response.json();
        throw new Error(errDetail.detail || "Failed to analyze resume.");
      }

      const result = await response.json();
      if (result.success && result.resume_id) {
        localStorage.setItem("skillsnap_resume_id", result.resume_id.toString());
        navigate({ to: "/dashboard" });
      } else {
        throw new Error("Invalid response received from the server.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Connection to the backend API failed. Ensure the backend is running locally.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <div className="mb-10">
        <p className="text-sm text-primary">Step 1 of 3</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">Upload your resume</h1>
        <p className="mt-3 text-muted-foreground">
          We'll extract your skills, quantify impact, and surface gaps in seconds.
        </p>
      </div>

      <label
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          handleFileChange(f ?? null);
        }}
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-smooth ${
          dragging ? "border-primary bg-accent/30" : "border-border bg-surface hover:border-primary/50 hover:bg-surface-elevated"
        }`}
      >
        <input
          type="file"
          accept=".pdf"
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          disabled={isAnalyzing}
        />
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-xl bg-gradient-primary shadow-glow">
          {isAnalyzing ? (
            <Loader2 className="h-7 w-7 text-primary-foreground animate-spin" />
          ) : file ? (
            <CheckCircle2 className="h-7 w-7 text-primary-foreground" />
          ) : (
            <Upload className="h-7 w-7 text-primary-foreground" />
          )}
        </div>
        {file ? (
          <>
            <p className="font-medium">{file.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB · Ready to analyze</p>
          </>
        ) : (
          <>
            <p className="font-medium">Drop your resume here</p>
            <p className="mt-1 text-sm text-muted-foreground">PDF resumes up to 10MB</p>
          </>
        )}
      </label>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-none" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="h-4 w-4" />
          Processed privately. Never shared.
        </div>
        <button
          onClick={handleAnalyze}
          disabled={!file || isAnalyzing}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-glow transition-smooth hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              Analyzing Resume... <Loader2 className="h-4 w-4 animate-spin" />
            </>
          ) : (
            <>
              Analyze Resume <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      <div className="mt-12 flex items-center justify-between border-t border-border pt-6 text-sm">
        <Link to="/" className="text-muted-foreground transition-smooth hover:text-foreground">← Back</Link>
        <Link to="/connect-github" className="text-primary transition-smooth hover:opacity-80">Skip to GitHub →</Link>
      </div>
    </main>
  );
}
