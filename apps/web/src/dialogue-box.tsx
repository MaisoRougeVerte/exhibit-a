import type { Speaker } from "./scene.ts";
import { speakerStyles } from "./speakers.ts";

type DialogueBoxProps = {
  speaker: Speaker;
  text: string;
  done: boolean;
};

export function DialogueBox({ speaker, text, done }: DialogueBoxProps) {
  const style = speakerStyles[speaker];
  return (
    <div className="relative rounded-xl border-2 border-brass-500/70 bg-black/80 px-6 pt-7 pb-5 shadow-2xl">
      {speaker !== "narrator" && (
        <p
          className={`absolute -top-4 left-5 rounded-md px-3 py-1 font-display text-lg text-white ${style.nameplate}`}
        >
          {style.name}
        </p>
      )}
      <p
        aria-live="polite"
        className={`min-h-20 text-lg leading-relaxed sm:text-xl ${speaker === "narrator" ? "text-center italic text-white/80" : "text-white"}`}
      >
        {text}
      </p>
      <p className="mt-2 text-right text-xs text-white/40" aria-hidden="true">
        {done ? "Space ▸ next" : "Space ▸ skip"}
      </p>
    </div>
  );
}
