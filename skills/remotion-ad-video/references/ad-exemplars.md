# Ad Exemplars

A swipe file of strong ad ideas, by category. Use it to raise the quality bar
above the stock template and to borrow *mechanics*, not copy. The default template
ad (a tidy hook/pain/demo/proof/cta desk lamp) is a baseline, not the target.

Each exemplar names a hook mechanic, a structure, and why it works. Adapt the
mechanic to the real product; never reuse another brand's specific copy or claims.
Two warnings about how to use this file:

- **Copy the frame-level exemplars below, not just the names.** A mechanic name
  ("UI explosion") degrades into a generic card layout; a timed shot list does not.
- **Do not copy the structures verbatim either.** The category lists below are all
  4-beat arcs ending in `cta` — that sameness is a known failure mode. Treat the
  shapes in "Structure-Diverse Shapes" as equally legal.

## Frame-Level Exemplars (copy the craft, swap the product)

### Notification Hijack — 15s, vertical (uses `ui-takeover`)

The bold version, timed at 30fps. The same product done timidly is shown after.

| Time | What happens | Implementation | Audio |
|---|---|---|---|
| 0.0–0.1s | Near-black frame, faint brand-color glow top-center. No logo, no headline — nothing reads "ad". | `ui-takeover` block, scene 1 (0–4s) | silence |
| 0.1s (f3) | A push notification drops from the top edge and lands with a spring. App icon = product logo, app name = brand, title = the hook line ("Your desk called. It wants better light"). | built-in: banner springPop | `sfx-notification` f3 |
| 0.7–1.7s | Banner hovers with a barely-visible bob. The viewer's muscle memory reads it as *their* notification. | built-in hover | — |
| 1.8s (f54) | Banner gets pressed: darkens + dips to 0.96. | built-in press beat (45%) | `sfx-tap` f54 |
| 1.9–2.5s | The banner expands into the full-bleed product hero (shared-element morph, corners un-round as it grows), small flash on press, landing shake when it fills the frame. | built-in FlipMove expand | `sfx-whoosh` f58, `sfx-impact` f76 |
| 2.5–4.0s | Headline knife-cuts in word-by-word over the hero (`enter="clip"`), proof line spring-pops (when captions are on, the proof rides the caption track instead — that is the template-wide `hasCaptions` behavior). | built-in | `sfx-reveal-hit` |
| 4.0s | Whip-left into the demo scene — both scenes push as one camera move. | `transitionOut: "whip-left"` | `sfx-whoosh` on the boundary |
| 4–9s | `device-frame` demo: screen content "switches pages" at 30%, punch-in at 55%, light impact at 90%. | built-in beats | `sfx-swipe`, `sfx-reveal-hit` |
| 9–12s | `stat-slam` with `colorMode: "inverted"` — the screen floods brand color, the approved number counts up and locks with shake + flash. | `impact` on the lock frame | `sfx-count-tick` ×n, `sfx-impact` |
| 12s | Luma-wipe into the CTA (panel sweeps, cut hides under cover). | `transitionOut: "luma-wipe"` | `sfx-swipe` |
| 12–15s | `cta-card`: button winds up, springs past 1, squashes on landing, pulses with a looping sheen; confetti; CTA holds to the end. | built-in | `sfx-bass-drop`, `sfx-success` |

Voiceover (5 beats, word-synced `captions` with `emphasis` on the operative
words): hook question → pain jab → demo verb line → the number → spoken CTA.

**The timid version of the same product** (what this file exists to prevent):
fade in a centered title card → screenshot with three bullet points → "4.8/5"
as static text → logo + button. Every beat is a fade, nothing reacts to
anything, and the ad could belong to any competitor.

### 99% Squeeze — 12s, vertical (uses `charge-reveal`, scene 1 = 0–4s)

Beats scale to the scene length (rush ends ~26%, slam lands ~63% — use
`chargeTimings(sceneFrames)` from `src/ChargeBar.tsx` for exact frames,
including `tickFrames` for the per-tick SFX). For a 4s charge scene at 30fps:

| Time | What happens | Implementation | Audio |
|---|---|---|---|
| 0–1.0s | Cold open on the percent counter already RUSHING 0→88 with the bar's glow head streaking. No setup — momentum is the hook. | `charge-reveal` block, rush beat | `sfx-riser` |
| 1.0–2.5s | The crawl: 88→99 in discrete +1 ticks, bar trembling harder near the top, charging label ("CALIBRATING LIGHT…") cycling its dots. Each tick is a micro-event. | built-in crawl beat | `sfx-count-tick` on each `tickFrames` entry |
| ~2.5s | Dead stop at 99%. Two frames of nothing — the inhale. | built-in hold | silence (cut the riser) |
| ~2.55s | SLAM to 100%: fill overshoots, full-frame white flash, screen shake, confetti from the bar tip, and the label flips to the payoff headline popping in word-by-word. | built-in slam | `sfx-impact` + `sfx-success` same frame |
| 2.6–4s | The payoff line holds while the bar settles — let it be read. | built-in | — |
| 4s | Zoom-punch into the payoff demo (the thing that is now "ready"). | `transitionOut: "zoom-punch"` | `sfx-bass-drop` |
| 4–8s | Demo of the unlocked result. | per concept | — |
| 8–12s | Proof beat and CTA per the concept. | — | — |

Why it works: the 99% stall is loss-aversion — the viewer physically cannot
scroll away one percent before completion. The payoff line lands *with* the
release, so the value proposition is welded to a dopamine beat.

## Structure-Diverse Shapes

Legal, encouraged shapes beyond "4 beats ending in cta". If all three concepts
in `concepts.json` are 4-beat-cta arcs, at least one is not a real alternative.

- **CTA-early echo** — `["ui-takeover", "cta-card", "proof-montage", "cta-echo"]`:
  the CTA lands at second 4 while attention is at its peak, then proof keeps
  earning it, and a 1-second CTA echo closes. Works for products with instant
  comprehension.
- **Triple escalation** — `["action-1x", "action-10x", "action-100x", "cta"]`:
  the same core action repeated three times at absurdly increasing scale
  (surreal-scale ramp). The repetition *is* the structure.
- **Countdown inversion** — `["charge-reveal", "payoff-blowout", "cta"]`: the
  meter/countdown is the whole first act; everything after is release.
- **Single take** — `["one-take-morph"]` ×3 scenes chained with `hero-morph` /
  match cuts so the spot reads as one continuous camera move through before →
  during → after. No hard cuts at all is itself a pattern interrupt.

## Ecommerce / Physical Product

- **Cold-open payoff** - open on the after-state (glare gone, stain lifted, knot
  untangled), then reveal the product that caused it. Structure:
  `["cold-open-payoff", "cause-reveal", "demo", "cta"]`. Works because it earns the
  first 2 seconds before asking for attention.
- **Same-object snap** - hold one object in frame and snap between the old way and
  the product way on a beat. `["split-before-after", "snap-compare", "proof", "cta"]`.
- **Oddly-satisfying loop** - a single tactile action (peel, click, pour, fold)
  shot huge and looped. `["macro-loop", "product-reveal", "benefit", "cta"]`.

## SaaS / Tool / App

- **Impossible demo** - show an end result that looks too fast, then reveal the
  product doing it. `["impossible-result", "how-reveal", "proof", "cta"]`.
- **UI explosion** - a real screenshot bursts its capabilities outward as labeled
  shards. `["screenshot-lock", "feature-explosion", "payoff", "cta"]`.
- **Chat becomes action** - message bubbles transform into completed work.
  `["chat-open", "bubbles-to-done", "proof", "cta"]`.

## Game / App Store

- **Gameplay spectacle** - imitate the core loop (merges, swaps, collisions, near-
  fail rescues, reward cascades) instead of explaining features.
  `["cold-open-gameplay", "escalation", "reward-burst", "cta"]`.
- **Score-HUD climb** - a score, combo, or coin counter bursts upward like an
  in-game HUD. `["gameplay-hook", "score-climb", "level-up", "cta"]`.

## Social / Short-Video App

- **Feed-native imitation** - a phone frame scrolls, swaps, and reacts so the ad
  feels like the platform itself. `["feed-scroll", "creator-clip", "shop-or-live", "cta"]`.
- **POV ritual** - first-person hands perform the product's core gesture.
  `["pov-hands", "one-tap-tune", "settle", "cta"]`.

## Numeric-Proof-Led (any category, only with source-backed numbers)

- **Stat slam** - the strongest approved number lands huge in the first second,
  then the product earns it. `["stat-slam", "earn-the-number", "proof", "cta"]`.
  Animate the value (count, snap, roll, meter-fill) toward the exact approved
  figure; never inflate.

## Spectacle / Exaggeration Mechanics

Reach for these to push a concept past "tasteful" into bold. Dramatize the
*feeling* — every factual or numeric claim still stays honest and source-backed.
The token in parentheses is the exact `spectacleMove` value for `concepts.json`.

- **Surreal scale** (`surreal-scale`) - blow one element up past physical sense:
  a phone the size of a skyscraper, a single feature filling the sky, the
  product as a planet. `["surreal-scale-hook", "earn-the-scale", "proof", "cta"]`.
- **Impossible physics** (`impossible-physics`) - gravity flips, time freezes
  mid-air, the UI shatters into shards, liquid runs upward, the room folds. The
  product is the cause. `["impossible-physics", "cause-reveal", "payoff", "cta"]`.
- **World-bending** (`world-bend`) - the product warps the world around it: the
  room recolors, the street reshapes, the feed bends toward the user.
  `["world-bend", "ripple", "benefit", "cta"]`.
- **Hyperbolic before/after** (`hyperbolic-before-after`) - the "before" world
  is a comic disaster (chaos, clutter, doom-spiral), then it snaps to perfect on
  a single beat. Lean the contrast to the extreme.
  `["disaster-before", "snap-fix", "after-bliss", "cta"]`.
- **Maximal kinetic burst** (`maximal-kinetic-burst`) - whip pans, snap zooms,
  match cuts, and an impact on every beat so the spot feels overclocked.
  `["kinetic-cold-open", "escalation", "drop", "cta"]`.
- **Dramatized stakes** (`dramatized-stakes`) - exaggerate the consequence of
  *not* using the product to absurd, funny, or epic scale, then the product
  rescues the moment. `["stakes-blowup", "rescue", "relief", "cta"]`.
- **UI comes alive** (`ui-comes-alive`) - the interface behaves like a physical
  being: a notification gets pressed and swallows the screen (`ui-takeover`), a
  button outgrows its container, chat bubbles do the work.
  `["ui-takeover", "ui-acts", "payoff", "cta"]`.
- **Time break** (`time-break`) - the spot manipulates time itself: a freeze
  with a record-scratch, a countdown that refuses to finish (`charge-reveal`),
  a rewind that replays the disaster in reverse.
  `["charge-reveal", "payoff-blowout", "cta"]`.

Rule: one outrageous mechanic carried at full volume beats five timid flourishes.
If the spot has no "wait, what?" beat, it is not bold enough yet.

## Hook Mechanics To Reach For

Pattern interrupt, bold approved stat, a question the viewer wants answered,
visual surprise, the after-state first, a negative hook ("stop doing X"), an
unexpected use, a satisfying loop, format-native imitation, surreal scale,
impossible physics, hyperbolic before/after.

## Cliche Ban List

Reject these openers and any close paraphrase. They signal template-filler, not an
idea. `validate-creative.mjs` rejects the worst of them in `hookLine`/`angle`.

- "Meet your / Meet the ..."
- "Introducing ..."
- "The future of ..."
- "Say goodbye to ..."
- "Game changer" / "game-changing"
- "Next level" / "take it to the next level"
- "Revolutionary"
- "Unleash ..."
- "Elevate your ..."
- "World-class"

Prefer concrete, specific, benefit-led lines tied to the product's real moment.
