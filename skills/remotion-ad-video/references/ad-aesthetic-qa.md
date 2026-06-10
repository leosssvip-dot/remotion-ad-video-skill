# Ad Aesthetic QA

Use this after technical still/render checks on every job — a lean pass (scan the scorecard, fix anything obviously failing) for fast tests, a full scored pass for commercial-quality. This is a creative QA pass, not a replacement for typecheck or render verification.

## Scorecard

Score 1-5 and revise anything below 3:

- `firstTwoSeconds`: product visible, hook clear, motion starts immediately.
- `adNotSlides`: every beat has motion, payoff, or a meaningful cut.
- `categoryNative`: visuals imitate the product category or platform behavior.
- `layoutShock`: composition has an attention-grabbing layout move, such as poster-scale type, aggressive crop, kinetic split, oversized product, or asymmetric reveal.
- `boldness`: at least one exaggerated, dramatized, or physically-impossible spectacle moment — surreal scale, gravity/time break, world-bend, or hyperbolic before/after — not a tasteful, restrained execution. A "clean and modern" spot scores low here on purpose.
- `voiceoverEnergy`: when voiceover is present, it carries a punchy spoken hook, varied pace/tone across beats, and a landed spoken CTA — not a flat, even description. (Score n/a only for intentionally silent or sfx-only spots.)
- `captionCarry`: when voiceover is present, word-synced karaoke captions (`props.captions`) carry it visually — emphasis on the numbers and power words, no collision with other copy. A voiceover without captions scores 1.
- `typeCraft`: the `fontPreset` matches the brand register and the headline face reads designed, not default — an ad left on the stock Inter look when a distinctive preset fits scores low.
- `colorBeat`: exactly one scene (usually stat or CTA) uses `colorMode: "inverted"` as a color flood beat; zero inverted beats reads flat, more than one dilutes it.
- `assetPresence`: logo/icon/screenshot/product visual appears early and repeatedly.
- `paceDensity`: meaningful change every 0.5-1.5 seconds for 15s short-form.
- `textDensity`: most scenes use maximum two text groups, with one clear hierarchy winner and enough negative space.
- `numericMotion`: source-backed ratings, discounts, prices, savings, scores, or counts animate toward the exact final value.
- `readability`: mobile text is short, high contrast, and does not fight source screenshots.
- `ctaStrength`: final action is obvious and visually emphasized.
- `claimTrust`: proof is source-backed and not inflated.

## Visual Failure Signs

Revise if any still:

- Could be mistaken for a presentation slide.
- Reads as tasteful and restrained, with no exaggerated or impossible spectacle beat.
- Shows only text over a generic background.
- Uses many similar-size text labels instead of poster-scale hierarchy.
- Has no one dominant visual to anchor the frame.
- Uses harvested screenshots only as passive posters.
- Has a static CTA with no product or motion context.
- Shows a rating, discount, price, or count as flat text when it could be a counter, meter, badge, or score pop.
- Places new text over source screenshot text.
- Keeps the same composition for more than 3 seconds in a 15s ad.

## Revision Moves

- Replace a text card with a product behavior or simulated interaction.
- Add a match cut, flash cut, swipe, snap zoom, or object burst.
- Make one hook word poster-scale and remove secondary copy.
- Replace multiple small labels with one dominant visual plus one short line.
- Use an aggressive crop, diagonal split, oversized phone/product, or asymmetric layout.
- Turn proof into stickers, overlays, counters, or side pops.
- Turn numeric proof into a count-up, rolling price, filling meter, score burst, or animated discount badge.
- Move dense copy into voiceover or captions.
- Crop or mask screenshots so source text and new text do not collide.
- Bring the logo, app icon, or product back into the CTA.
- Swap the fontPreset to one that matches the brand register (condensed-impact for deals/urgency, editorial-serif for premium, rounded-friendly for casual/family, mono-tech for dev/AI).
- Give the stat or CTA scene `colorMode: "inverted"` for a color-flood beat.
- Pair the voiceover with word-synced karaoke captions, emphasis on numbers and power words.
- Vary the headline `enter` mode across scenes (clip / slam / pop / flip3d / blur) instead of one repeated gesture.

## Minimum Handoff

Report the scorecard only when useful. Always state whether the final stills passed visual inspection for hook, middle, and CTA.
