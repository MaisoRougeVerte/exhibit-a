import { assertNever } from "@exhibit-a/schema";
import { AccusePage } from "./accuse-page.tsx";
import { findCase } from "./cases.ts";
import { DashboardPage } from "./dashboard-page.tsx";
import { HomePage } from "./home-page.tsx";
import { RemoteTrialPage } from "./remote-trial-page.tsx";
import { ReportPage } from "./report-page.tsx";
import { findTimeline } from "./timelines.ts";
import { TrialPage } from "./trial-page.tsx";
import { TryPage } from "./try-page.tsx";
import { useRoute } from "./use-route.ts";

function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-stone-950 text-white">
      <p>
        Nothing here.{" "}
        <a href="#/" className="text-brass-400 underline">
          Back to the court
        </a>
      </p>
    </main>
  );
}

export function App() {
  const route = useRoute();
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
    case "not-found":
      return <NotFound />;
    default:
      return assertNever(route);
  }
}
