import { assertNever } from "@exhibit-a/schema";
import { useEffect } from "react";
import { AccusePage } from "./accuse-page.tsx";
import { findCase } from "./cases.ts";
import { DashboardPage } from "./dashboard-page.tsx";
import { DocsPage } from "./docs-page.tsx";
import { findDocsReport } from "./docs-reports.ts";
import { HomePage } from "./home-page.tsx";
import { PageShell, Panel } from "./page-shell.tsx";
import { PixelTransition } from "./pixel-transition.tsx";
import { RemoteTrialPage } from "./remote-trial-page.tsx";
import { ReportPage } from "./report-page.tsx";
import type { Route } from "./route.ts";
import { SetupPage } from "./setup-page.tsx";
import { findTimeline } from "./timelines.ts";
import { TrialPage } from "./trial-page.tsx";
import { TryPage } from "./try-page.tsx";
import { useRoute } from "./use-route.ts";

function NotFound() {
  return (
    <PageShell eyebrow="CASE DISMISSED" title="Nothing here" backdrop="bench">
      <Panel title="The court finds no such page">
        <a
          href="#/"
          className="inline-block rounded-sm bg-amber-500 px-4 py-1.5 font-extrabold text-stone-950"
        >
          Back to the court
        </a>
      </Panel>
    </PageShell>
  );
}

export function App() {
  const route = useRoute();
  const routeKey = JSON.stringify(route);
  // A new page starts at the top, like a new screen in a game.
  useEffect(() => {
    if (routeKey !== "") window.scrollTo(0, 0);
  }, [routeKey]);
  return (
    <>
      <Page route={route} />
      <PixelTransition key={routeKey} />
    </>
  );
}

function Page({ route }: { route: Route }) {
  switch (route.page) {
    case "home":
      return <HomePage />;
    case "trial": {
      const caseFile = findCase(route.caseId);
      return caseFile === undefined ? (
        <NotFound />
      ) : (
        <TrialPage
          key={`${caseFile.id}/${route.step}`}
          caseFile={caseFile}
          startAt={route.step - 1}
        />
      );
    }
    case "report": {
      const caseFile = findCase(route.caseId);
      return caseFile === undefined ? <NotFound /> : <ReportPage caseFile={caseFile} />;
    }
    case "accuse": {
      const timeline = findTimeline(route.caseId);
      const caseFile = findCase(route.caseId);
      return timeline === undefined || caseFile === undefined ? (
        <NotFound />
      ) : (
        <AccusePage timeline={timeline} bugTitle={caseFile.bugReport.title} />
      );
    }
    case "dashboard":
      return <DashboardPage />;
    case "remote-trial":
      return <RemoteTrialPage key={`${route.owner}/${route.repo}/${route.file}`} {...route} />;
    case "try":
      return <TryPage />;
    case "setup":
      return <SetupPage />;
    case "docs": {
      const report = findDocsReport(route.repo);
      return report === undefined ? <NotFound /> : <DocsPage report={report} />;
    }
    case "not-found":
      return <NotFound />;
    default:
      return assertNever(route);
  }
}
