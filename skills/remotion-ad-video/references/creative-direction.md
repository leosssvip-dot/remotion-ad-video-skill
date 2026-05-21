# Creative Direction

## Principle

The first job of an ad is attention. Do not make a slide deck with fades. Build a thumb-stopping hook, a visual metaphor, and a conversion path.

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

Use Remotion `useCurrentFrame()`, `spring()`, and `interpolate()` for:

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
