# Preflight Questionnaire

Use this after the first URL/source skim and before storyboard or Remotion code.
The goal is to learn what kind of ad creative the user wants, not to collect
generic project trivia.

Record the inferred defaults and user answers in `ad-brief.json`. Chat-only
answers are not enough; the storyboard and props must be traceable back to the
brief.

## Trigger Rules

- For production ads or ambiguous URL-only requests, ask link-adapted questions before creative work.
- For explicit skill tests, quick demos, or benchmark runs, defaults are allowed, but the answer must include a short `Preflight defaults` block before work continues.
- For all URL jobs, create or update `ad-brief.json` with source type, goal,
  CTA, creative route, format, audio mode, unresolved questions, and blockers.
- Ask only unresolved questions; do not ask what the link already proves.
- Keep it to 4-6 questions. The user can answer in shorthand.
- If product/app visuals cannot be harvested after crawler and browser-backed attempts, stop and ask the user to provide images or screenshots before making the ad.

## Link-Adapted Question Set

First infer the link type: ecommerce product, mobile game, social/content app,
SaaS/API tool, service/local business, or unknown. Then ask these questions with
category-specific options.

1. Goal and CTA: "I see this is likely a `<purchase/install/trial/lead>` ad. Is the goal `<inferred goal>` or something else?"
2. Audience and hook: "Who should this target, and what should the first 2 seconds hit: desire, pain, curiosity, offer, status, fear of missing out, or gameplay challenge?"
3. Creative route: ask with options fitted to the link category:
   - Ecommerce: product close-up, try-on/lifestyle, offer push, UGC-style proof, premium editorial, before/after styling.
   - Mobile game: high-energy gameplay, fail-rescue, level-up reward, boss/challenge, speedrun, satisfying cascade.
   - Social/content app: feed-native swipe, creator POV, comment drama, live/shop moment, trend remix.
   - SaaS/API: old-way vs new-way, workflow collapse, terminal-to-result, dashboard proof, founder-style demo.
   - Unknown: product demo, problem-solution, comparison, offer push, premium brand.
4. Proof and claims: "Which proof can we show: price, discount, rating, review count, speed/result claim, testimonial, or none?"
5. Assets and rights: "Can we use page-harvested assets as references, or will you provide approved images/video/logo? If harvesting is blocked, please provide product images."
6. Format and sound: "Choose output: vertical, square, or landscape; and audio: silent-safe, synced SFX, music plus SFX, or voiceover."

## Default Block For Fast Tests

When proceeding without answers, write a compact block like:

```text
Preflight defaults: goal=purchase, audience=inferred from page, format=vertical 9:16, creative route=category-native product demo, assets=page-harvested public references, audio=synced SFX only.
```

If any default is high-risk or materially affects the creative, ask instead of
guessing.
