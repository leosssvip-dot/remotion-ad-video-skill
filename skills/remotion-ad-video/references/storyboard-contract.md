# Storyboard Contract

## Scene Fields

Each scene should include:

- `id`: Stable slug.
- `startSecond`: Number.
- `durationSecond`: Number.
- `goal`: Hook, pain, demo, proof, offer, or CTA.
- `block`: Remotion layout for the scene - `cold-open-payoff`, `split-before-after`, `device-frame`, `stat-slam`, `hero-morph`, `ui-takeover`, `charge-reveal`, `cta-card`, or `standard`. Map the chosen concept's `structure` onto these; vary blocks so the ad is not one repeated layout. See `concept-contract.md`.
  - `ui-takeover` remaps the copy fields: `eyebrow` → app name, `headline` → notification title (single line, truncated), `body` → notification body line (single line), `logoPath` → app icon, `visual`/image → the expanded hero. Give it at least 3s (4s recommended) so the notification can be read before the press; prefer vertical formats when captions are on.
  - `charge-reveal` remaps: `body` → the charging label ("CALIBRATING…"), `headline` → the payoff line revealed at 100%. Give it at least 4s so the 88→99 ticks read as discrete events.
- `transitionOut`: How the scene hands off to the next one - `whip-left`, `whip-right`, `whip-up`, `zoom-punch`, `luma-wipe`, `cut` (default), or `fade`. Plan it at storyboard time and pair the boundary with an SFX cue; never all-fade, never the same kind twice in a row, and leave it off the final scene. Transitions assume scenes are back-to-back (each `startSecond` equals the previous scene's end). See `motion-language.md` §9.
- `impact`: Optional landing beat `{ atFrame, strength: light|heavy }` - flash plus camera shake on the frame something heavy locks in, synced to an impact-class SFX. `atFrame` is scene-local (0 = the scene's nominal start); `strength` defaults to `heavy`. `stat-slam`, `hero-morph`, `ui-takeover` (expand landing), and `charge-reveal` (slam — which also fires its own confetti, so skip `celebrate` there too) fire their own landing impact — do not stack a scene `impact` on the same frame there. See `motion-language.md` §10.
- `celebrate`: Optional particle payoff `{ preset: confetti|coins|sparks|debris, startFrame }` for reward beats. `startFrame` is scene-local and defaults to 40% of the scene.
- `colorMode`: Optional `inverted` floods the scene with the primary color and flips text dark — plan exactly one inverted beat per spot (usually the stat or CTA scene).

Top-level props planned at storyboard time:

- `fontPreset`: typography direction — `clean-sans` (default, no network), `bold-geometric`, `condensed-impact`, `editorial-serif`, `rounded-friendly`, or `mono-tech`. Pick by brand register; do not leave every ad on the default.
- `captions`: word-synced karaoke captions whenever a voiceover exists — same timestamps as the voiceover track, `emphasis: true` on numbers and power words. See `audio-caption-system.md`.
- `finish`: `{ grain, vignette }` film-finish overlays, default on.
- `visual`: Product image, screenshot, generated visual, screen recording, icon, text-only, or placeholder.
- `eyebrow`: Optional short context label.
- `headline`: Main on-screen line.
- `body`: Optional supporting line.
- `proof`: Optional evidence line.
- `metric`: Optional animated numeric proof object with `label`, `from`, `to`,
  `prefix`, `suffix`, and `decimals`.
- `voiceover`: Optional narration.
- `claimTags`: `observed`, `user_supplied`, `inferred`, or `blocked`.
- `assetRefs`: Local files or URLs and rights status.
- `layoutMode`: poster-scale type, aggressive crop, oversized product, kinetic split, asymmetric reveal, or category-native simulation.
- `textBudget`: maximum two text groups per scene; one dominant hook plus one optional support line.

## Metric Rules

Use `metric` when the ad shows source-backed ratings, discounts, prices,
savings, review counts, download counts, scores, speed, or time saved. The final
`to` value must match the approved source number. `from` should usually start at
0 or a nearby lower value that makes the growth legible. Use `decimals: 1` for
ratings like `4.8`, `decimals: 0` for whole percentages/counts, and explicit
`prefix`/`suffix` for currency and percent signs.

Example:

```json
{
  "metric": {
    "label": "Store rating",
    "from": 0,
    "to": 4.8,
    "suffix": "/5",
    "decimals": 1
  }
}
```

If the number is inferred, blocked, or not safe to claim, do not put it in
`metric`; use a non-claim visual payoff instead.

## Language

- Use `outputLanguage` from `ad-brief.json` for `headline`, `body`, `proof`,
  `voiceover`, captions, CTA, and any rendered on-screen copy.
- Do not use `interactionLanguage` for video copy unless it matches
  `outputLanguage` or the user explicitly requests the video in that language.
- Keep internal ids, enum values, and file paths stable in English; only
  user-facing video copy is localized.

## Render Engine Handoff

- If `renderEngine` is `remotion`, map scenes to Remotion props and
  `Sequence` timing.
- If `renderEngine` is `hyperframes`, map scenes to `index.html` clips with
  `data-start`, `data-duration`, and `data-track-index`, and put approved copy,
  colors, CTA, and local asset paths in `variables.json`.
- Do not change storyboard copy because of the render engine. Render engine
  changes implementation shape, not the language or claim rules.

## Structure: Derive From The Concept, Not From A Template

There are deliberately no default structures here. The storyboard's scene list
is **derived from the chosen concept's `structure` array** (see
`concept-contract.md`) — writing a stock arc into this file is how every ad
collapsed into the same hook→pain→demo→proof→cta shape regardless of concept.

Mapping rules:

1. One entry in the concept's `structure` → one scene. Map each entry onto the
   nearest template block (`ui-takeover`, `cold-open-payoff`, `charge-reveal`,
   `split-before-after`, `device-frame`, `stat-slam`, `hero-morph`, `cta-card`,
   `standard`) or write a new block component when none fits.
2. Beat budgets instead of fixed acts: the hook must land inside 2 seconds; the
   CTA gets at least 2.5 seconds and holds (no `transitionOut`); everything in
   between belongs to the concept.
3. Non-linear shapes are legal and encouraged when the concept calls for them:
   CTA-early-then-payoff, the same action escalating three times, a single
   continuous shot, a countdown running backwards.
4. If the storyboard you wrote would also work for the runner-up concept, it is
   not expressing the chosen concept — re-derive it.

## Text Limits

- Hook headline: 3-8 words.
- Scene headline: 3-10 words.
- Body line: 6-14 words.
- CTA: 2-5 words.

If the product requires more explanation, move detail into voiceover or captions rather than dense on-screen copy.

## Layout Rules

- Each scene needs one dominant visual or one dominant text object, not several competing blocks.
- Use maximum two text groups per scene unless the format intentionally mimics comments, UI stickers, or game score bursts.
- Prefer poster-scale type for the hook and CTA; supporting text should be visibly secondary.
- Numeric proof should become a large counter, badge, meter, or sticker instead of another small text line.
- Do not reuse centered card/title layouts across consecutive scenes.
