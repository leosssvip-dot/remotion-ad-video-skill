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

- Unlicensed reuse of third-party images, reviews, logos, music, voices, or screenshots.
- Long-form editorial videos where ad conversion is not the goal.
- Claims that need legal, medical, financial, or regulated proof unless the user supplies approved copy.

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

- Audio mode defaults to `sfx-only`; ask only if the user requests silent-safe, music, voiceover, or a platform-specific sound plan.

Minimum URL jobs must attempt to harvest favicon, touch icon, Open Graph image, visible logo or screenshots, and brand colors. Ecommerce product URLs must also attempt a product main image with `scripts/harvest-ecommerce-assets.mjs` before creative work starts; the linked item is the ad subject, and platform/store context stays secondary. Store usable public assets locally in the generated project `public/<brand>/` folder, create or update an asset manifest when practical, and reference assets with `staticFile()`.

Run `scripts/classify-ad-source.mjs` for URL jobs before creative work, passing `--interaction-language <current-user-language>` when known, `--project-dir <target-project>` when working inside an existing project, and `--render-engine remotion|hyperframes` only when the user explicitly chose one. Otherwise let `--render-engine auto` detect the engine. Write its output to `ad-brief.json` when a project directory exists. The brief is the source of truth for source type, language plan, render engine, render-engine reason, preflight defaults or answers, format, audio mode, blockers, and asset requirements. If `ad-brief.json` has blockers, includes `preflight_answers_required`, `render_engine_choice_required`, `render_engine_install_required`, or `assetPlan.status` is `blocked`/`user_required`, stop and ask for the missing decision or asset. Use `interactionPlan.choiceQuestions` for the first creative preflight step: ask only format and creative route first, in `interactionLanguage`. If the agent supports structured choice UI, present the choices there; otherwise use a text fallback with the same options. Audio defaults to audible synced SFX; ask about audio only when the user requests silent-safe, music, voiceover, or a platform-specific sound plan. Do not front-load the longer open-question list. Use `--preflight-mode defaults` only when the user explicitly approved skipping questions.

### 2. Strategy

Pick one primary ad angle before writing scenes. Load `references/creative-direction.md` before implementation to avoid static slide-deck output.

- Pain-point hook: problem first, product solves it.
- Demo proof: show the product or app doing the work.
- Offer conversion: discount, trial, bundle, or deadline.
- Social proof: rating, review, result, or usage proof.
- Comparison: before vs after or old way vs new way.
- Gameplay spectacle: imitate the high-energy core loop for simple games instead of explaining features.
- Feed-native spectacle: imitate fast swipe, creator clips, live/shop overlays, comment/like rails, and sound-reactive cuts for social or short-video apps.

Every claim must be tagged as `observed`, `user_supplied`, `inferred`, or `blocked`. Do not render `blocked` claims.

Every real commercial sample needs a thumb-stopping visual idea, not just copy. Examples: chat bubbles becoming completed tasks, before/after workflow collapse, a product screenshot exploding into features, or a terminal command triggering visible automation.

Every concept also needs a bold layout idea before storyboard or code: poster-scale type, one dominant visual, asymmetric composition, aggressive crop, oversized product/app frame, kinetic split screen, or a staged reveal. Avoid neat centered slide layouts unless the contrast or motion makes them feel like an ad.

When source-backed numeric proof exists, plan it as motion instead of static copy: ratings count up, discounts snap from 0 to the final percent, prices or savings roll into place, download/review counts tick upward, and scores burst like a game HUD. Use the exact approved number as the final value and never animate unsupported or inflated claims.

For simple games, especially app-store listings, the visual idea should usually be a gameplay-style simulation: falling pieces, swaps, merges, collisions, score pops, explosions, level-up moments, near-fail rescues, or reward cascades. Static screenshots alone are proof assets, not the ad.

For short-video, creator, or social-feed apps, the visual idea should usually be a feed-native simulation: a phone frame that scrolls or swaps content, creator imagery, UI rails, sound/effect stickers, LIVE or Shop chips when source-supported, and quick cuts that feel like the platform itself rather than a product explainer.

For commercial-quality requests, generate at least three distinct concepts before implementation unless the user asked for one exact direction. Score them with `references/variant-system.md` and implement the strongest concept or the user-selected concept.

### 3. Storyboard

Create a timed storyboard before code. Load `references/storyboard-contract.md` for the scene contract.
Use `outputLanguage` from `ad-brief.json` for all video-facing copy unless the user explicitly asks for another language.

Default 15s structure:

- 0-2s: Thumb-stopping hook with product visible.
- 2-6s: Demo, payoff, or proof without stopping motion.
- 6-11s: Main benefit, differentiator, or second payoff.
- 11-15s: CTA, offer, and disclaimer.

Keep each beat to one visual idea. Avoid paragraphs in video text; prefer short lines that fit mobile. In most scenes, use one headline plus one support line at most; make the dominant word or number much larger instead of spreading many equal-size text blocks. If a scene uses a source-backed numeric claim, include a `metric` plan with `from`, `to`, `prefix`/`suffix`, `decimals`, and a short label so the renderer can animate the value. For games, use fast kinetic shots; cuts are fine, but each shot should contain gameplay, product motion, character/world action, or a visual payoff rather than a static information card.
For social or short-video apps, cuts are expected. Each shot should feel like a feed moment, creator clip, notification, sound cue, live/shop moment, or action prompt instead of a static feature card.
Load `references/audio-caption-system.md` when adding music, sound effects, voiceover, captions, or silent-autoplay readability.

### 4. Template

If no project exists and `renderEngine` is `remotion`, copy `assets/remotion-template/` into the target workspace. If a Remotion project exists, adapt its existing package manager, entrypoint, and component style.

If `renderEngine` is `hyperframes`, copy `assets/hyperframes-template/` or adapt the existing Hyperframes project. Hyperframes output is native HTML: `index.html` is the composition source, `variables.json` carries approved ad copy and asset paths, and QA uses `npx hyperframes lint`, `inspect`, `preview`, and `render`. Load `references/hyperframes-output.md` before implementation. For a new ad, author native Hyperframes HTML; do not use a Remotion-to-Hyperframes porting workflow unless the user explicitly asks to migrate existing Remotion source.

Remotion template rules:

- Use a Zod schema for input props.
- Keep scenes data-driven rather than hard-coded.
- Use Remotion `Composition`, `Sequence`, and `AbsoluteFill`.
- Parameterize platform, dimensions, duration, brand colors, CTA, offer, disclaimer, and scenes.
- Map the chosen `format` / `platform` into the actual composition dimensions and scene layout. Square and landscape outputs must not reuse the vertical layout unchanged.
- Prefer real product/app visuals. Use generated placeholders only when clearly marked.
- Use harvested logo/icon/OG/screenshot assets when a URL was supplied and rights status is not blocked.
- Support animated metric/counter props for ratings, discounts, prices, savings, review counts, and game/app scores when those numbers are source-backed.
- Add generated synced SFX by default through props. Treat audio as a default implementation detail, not a required preflight or QA gate. Only plan or verify special audio when the user asks for silent-safe, music, voiceover, or platform-specific sound.
- Add at least three motion systems: kinetic hook, animated product/asset reveal, and CTA emphasis.
- For simple games, include at least one custom gameplay-loop animation inspired by the public screenshots or store description.
- Keep typography readable at mobile sizes; do not rely on dense body text.

For Remotion implementation details, use the Remotion best-practices skill when available, especially composition, parameter, assets, timing, transitions, audio, and subtitle rules.

Hyperframes template rules:

- Use `data-composition-id`, `data-start`, `data-duration`, `data-width`, and `data-height` on the root composition.
- Use `data-start`, `data-duration`, and `data-track-index` on every clip.
- Declare editable fields through `data-composition-variables` and pass values with `variables.json` / `--variables-file`.
- Include `width`, `height`, and `layoutMode` in `variables.json` and write them back to the composition `data-width` / `data-height` before render.
- Use `window.__hyperframes.getVariables()` for copy, CTA, colors, and local asset paths.
- Register a paused GSAP timeline in `window.__timelines`.
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
- Advertising-aesthetic QA passes using `references/ad-aesthetic-qa.md` for commercial-quality requests.
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
- Ignoring available logo, favicon, OG image, screenshots, or brand colors from the source URL.
- Treating a game listing like a SaaS explainer instead of showing high-energy play.
- Rendering product claims inferred from marketing copy as facts.
- Using remote assets without confirming commercial rights.
- Overloading the screen with text that works in chat but not in video.
- Ignoring Remotion commercial license requirements.
