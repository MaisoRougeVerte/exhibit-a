import { assertNever } from "@exhibit-a/schema";
import { findCase } from "./cases.ts";
import { HomePage } from "./home-page.tsx";
import { ReportPage } from "./report-page.tsx";
import { TrialPage } from "./trial-page.tsx";
import { useRoute } from "./use-route.ts";

function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-stone-950 text-white">
      <p>
        No such trial.{" "}
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
        <TrialPage key={caseFile.id} caseFile={caseFile} />
      );
    }
    case "report": {
      const caseFile = findCase(route.caseId);
      return caseFile === undefined ? <NotFound /> : <ReportPage caseFile={caseFile} />;
    }
    case "not-found":
      return <NotFound />;
    default:
      return assertNever(route);
  }
}
