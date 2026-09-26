import type { Speaker } from "./scene.ts";

type SpeakerStyle = {
  name: string;
  initial: string;
  nameplate: string;
  silhouette: string;
  accent: string;
};

export const speakerStyles: Record<Speaker, SpeakerStyle> = {
  investigator: {
    name: "Bob",
    initial: "B",
    nameplate: "#1d4ed8",
    silhouette: "#1e293b",
    accent: "#3b82f6",
  },
  prosecutor: {
    name: "Prosecutor",
    initial: "P",
    nameplate: "#b91c1c",
    silhouette: "#2a1515",
    accent: "#ef4444",
  },
  judge: {
    name: "Judge",
    initial: "J",
    nameplate: "#a16207",
    silhouette: "#3a2a12",
    accent: "#d9b25f",
  },
  developer: {
    name: "You",
    initial: "Y",
    nameplate: "#047857",
    silhouette: "#132a22",
    accent: "#10b981",
  },
  narrator: {
    name: "",
    initial: "",
    nameplate: "transparent",
    silhouette: "transparent",
    accent: "transparent",
  },
};
