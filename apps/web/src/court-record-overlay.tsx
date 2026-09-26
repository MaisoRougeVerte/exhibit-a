import { AnimatePresence, motion } from "motion/react";
import { CourtRecord } from "./court-record.tsx";
import type { RecordEntry } from "./scene.ts";

type CourtRecordOverlayProps = {
  open: boolean;
  entries: readonly RecordEntry[];
  onClose: () => void;
};

export function CourtRecordOverlay({ open, entries, onClose }: CourtRecordOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.2 }}
          className="absolute inset-y-0 right-0 z-40 w-[42%] overflow-y-auto border-l-4 border-amber-400/80 bg-stone-950/95 p-[2%] text-[1.5cqw]"
        >
          <button
            type="button"
            onClick={onClose}
            className="float-right rounded border border-white/40 px-3 py-1 text-white/80 hover:bg-white/10"
          >
            Close
          </button>
          <CourtRecord entries={entries} />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
