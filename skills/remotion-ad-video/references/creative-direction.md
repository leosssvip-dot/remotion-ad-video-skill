# Creative Direction

## Principle

The first job of an ad is attention. Do not make a slide deck with fades. Build a thumb-stopping hook, a visual metaphor, and a conversion path.

Run divergent concepts before committing. Write `concepts.json` per
`references/concept-contract.md`, score them, and pass `validate-creative.mjs`
before the storyboard. Pull mechanics from `references/ad-exemplars.md` so the bar
is great ads, not the stock template.

## Insight First

Creativity comes from a sharp insight, not from filling a template. Before hooks
and layouts, name the one true tension the ad weaponizes: a vivid customer pain, a
surprising approved fact, a distinctive mechanism, or a cultural/format moment.
Every concept's `insight` field should make a person say "that's true." Generic
feature lists produce generic ads; a specific insight produces a specific ad.

## Anti-Template Collapse

The stock hook/pain/demo/proof/cta arc is a fallback, not a default. If every ad
you ship reuses it, the output is template-filler, not creative.

- Let the chosen concept choose the structure. Plan an arc of scene blocks that
  fits the idea (cold-open payoff, snap-compare, POV ritual, stat slam, gameplay
  spectacle, feed-native), not the same five scenes every time.
- Two concepts that produce the same arc are not real alternatives. Make them
  diverge in hook mechanic and structure, not just color and copy.
- Do not reuse the default arc unless the concept records a `forceDefaultReason`.
- Vary the visual system per concept: layout shock, motion language, pacing, and
  type treatment should follow the idea and the brand's harvested assets, not a
  fixed look.

## Bold By Default — Exaggeration & Spectacle

A tasteful, reasonable, presentation-safe ad loses the scroll. The default
emotional register for this skill is loud, dramatized, and a little too much.
"Would a brand manager call this restrained?" should be a *no*. Push every idea
one notch past comfortable before you build it.

What "exaggerate" means here:

- Dramatize the *feeling*, not the facts. Blow up the pain to absurd scale, make
  the relief euphoric, make the speed look impossible, make the transformation
  total. Every numeric and factual claim stays honest and source-backed — the
  exaggeration lives in the visual and emotional register, never in the numbers.
- Spectacle moves: surreal scale (a phone the size of a building, a single
  feature filling the sky), impossible physics (gravity flips, time freezes,
  the UI shatters into a thousand shards), world-bending (the product warps the
  room around it), and maximal kinetic energy (whip pans, snap zooms, hits on
  every beat).
- Hyperbolic before/after: the "before" world is a comic disaster, the "after"
  snaps to perfect on a single beat. Lean into the contrast hard.
- One outrageous idea, executed at full volume. Bold is not busy — a single
  surreal mechanic carried through the whole spot beats five timid flourishes.
  If you can describe the ad without a "wait, what?" moment, it is not bold yet.

Anti-tameness checklist — revise before storyboard if any is true:

- The boldest description of the ad is still "clean," "modern," or "sleek."
- A competitor could run the same spot by swapping the logo.
- The hook is a statement, not a spectacle, surprise, or pattern break.
- Nothing on screen is dramatically oversized, distorted, or physically impossible.
- The energy is even throughout instead of building to a peak.

The creative gate enforces this: the chosen concept must score `boldness` >= 4
(plus `attention` >= 4 and `distinctiveness` >= 4). A merely-acceptable idea
does not pass. See `references/ad-exemplars.md` for spectacle mechanics to reach for.

## Hook Patterns

- Chat becomes action: message bubbles transform into completed tasks.
- Before/after split: old workflow breaks, product resolves it.
- Impossible demo: show the result first, then reveal the product.
- UI explosion: product capabilities fly out from a real screenshot.
- Countdown: one urgent command or offer lands in the first 2 seconds.
- Format-native imitation: for feeds, games, editors, or commerce apps, imitate the product's core interaction instead of explaining it.

## Thumb-Stopping Layouts

Before storyboard, choose a Layout Shock move. A good ad still should look like
it wants attention even before it moves.

- poster-scale type: one word, number, or CTA is dramatically larger than the rest.
- one dominant visual: icon, product, phone, screenshot crop, avatar, or game object owns the frame.
- aggressive crop: zoom into the most recognizable product/app detail instead of showing a tidy full screenshot.
- asymmetric pressure: place the main visual off-center and let text slam, orbit, stack, or collide around it.
- reveal stack: hide the payoff behind a wipe, swipe, terminal cursor, door, crate, card, or product layer.
- kinetic split screen: old/new, before/after, fail/rescue, input/output, or chaos/control.

Keep the first frame to maximum two text groups: a large hook and a short support
or CTA. Do not fill the viewport with several similarly sized labels.

## Numeric Proof Motion

If the source gives usable numbers, treat them as a motion surface, not a line
of copy. Ratings, discounts, prices, savings, review counts, download counts,
scores, speed, or time saved should count, tick, roll, pop, or meter-fill toward
the exact approved final number.

- Rating examples: `0.0` -> `4.8`, with stars or a badge snapping in at the end.
- Discount examples: `0%` -> `50%`, with a flash, price slash, or offer sticker.
- Price examples: `$0` -> `$29`, or old price crossed out while savings count up.
- Game/app examples: score and coins climb with bursts, combos, or HUD-style pops.

Never invent a higher number for drama. If the number is inferred or blocked,
animate the product behavior instead and keep the proof claim out of the render.

## Motion Requirements

Use the `src/motion.ts` vocabulary (`tween`, `springPop`, `staggerDelay`, eases)
and `KineticText` rather than bare linear `interpolate` — see
`references/motion-language.md`. Apply them (they wrap Remotion's
`useCurrentFrame()`, `spring()`, and `interpolate()`) for:

- Logo or product reveal.
- Staggered task/card entrances.
- Kinetic headline movement.
- Dynamic numeric counters or meters when the ad uses source-backed proof.
- At least one continuous background or particle motion.
- CTA emphasis in the final scene.

Avoid:

- Plain centered title cards.
- One visual repeated for the whole video.
- Long body copy.
- CSS transitions or CSS keyframe animations.
- Dense equal-weight text blocks.
- Safe, centered composition in every scene.
- Static numeric proof where the same number could be animated safely.

## Commercial QA

Before handoff, ask:

- Would the first 2 seconds stop someone scrolling?
- Is the product visible or visually implied immediately?
- Is there a clear reason to click?
- Are source assets used, not just generic placeholders?
- Does the CTA feel like an action, not a footer note?
- Does the motion feel native to the product category, not just animated presentation slides?
- Does the layout feel bold enough for a paid ad rather than a product explainer?
- Is there at least one "wait, what?" spectacle moment — surreal scale, impossible physics, or a dramatized payoff — rather than a tasteful, restrained execution?
- Does the voiceover carry energy and dynamics, or does it read like a flat description?
