# Assets

| Asset | Source | License |
|---|---|---|
| Cover `docs/cover.jpg` | Original, generated with OpenAI image generation through Codex CLI | Created for this project |
| Characters in `apps/web/src/assets/characters/` (Bob, the Prosecutor, the Judge) | Original 16-bit pixel art characters, generated with OpenAI image generation through Codex CLI on 26 September 2026. Bob wears the IBM Bob brand colors as a nod to the product. | Created for this project |
| Backgrounds in `apps/web/src/assets/backgrounds/` | Generated with OpenAI image generation through Codex CLI on 26 September 2026 | Created for this project |
| "OBJECTION!" bubble in `apps/web/src/assets/effects/` | Original, generated with OpenAI image generation through Codex CLI | Created for this project |
| Drawn courtroom fallback | SVG drawn in code | Part of this project |
| Jersey 10, M PLUS Rounded 1c | Fontsource packages | SIL Open Font License 1.1 |

No asset from the Ace Attorney games is part of this repository or of the deployed site.

Investigator redraw: `apps/web/src/assets/characters/investigator/redrawn-idle.png`,
generated with the built-in OpenAI ImageGen tool on 27 September 2026. Prompt: redraw the
investigator entirely from the neutral sprite reference, preserving his brown hair, navy suit,
blue-to-violet tie and code pin, with clean eye/ear/jaw anatomy and a transparent background.
The neutral redraw is the base for the corrected expression set below. Original frames are
retained but are no longer selected for the investigator.

Investigator expressions: `apps/web/src/assets/characters/investigator/corrected-*.png`,
generated with the built-in OpenAI ImageGen tool on 27 September 2026. Shared prompt: preserve
the corrected neutral character's identity, clean ear/jaw, suit, scale and transparent canvas.
Variants: confident pointing accusation; thinking with hand at chin; nervous with a sweat drop
and hand behind neck; defeated with slumped shoulders and downcast eyes. Neutral and confident
speaking frames change only the mouth. The player clips those frames to the mouth area to
avoid full-body flicker and disables mouth animation with reduced motion.

Judge correction: `apps/web/src/assets/characters/judge/angry-corrected.png`, generated with
the built-in OpenAI ImageGen tool on 27 September 2026. Prompt: preserve the brass clockwork
judge sprite and raised arm, replace the malformed gavel with a symmetrical wooden mallet
whose handle joins the center of the barrel at a right angle, on a transparent background.
Only the raised-gavel expression is replaced; the original neutral pose is retained.

Judge expressions: `apps/web/src/assets/characters/judge/thinking-idle.png` and
`confident-idle.png`, generated with the built-in OpenAI ImageGen tool on 27 September 2026.
Shared prompt: preserve the neutral brass clock automaton judge's identity, Roman numeral
face, black robes, gold trim, red tie, pixel-art style and waist-up framing on a genuinely
transparent background. Keep a symmetrical wooden gavel with a straight handle meeting
the barrel center at a right angle. Thinking variant: tilted clock head, narrowed amber
eyes, one hand at the chin and the gavel held low. Confident variant: upright head, bright
amber eyes, an open palm presenting the decision and the gavel held at chest height.
Thinking is used for execution errors; confident is used for the final verdict.
