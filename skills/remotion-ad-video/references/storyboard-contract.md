# Storyboard Contract

## Scene Fields

Each scene should include:

- `id`: Stable slug.
- `startSecond`: Number.
- `durationSecond`: Number.
- `goal`: Hook, pain, demo, proof, offer, or CTA.
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

## Default Structures

### Product Link Ad

1. Hook: product visible plus problem or result.
2. Problem: show the old friction.
3. Demo: show product use or feature.
4. Proof: rating, material, before/after, guarantee, or user-supplied result.
5. Offer: price, bundle, limited deal, or reason to act.
6. CTA: clear action and brand.

### App Store Ad

1. Hook: app result or strongest screen.
2. Pain: current workflow is slow, messy, or expensive.
3. Demo: 2-3 screenshots with motion.
4. Proof: rating or user-supplied proof if safe.
5. CTA: install, try free, or start now.

### Social Feed App Ad

1. Hook: logo plus swipe/feed action in the first 2 seconds.
2. Feed: phone frame swaps or scrolls through harvested screenshots.
3. Payoff: creator, sound, live, shop, comments, or community moment.
4. Proof: rating, reviews, downloads, badge, or approved user-supplied proof.
5. CTA: open, install, follow, watch, shop, or start creating.

### SaaS Feature Demo Ad

1. Hook: job-to-be-done.
2. Problem: manual or fragmented workflow.
3. Demo: feature sequence.
4. Differentiator: speed, automation, integration, or quality.
5. CTA: trial, book demo, or join waitlist.

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
