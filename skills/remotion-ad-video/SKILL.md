---
name: remotion-ad-video
description: Use when turning product links, app store listings, landing pages, or product briefs into advertising videos with Remotion or Hyperframes projects, storyboards, render-engine props/variables, render QA, and handoff assets.
---

# Remotion Ad Video

## Overview

Use this skill to make performance-oriented ad videos with an AI agent plus a deterministic code renderer. The agent owns the creative and production workflow. Remotion is the default renderer; Hyperframes is supported when the user asks for HTML-based video authoring or an existing Hyperframes project.

## When To Use

Use for:

- Product link to 15s ad video by default, or 30s/45s only when the user asks for a longer format.
- Google Play, App Store, SaaS, or landing page to product explainer ad.
- Batch variants for TikTok, Reels, Shorts, Meta square, or YouTube landscape.
- Turning a product brief into a script, storyboard, Remotion props or Hyperframes variables, and render QA checklist.

Do not use for:

- Long-form editorial videos where ad conversion is not the goal.
- Genuinely off-limits assets: licensed/third-party music, celebrity or identifiable-person likeness, or paid stock/fonts you do not have rights to.
- Regulated medical, financial, legal, or earnings claims unless the user supplies approved copy.

Asset and claim policy (default to pragmatic, not restrictive):

- This skill makes ad creative for advertisers running paid campaigns (performance/UA/affiliate/agency), not the product's internal staff. Treat the product or app's own public assets as standard creative inputs: store icon, screenshots, feature graphic, Open Graph image, logo, and brand colors. Harvest and use them by default. Do not stall the job waiting for "rights confirmation" on public store assets.
- Public store metrics — rating, downloads, review count — are usable. Use the real numbers, attributed to the store (e.g. "Google Play 4.0★, 10M+ downloads"). Never fabricate or inflate a number.
- The advertiser owns final trademark, comparative-claim, and licensing decisions for their channel. Flag any residual responsibility in the handoff; do not gate the build on it.
- Generated placeholders are a fallback for genuine gaps (e.g. you cannot reliably isolate the right screenshots), not the default. Prefer real harvested assets.

## Core Workflow

### 1. Intake

Collect only the source material needed for the ad. For URLs, inspect the live page when tools are available; otherwise ask for product name, target customer, core offer, screenshots, logo, and brand constraints.

Load `references/ad-intake.md` when source quality, claim safety, or asset rights are unclear.
Load `references/ad-brief-contract.md` for every URL job before storyboard or code. Create or update `ad-brief.json` after source classification and keep preflight answers/defaults there.
Load `references/asset-harvest.md` for URL-based jobs before writing the storyboard.
Load `references/fast-test-workflow.md` for skill tests, first-pass iterations, or when the user cares about speed.
Load `references/hyperframes-output.md` when the user asks for Hyperframes, the target repo already uses Hyperframes, open-source renderer licensing is a priority, or `ad-brief.json` has `renderEngine: "hyperframes"`.
Load `references/preflight-questionnaire.md` for URL-only jobs before storyboard or code. Ask exactly two required preflight choices first: format and creative route. Only skip questions when the user explicitly asks for no questions, fastest possible defaults, or a benchmark run with inferred defaults. Ask optional follow-ups only after those choices, and only when they materially change the ad.
Load `references/platform-presets.md` when the user needs to choose vertical, square, or landscape output.
Load `references/industry-angle-library.md` when the product category is not obviously covered by games or social-feed patterns.
Load `references/game-ad-patterns.md` for casual games, mobile games, app-store game listings, puzzle games, hypercasual games, or simple gameplay loops.
Load `references/social-feed-ad-patterns.md` for short-video, social, creator, UGC, live shopping, community, or content-feed apps.
Load `references/variant-system.md` when the user wants options, batch ads, or a commercial-quality ad rather than a single sample.
Load `references/motion-language.md` before implementing motion in either engine; it is the ease, stagger, and kinetic-typography vocabulary (Remotion `src/motion.ts` + `KineticText`, or GSAP for Hyperframes) that keeps motion from defaulting to flat linear interpolation.

Language policy:

- Ask user-facing preflight questions in the user's current interaction language. If the user is chatting in Chinese, ask the `format` and `creativeRoute` questions in Chinese even when the source URL is English.
- Detect the source/link language from the harvested title, description, screenshots/listing copy, or page text. Generate video script, captions, CTA, and on-screen copy in that detected source language by default.
- Record `interactionLanguage`, `sourceLanguage`, and `outputLanguage` in `ad-brief.json`. Only change `outputLanguage` when the user explicitly asks for a different video language.

Required decisions:

- Product or app name.
- Target customer and pain point.
- Size preset and exact dimensions: vertical, square, or landscape unless a platform-specific format is supplied.
- Duration: default 15s for short-form ads; use 30s or 45s only when the brief needs explanation depth or the user requests it.
- One primary conversion goal.
- Usable assets and rights status.
- Remotion license suitability for the intended commercial use.
- Render engine: resolve in this order: explicit user/caller choice, existing target project stack, then local renderer availability. If both Remotion and Hyperframes are available, ask which to use. If neither is available, recommend choosing one to install.

Recorded defaults, not required user decisions:

- Audio mode defaults to `sfx-only` for quick URL jobs, fast tests, and first-pass iterations. Commercial-quality, batch, or "make it more creative" requests default to a full soundscape — `music-sfx` plus a scripted voiceover — without asking. A bold ad with no voice and one repeated click sounds thin. Still ask only if the user requests silent-safe, a specific music plan, or a platform-specific sound plan.

Minimum URL jobs must attempt to harvest favicon, touch icon, Open Graph image, visible logo or screenshots, and brand colors. Ecommerce product URLs must also attempt a product main image with `scripts/harvest-ecommerce-assets.mjs` before creative work starts; the linked item is the ad subject, and platform/store context stays secondary. Store usable public assets locally in the generated project `public/<brand>/` folder, create or update an asset manifest when practical, and reference assets with `staticFile()`.

Run `scripts/classify-ad-source.mjs` for URL jobs before creative work, passing `--interaction-language <current-user-language>` when known, `--project-dir <target-project>` when working inside an existing project, and `--render-engine remotion|hyperframes` only when the user explicitly chose one. Otherwise let `--render-engine auto` detect the engine. Write its output to `ad-brief.json` when a project directory exists. The brief is the source of truth for source type, language plan, render engine, render-engine reason, preflight defaults or answers, format, audio mode, blockers, and asset requirements. If `ad-brief.json` has blockers, includes `preflight_answers_required`, `render_engine_choice_required`, `render_engine_install_required`, or `assetPlan.status` is `blocked`/`user_required`, stop and ask for the missing decision or asset. Use `interactionPlan.choiceQuestions` for the first creative preflight step: ask only format and creative route first, in `interactionLanguage`. If the agent supports structured choice UI, present the choices there; otherwise use a text fallback with the same options. Audio defaults to audible synced SFX; ask about audio only when the user requests silent-safe, music, voiceover, or a platform-specific sound plan. Do not front-load the longer open-question list. Use `--preflight-mode defaults` only when the user explicitly approved skipping questions.

### 2. Strategy

Pick one primary ad angle before writing scenes. Load `references/creative-direction.md` before implementation to avoid static slide-deck output. Start from an `insight` (the one true customer tension or surprising approved fact), not from the template.

- Pain-point hook: problem first, product solves it.
- Demo proof: show the product or app doing the work.
- Offer conversion: discount, trial, bundle, or deadline.
- Social proof: rating, review, result, or usage proof.
- Comparison: before vs after or old way vs new way.
- Gameplay spectacle: imitate the high-energy core loop for simple games instead of explaining features.
- Feed-native spectacle: imitate fast swipe, creator clips, live/shop overlays, comment/like rails, and sound-reactive cuts for social or short-video apps.

Tag claims as `observed` (on-page facts plus public store metrics like rating, downloads, and review count), `user_supplied`, `inferred`, or `blocked`. Render `observed` and `user_supplied` freely — including real public store numbers attributed to the store. Do not render `inferred` or `blocked` numbers, and never fabricate or inflate a figure.

Every real commercial sample needs a thumb-stopping visual idea, not just copy. Examples: chat bubbles becoming completed tasks, before/after workflow collapse, a product screenshot exploding into features, or a terminal command triggering visible automation.

Every concept also needs a bold layout idea before storyboard or code: poster-scale type, one dominant visual, asymmetric composition, aggressive crop, oversized product/app frame, kinetic split screen, or a staged reveal. Avoid neat centered slide layouts unless the contrast or motion makes them feel like an ad.

Default to bold. A tasteful, restrained, presentation-safe ad loses the scroll. Push each concept past comfortable: dramatize the feeling with at least one spectacle move (surreal-scale, impossible-physics, world-bend, hyperbolic-before-after, maximal-kinetic-burst, dramatized-stakes, ui-comes-alive, or time-break — the `spectacleMove` enum) so there is a "wait, what?" beat. Exaggeration lives in the visual and emotional register only — every numeric and factual claim stays honest and source-backed. Load `references/creative-direction.md` (Bold By Default) and `references/ad-exemplars.md` (Spectacle / Exaggeration Mechanics) for the mechanics.

When source-backed numeric proof exists, plan it as motion instead of static copy: ratings count up, discounts snap from 0 to the final percent, prices or savings roll into place, download/review counts tick upward, and scores burst like a game HUD. Use the exact approved number as the final value and never animate unsupported or inflated claims.

For simple games, especially app-store listings, the visual idea should usually be a gameplay-style simulation: falling pieces, swaps, merges, collisions, score pops, explosions, level-up moments, near-fail rescues, or reward cascades. Static screenshots alone are proof assets, not the ad.

For short-video, creator, or social-feed apps, the visual idea should usually be a feed-native simulation: a phone frame that scrolls or swaps content, creator imagery, UI rails, sound/effect stickers, LIVE or Shop chips when source-supported, and quick cuts that feel like the platform itself rather than a product explainer.

Write `concepts.json` before implementation for **every** job, unless the user dictated one exact direction. Fast tests and quick URL jobs use a lean version (3 concepts, one-line fields) — lower resolution is allowed, lower creativity is not; the old "only for commercial-quality" carve-out is exactly how default jobs shipped template-filler. Generate at least three distinct concepts (distinct hook mechanic and `structure`, not just color/copy), each with a `signatureMoment` (the frame only this product could own) and a `spectacleMove`, score them with `references/variant-system.md`, and follow `references/concept-contract.md`. Pull mechanics from `references/ad-exemplars.md` so the bar is great ads, not the stock template. Then gate it:

```bash
node scripts/validate-creative.mjs <project-dir>/concepts.json
```

Do not start the storyboard until the gate passes. The chosen concept must score `attention`, `distinctiveness`, and `boldness` at least 4, with `claimSafety` at least 3, and its `structure` must not silently default to the stock hook/pain/demo/proof/cta arc unless it records a `forceDefaultReason`. A merely-acceptable 3 on attention, distinctiveness, or boldness does not ship — pick or revise a bolder concept. Score `boldness` for how exaggerated and dramatized the idea is, never for how truthful a claim is. Implement the strongest or user-selected concept, and make the storyboard reflect its `structure`, `firstFrame`, and `motionIdea`.

### 3. Storyboard

Create a timed storyboard before code. Load `references/storyboard-contract.md` for the scene contract.
Use `outputLanguage` from `ad-brief.json` for all video-facing copy unless the user explicitly asks for another language.

There is no default structure — derive the scene list from the chosen concept's `structure` (see `references/storyboard-contract.md`, Mapping rules). Hard beat budgets that always apply for 15s:

- The hook must land inside the first 2 seconds, with the product visible.
- The CTA gets at least 2.5 seconds and holds (no `transitionOut` on the final scene).
- Everything between hook and CTA belongs to the concept — non-linear shapes (CTA-early echo, triple escalation, countdown inversion, single take) are legal; see `references/ad-exemplars.md` (Structure-Diverse Shapes).
- No scene runs longer than 2.5 seconds without a secondary beat (impact, metric tick, re-entrance, transition wind-up).

Keep each beat to one visual idea. Avoid paragraphs in video text; prefer short lines that fit mobile. In most scenes, use one headline plus one support line at most; make the dominant word or number much larger instead of spreading many equal-size text blocks. If a scene uses a source-backed numeric claim, include a `metric` plan with `from`, `to`, `prefix`/`suffix`, `decimals`, and a short label so the renderer can animate the value. For games, use fast kinetic shots; cuts are fine, but each shot should contain gameplay, product motion, character/world action, or a visual payoff rather than a static information card.
For social or short-video apps, cuts are expected. Each shot should feel like a feed moment, creator clip, notification, sound cue, live/shop moment, or action prompt instead of a static feature card.
Load `references/audio-caption-system.md` when adding music, sound effects, voiceover, captions, or silent-autoplay readability.

### 4. Template

If no project exists and `renderEngine` is `remotion`, copy `assets/remotion-template/` into the target workspace. If a Remotion project exists, adapt its existing package manager, entrypoint, and component style — and install `@remotion/google-fonts` if missing; the template imports it even when `fontPreset` stays on the no-network default.

If `renderEngine` is `hyperframes`, copy `assets/hyperframes-template/` or adapt the existing Hyperframes project. Hyperframes output is native HTML: `index.html` is the composition source, `variables.json` carries approved ad copy and asset paths, and QA uses `npx hyperframes lint`, `inspect`, `preview`, and `render`. Load `references/hyperframes-output.md` before implementation. For a new ad, author native Hyperframes HTML; do not use a Remotion-to-Hyperframes porting workflow unless the user explicitly asks to migrate existing Remotion source.

Remotion template rules:

- Use a Zod schema for input props.
- Keep scenes data-driven rather than hard-coded.
- Set each scene's `block` to a scene-block kind (`cold-open-payoff`, `split-before-after`, `device-frame`, `stat-slam`, `hero-morph`, `ui-takeover`, `charge-reveal`, `cta-card`, or `standard`) so the chosen concept's `structure` renders as distinct layouts and motion, not one repeated card. Map the concept's structure scene blocks onto these template blocks; add a new block component instead of forcing every scene through `standard`. `ui-takeover` (fake notification expands into the hero) and `charge-reveal` (progress-bar squeeze→slam) are purpose-built hook blocks — reach for them before inventing a weaker opener.
- Use Remotion `Composition`, `Sequence`, and `AbsoluteFill`.
- Parameterize platform, dimensions, duration, brand colors, CTA, offer, disclaimer, and scenes.
- Map the chosen `format` / `platform` into the actual composition dimensions and scene layout. Square and landscape outputs must not reuse the vertical layout unchanged.
- Prefer the harvested real product/app/store assets (icon, screenshots, feature graphic, OG image, brand colors). Use generated placeholders only to fill genuine gaps, clearly marked.
- Use the app/product's public store assets by default when a URL was supplied; they are standard inputs for install/UA ads. Store them under `public/<brand>/` and reference with `staticFile()`.
- Support animated metric/counter props for ratings, discounts, prices, savings, review counts, and game/app scores when those numbers are source-backed.
- Add generated synced SFX by default through props. Use a varied generated SFX palette with frame-locked `startFrame`, category, scene/anchor sync metadata, and visible-event cue descriptions, not one repeated click. Treat audio as a default implementation detail, not a required preflight or QA gate. Only plan or verify special audio when the user asks for silent-safe, music, voiceover, or platform-specific sound.
- Support `music-sfx` with a generated, licensed, or user-supplied music bed plus picture-locked SFX when the user requests music. Keep quick URL jobs and fast tests on default `sfx-only`.
- For commercial-quality, batch, or "more creative" requests, default to a full soundscape: music bed + dense SFX + a scripted `voiceover`. Write the voiceover as 3-5 spoken beats with varied delivery (energy, pace, tone) per `references/audio-caption-system.md` (Voiceover Scriptcraft), in `outputLanguage`. A generated TTS voice uses `rightsStatus: generated`.
- Add at least three motion systems: kinetic hook, animated product/asset reveal, and CTA emphasis. Include the concept's declared `spectacleMove` as a real on-screen beat (see `references/ad-exemplars.md` for the mechanics) so the spot has its "wait, what?" moment.
- Animate with the vocabulary in `references/motion-language.md`, not bare linear `interpolate`. Use `src/motion.ts` eases (`power3Out` entrances, `expoOut` count-ups, `backOut`/`springPop` pops) and `staggerDelay` for multi-element reveals, and reveal headlines/CTAs with `KineticText` (split words/chars) instead of fading whole text blocks. For shared-element reveals (screenshot→hero, before→after) use `FlipMove` (the `hero-morph` block is a ready example); for reward/spectacle/game beats (confetti, coins, score pops, explosions) use `Burst`.
- Give every scene boundary a directional handoff via `scene.transitionOut` (`whip-left`/`whip-right`/`whip-up`, `zoom-punch`, `luma-wipe`, or a deliberate `cut`). Never ship an all-`fade` spot, never repeat the same kind on consecutive boundaries, and align an SFX (`sfx-whoosh`, `sfx-impact`, `sfx-swipe`) to each boundary frame. Leave the final scene without a transition so the CTA holds.
- Make at least one landing physical per spot: a `scene.impact: { atFrame, strength }` beat (flash + camera shake) or a block's built-in slam (metric lock, CTA spring), synced to `sfx-impact`/`sfx-sub-boom` on the same frame. Use `scene.celebrate: { preset }` to fire a `Burst` payoff from props when a reward beat needs it.
- Pick a `fontPreset` that matches the brand register (`bold-geometric`, `condensed-impact`, `editorial-serif`, `rounded-friendly`, `mono-tech`) instead of shipping the default `clean-sans` Inter look; non-default presets load via `@remotion/google-fonts` (network needed once per render). Give exactly one scene (usually `stat-slam` or `cta-card`) `colorMode: "inverted"` so the spot has a color beat.
- When the audio plan includes a voiceover, also fill `props.captions` with word-synced karaoke captions (same timestamps as the voiceover track, `emphasis: true` on numbers and power words) — most feeds play muted, and an uncaptioned voiceover effectively does not exist. See `references/audio-caption-system.md` (Karaoke captions).
- Leave the film finish (`finish.grain` / `finish.vignette`, default on) enabled unless the concept's art direction calls for a flat look.
- For simple games, include at least one custom gameplay-loop animation inspired by the public screenshots or store description.
- Keep typography readable at mobile sizes; do not rely on dense body text.

For Remotion implementation details, use the Remotion best-practices skill when available, especially composition, parameter, assets, timing, transitions, audio, and subtitle rules.

Hyperframes template rules:

- Use `data-composition-id`, `data-start`, `data-duration`, `data-width`, and `data-height` on the root composition.
- Use `data-start`, `data-duration`, and `data-track-index` on every clip.
- Declare editable fields through `data-composition-variables` and pass values with `variables.json` / `--variables-file`.
- Include `width`, `height`, and `layoutMode` in `variables.json` and write them back to the composition `data-width` / `data-height` before render.
- Use `window.__hyperframes.getVariables()` for copy, CTA, colors, and local asset paths.
- Register a paused GSAP timeline in `window.__timelines`. Build it with the ease/stagger vocabulary in `references/motion-language.md` (this path uses GSAP directly): `power3.out` entrances, `expo.out`/`power3.out` count-ups, `back.out(1.7)` pops, and `stagger` for multi-element reveals.
- Keep product/app visuals local and rights-reviewed. Do not rely on remote URLs in final output.

### 5. Render QA

Load `references/render-qa-checklist.md` before handoff.

Minimum checks:

- Remotion: typecheck/build passes and still frames render for hook, middle, and CTA sections. For tests and iteration, use the fast lab low-resolution stills before full MP4.
- Hyperframes: `npx hyperframes lint` and `inspect` pass before preview/render.
- Text does not overflow or overlap.
- Visuals are present, not blank.
- Hook, middle, and CTA stills show different visual states.
- Source-backed numeric proof animates to the exact final value and is not rendered as a flat text-only proof card.
- Advertising-aesthetic QA passes using `references/ad-aesthetic-qa.md` for every job (a lean pass — scan the scorecard, fix anything obviously failing — is fine for fast tests; a full scored pass for commercial-quality).
- CTA, offer, and disclaimer match approved copy.
- Any unsupported claims are removed or rewritten.
- Output files and commands are reported.

For skill tests, default to half-size draft video output and do not rerender full-size MP4 for non-blocking polish. Use the blocking/non-blocking split in `references/fast-test-workflow.md`.

## Output Contract

Return:

- Source summary with claim confidence.
- `ad-brief.json` path or inline summary, including source type, `interactionLanguage`, `sourceLanguage`, `outputLanguage`, `renderEngine`, preflight answers/defaults, blockers, format, and audio mode.
- Preflight assumptions or user answers, including size preset and creative route.
- Chosen ad angle and target platform.
- Script and storyboard.
- Remotion props JSON or Hyperframes `variables.json`.
- Files changed or template path.
- Verification evidence.
- Known rights, license, or asset gaps.

## Common Mistakes

- Making a generic product video instead of an ad with a conversion goal.
- Starting Remotion code before deciding hook, proof, and CTA.
- Shipping a PPT-like sequence of text cards with fades.
- Animating everything with flat linear `interpolate` (no easing, no stagger, whole-block text fades) so motion feels cheap — use the ease/stagger/kinetic-typography vocabulary in `references/motion-language.md`.
- Ignoring available logo, favicon, OG image, screenshots, or brand colors from the source URL.
- Treating a game listing like a SaaS explainer instead of showing high-energy play.
- Rendering inferred or fabricated numbers as facts, or inflating real ones.
- Over-blocking: defaulting to bland generated placeholders or vague copy when the source's real public store assets (icon, screenshots) and public ratings/downloads were available to use.
- Referencing remote URLs in the final render instead of localizing assets under `public/<brand>/`.
- Overloading the screen with text that works in chat but not in video.
- Ignoring Remotion commercial license requirements.
