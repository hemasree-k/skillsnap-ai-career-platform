import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition-smooth hover:opacity-90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. Try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-smooth hover:opacity-90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium transition-smooth hover:bg-surface-elevated"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SkillSnap — AI Career Assistant" },
      { name: "description", content: "SkillSnap turns your resume, GitHub, and LinkedIn into a polished portfolio, recruiter score, and personalized career roadmap." },
      { property: "og:title", content: "SkillSnap — AI Career Assistant" },
      { property: "og:description", content: "SkillSnap turns your resume, GitHub, and LinkedIn into a polished portfolio, recruiter score, and personalized career roadmap." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "SkillSnap — AI Career Assistant" },
      { name: "twitter:description", content: "SkillSnap turns your resume, GitHub, and LinkedIn into a polished portfolio, recruiter score, and personalized career roadmap." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/79869928-88ca-47e6-9e12-0ad498029d3f/id-preview-e7969f35--25d7ae6b-b3f3-41cc-aaa7-a99f46c57687.lovable.app-1782809491401.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/79869928-88ca-47e6-9e12-0ad498029d3f/id-preview-e7969f35--25d7ae6b-b3f3-41cc-aaa7-a99f46c57687.lovable.app-1782809491401.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-primary text-primary-foreground shadow-glow">
            <span className="text-xs font-bold">S</span>
          </span>
          SkillSnap
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <Link to="/upload-resume" className="transition-smooth hover:text-foreground">Resume</Link>
          <Link to="/connect-github" className="transition-smooth hover:text-foreground">GitHub</Link>
          <Link to="/connect-linkedin" className="transition-smooth hover:text-foreground">LinkedIn</Link>
          <Link to="/dashboard" className="transition-smooth hover:text-foreground">Dashboard</Link>
        </nav>
        <Link
          to="/dashboard"
          className="inline-flex items-center rounded-md bg-gradient-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground shadow-glow transition-smooth hover:opacity-90"
        >
          Get started
        </Link>
      </div>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <Outlet />
      </div>
    </QueryClientProvider>
  );
}
