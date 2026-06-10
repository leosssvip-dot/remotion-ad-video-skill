# Concept Contract

`concepts.json` is the mandatory creative artifact between Strategy and Storyboard.
It exists for the same reason `ad-brief.json` does: to stop the ad from collapsing
into a reskin of the stock template. The brief captures *what is true*; the concept
artifact captures *what idea we are betting on*.

## When To Create It

- Create `concepts.json` after `ad-brief.json` and before any storyboard or code —
  for **every** job, not only commercial-quality requests. Fast tests and quick URL
  jobs may use a lean version (3 concepts, one-line fields), but they do not skip
  the gate: lower resolution is allowed, lower creativity is not. Skip only when
  the user dictated one exact direction.
- Validate it before building:

```bash
node scripts/validate-creative.mjs examples/<brand>-ad/concepts.json
```

- Do not start the storyboard until the gate passes. A failing gate means the
  concepts are not yet distinct, scored, or chosen.

## Shape

```json
{
  "schemaVersion": "1.0",
  "sourceUrl": "https://example.com/product",
  "productName": "Product",
  "defaultArc": ["hook", "pain", "demo", "proof", "cta"],
  "concepts": [
    {
      "id": "glare-kill",
      "label": "Glare Kill",
      "angle": "One sentence describing the creative bet.",
      "insight": "The sharp customer tension or surprising truth this ad weaponizes.",
      "hookLine": "3 to 8 words",
      "firstFrame": "What is visible at frame 0-30.",
      "structure": ["cold-open-payoff", "cause-reveal", "angle-dim-focus", "cta"],
      "motionIdea": "The main moving system.",
      "signatureMoment": "The one frame only this product could own - a competitor could not swap their logo in. Reference the product's own element, interaction, or claim.",
      "spectacleMove": "surreal-scale",
      "proof": "Source-backed or user-supplied evidence only.",
      "cta": "One action.",
      "risk": "Rights, claim, or production concern.",
      "scores": {
        "attention": 5,
        "nativeFit": 4,
        "productProof": 4,
        "conversion": 4,
        "productionFeasibility": 4,
        "claimSafety": 5,
        "distinctiveness": 4,
        "boldness": 5
      }
    }
  ],
  "chosenId": "glare-kill",
  "selectionNote": "Why this concept beat the others, plus any beat grafted from a runner-up."
}
```

## Gate Rules

The validator enforces the parts that can be checked mechanically:

- 3-6 concepts, each with a unique `id` and a unique `hookLine`.
- Every concept declares `angle`, `insight`, `hookLine` (3-8 words), `firstFrame`,
  `structure` (>= 3 scene blocks), `motionIdea`, `signatureMoment`,
  `spectacleMove`, `proof`, `cta`, and all eight `scores` as integers 1-5.
- `signatureMoment` is one sentence describing the frame only this product could
  own — if a competitor could swap their logo in, it fails the spirit of the
  field (validator floor: >= 10 chars after trim; the spirit is checked by you,
  not the machine). `spectacleMove` must be one of: `surreal-scale`,
  `impossible-physics`, `world-bend`, `hyperbolic-before-after`,
  `maximal-kinetic-burst`, `dramatized-stakes`, `ui-comes-alive`, `time-break` —
  the tokens match the mechanics in `ad-exemplars.md` (Spectacle / Exaggeration
  Mechanics); the "wait, what?" beat is a checkable field, not a vibe.
- `scores` includes `boldness`: how exaggerated, dramatized, and visually loud the
  concept is. A tasteful, reasonable, "presentation-safe" idea scores low here on
  purpose. Boldness rates the creative register, never the truth of a claim.
- Concepts must not all share one `structure`; they must be genuine alternatives.
- `hookLine`, `angle`, and `label` must avoid banned cliche copy (see
  `ad-exemplars.md`).
- `chosenId` must reference a real concept and carry a `selectionNote`.
- The chosen concept must score `attention` >= 4, `distinctiveness` >= 4, and
  `boldness` >= 4, with `claimSafety` >= 3. A merely-acceptable 3 on attention,
  distinctiveness, or boldness no longer ships - pick or revise a bolder concept.
- The chosen concept's `structure` must not equal `defaultArc` unless it sets a
  `forceDefaultReason`. The stock hook/pain/demo/proof/cta arc is a fallback, not
  a default.

## Scene Block Structure

`structure` is an ordered list of scene-block kinds, not the stock five scenes.
Use it to plan an arc that fits the chosen idea: for example
`["cold-open-payoff", "cause-reveal", "snap-compare", "cta"]`,
`["pov-hands", "one-tap-tune", "focus-settle", "cta"]`, or
`["stat-slam", "rapid-features", "proof-burst", "cta"]`. Map these blocks to the
actual Remotion scenes during storyboard. If two different concepts produce the
same arc, at least one of them is not a real alternative.

## Template Blocks

The Remotion template renders each scene by its `block` field, so the chosen
`structure` becomes distinct layouts and motion instead of one repeated card. Map
your structure onto these built-in blocks (or add a new block component):

- `cold-open-payoff` - full-bleed visual first; headline slams in late.
- `split-before-after` - kinetic split; dim "before" half vs colored "after" half.
- `device-frame` - content inside a phone frame; feed/app-native feel.
- `stat-slam` - a source-backed number dominates the frame (uses scene `metric`).
- `hero-morph` - the visual flies in from a thumbnail and arcs into the hero frame (FlipMove shared-element morph).
- `ui-takeover` - a fake push notification drops in, gets pressed, and expands into the hero — the system-UI hook.
- `charge-reveal` - progress-bar psychology: rush to 88%, squeeze to 99%, hold, slam to 100% with the payoff line.
- `cta-card` - centered conversion poster with a pulsing CTA button.
- `standard` - balanced framed-visual + copy layout; the fallback, not the default.

Set each storyboard scene's `block` accordingly. Do not route every scene through
`standard` - that is the template-collapse the gate exists to prevent.

## Handoff

- Keep `concepts.json` next to `ad-brief.json` in the project directory.
- When delivering one built variant, the storyboard and props must reflect the
  chosen concept's `structure`, `firstFrame`, and `motionIdea`. Note in handoff
  why the other concepts were not built.
