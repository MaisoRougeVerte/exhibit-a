import type { Speaker } from "./scene.ts";

type SpeakerStyle = {
  name: string;
  role: string;
  initial: string;
  portrait: string;
  nameplate: string;
  backdrop: string;
};

// Placeholder look until the illustrated portraits land in public/assets.
export const speakerStyles: Record<Speaker, SpeakerStyle> = {
  investigator: {
    name: "Bob",
    role: "Defense, investigator",
    initial: "B",
    portrait: "from-sky-500 to-blue-800",
    nameplate: "bg-blue-700",
    backdrop: "from-wood-800 via-wood-900 to-wood-950",
  },
  prosecutor: {
    name: "The Prosecutor",
    role: "Attacks every claim",
    initial: "P",
    portrait: "from-rose-500 to-red-800",
    nameplate: "bg-red-700",
    backdrop: "from-wood-700 via-wood-900 to-wood-950",
  },
  judge: {
    name: "The Judge",
    role: "Believes only what it can run",
    initial: "J",
    portrait: "from-brass-400 to-amber-800",
    nameplate: "bg-amber-700",
    backdrop: "from-wood-700 via-wood-800 to-wood-950",
  },
  developer: {
    name: "You",
    role: "Developer, in the gallery",
    initial: "Y",
    portrait: "from-emerald-500 to-emerald-800",
    nameplate: "bg-emerald-700",
    backdrop: "from-wood-800 via-wood-900 to-wood-950",
  },
  narrator: {
    name: "",
    role: "",
    initial: "",
    portrait: "",
    nameplate: "",
    backdrop: "from-wood-900 via-wood-950 to-stone-950",
  },
};
