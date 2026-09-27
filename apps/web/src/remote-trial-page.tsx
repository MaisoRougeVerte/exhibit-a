import { Suspense, use } from "react";
import { fetchCase } from "./github.ts";
import { TrialPage } from "./trial-page.tsx";

type RemoteTrialPageProps = { owner: string; repo: string; file: string };

function RemoteTrial({ owner, repo, file }: RemoteTrialPageProps) {
  const loaded = use(fetchCase(owner, repo, file));
  if (!loaded.ok) {
    return (
      <main className="grid min-h-dvh place-items-center bg-stone-950 px-6 text-center text-white">
        <p>
          Could not load {file} from {owner}/{repo}: {loaded.error}.{" "}
          <a href="#/dashboard" className="text-brass-400 underline">
            Back to the dashboard
          </a>
        </p>
      </main>
    );
  }
  return <TrialPage caseFile={loaded.value} remote />;
}

export function RemoteTrialPage(props: RemoteTrialPageProps) {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-dvh place-items-center bg-stone-950 text-white/60">
          Summoning the case from GitHub…
        </main>
      }
    >
      <RemoteTrial {...props} />
    </Suspense>
  );
}
