# remotion-ad-video-skill

Create advertising videos from a URL with an AI coding agent and Remotion.
No video-generation AI required.

This project is a Codex skill and toolkit for turning product links, app-store
listings, landing pages, or product briefs into performance-oriented Remotion
ad video projects. The agent plans the ad; Remotion renders deterministic
React-based video. You do not need Sora, Runway, Pika, Kling, or any other
generated-video API.

## Why This Exists

Most AI video workflows send a prompt to a video model and wait. This skill
takes a different path:

```text
URL -> source classification -> ad-brief.json -> assets -> storyboard -> Remotion code -> draft video
```

That makes the output editable, repeatable, brand-safe, and testable in code.
It is designed for ads where the product, CTA, claims, format, and asset rights
matter.

## Features

- URL-to-ad workflow for ecommerce products, mobile games, social/content apps,
  SaaS/API products, local services, and generic mobile apps.
- Mandatory `ad-brief.json` contract so source type, creative route, format,
  audio mode, asset requirements, assumptions, and blockers are explicit before
  storyboard or code.
- Link-adapted preflight questions for creative intent, audience, proof,
  format, and sound.
- Ecommerce asset harvester with blocked-page detection and a fail-closed rule:
  if the product image cannot be confidently harvested, stop and request user
  assets.
- Fast Remotion lab for low-resolution stills, preview MP4, half-size draft
  MP4, and explicit full-size final render.
- Validation script for checking the skill package structure and key workflow
  contracts.
- Synthetic URL demo showing URL to Remotion ad video without third-party media.

## Repository Layout

```text
skills/remotion-ad-video/
  SKILL.md                         Main Codex skill entrypoint
  agents/openai.yaml               Skill listing metadata
  references/                      Workflow contracts and category playbooks
  assets/remotion-template/        Reusable Remotion starter project
  scripts/build_asset_manifest.mjs Skill-local asset manifest helper

scripts/
  classify-ad-source.mjs           URL/source classifier and ad-brief generator
  create-open-source-snapshot.mjs  Allowlisted sanitized publish snapshot
  harvest-ecommerce-assets.mjs     Ecommerce product image harvester
  fast-ad-lab.mjs                  Shared Remotion draft render runner
  validate-skill.mjs               Local structure/workflow validator

examples/synthetic-url-ad/
  ad-brief.json                    Fake URL brief, safe to publish
  src/                             CSS-only Remotion demo, no external media
```

## Requirements

- Node.js 20+
- npm or another Node package manager
- Chrome or Chromium for browser-backed ecommerce harvesting
- Remotion dependencies installed in `examples/ad-lab` or the active Remotion
  example project
- A valid Remotion license for the intended commercial use
- Rights-cleared product images, logos, music, SFX, voiceover, and claims for
  production ads

## Install The Skill Locally

Clone the repository, then copy or symlink the skill folder into your Codex
skills directory.

```bash
git clone <your-fork-url> remotion-ad-video-skill
cd remotion-ad-video-skill

mkdir -p "$HOME/.codex/skills"
ln -s "$(pwd)/skills/remotion-ad-video" "$HOME/.codex/skills/remotion-ad-video"
```

If you prefer copying:

```bash
mkdir -p "$HOME/.codex/skills"
cp -R skills/remotion-ad-video "$HOME/.codex/skills/remotion-ad-video"
```

Restart or reload Codex so the skill list is refreshed.

## Quick Start

Validate the skill package:

```bash
npm run validate
```

Create a draft brief from a URL:

```bash
node scripts/classify-ad-source.mjs "https://example.com/product" \
  --title "Example Product" \
  --brief-out examples/example-ad/ad-brief.json
```

For ecommerce product links, harvest candidate product assets before writing the
storyboard:

```bash
node scripts/harvest-ecommerce-assets.mjs "https://example.com/product" \
  --out-dir examples/example-ad/public/product \
  --brand "Example" \
  --expected-title "Example Product"
```

Create a Remotion project from the bundled template:

```bash
mkdir -p examples/example-ad
cp -R skills/remotion-ad-video/assets/remotion-template/. examples/example-ad/
cd examples/example-ad
npm install
```

Edit `src/default-props.json` and the React composition to match the selected
concept, storyboard, harvested assets, and approved claims.

## Synthetic URL Demo

The repository includes a safe demo at `examples/synthetic-url-ad/`.

It starts from a fake product URL:

```text
https://example.com/products/focus-lamp
```

The demo includes:

- `ad-brief.json` with the inferred ecommerce ad brief.
- `storyboard.md` with a 15s structure.
- `src/` with a CSS-only Remotion ad video.
- No third-party brand assets.
- No generated-video AI output.

Run it:

```bash
cd examples/synthetic-url-ad
npm install
npm run still
npm run render
```

## Fast Render Workflow

The shared lab avoids repeated project setup while testing variants.

Prepare the lab once:

```bash
node scripts/fast-ad-lab.mjs prepare
cd examples/ad-lab
npm install
cd ../..
```

Stage an example:

```bash
node scripts/fast-ad-lab.mjs stage examples/example-ad
```

Render low-resolution still frames first:

```bash
node scripts/fast-ad-lab.mjs stills examples/example-ad \
  --frames 30,150,285,390 \
  --scale 0.5
```

Render a low-resolution motion preview only when timing needs review:

```bash
node scripts/fast-ad-lab.mjs preview examples/example-ad --scale 0.35 --crf 30
```

Render the default half-size draft MP4:

```bash
node scripts/fast-ad-lab.mjs render examples/example-ad --scale 0.5 --crf 24
```

Render full-size output only after the draft is approved:

```bash
node scripts/fast-ad-lab.mjs final examples/example-ad --scale 1 --crf 18
```

## Recommended Agent Prompt

```text
Use $remotion-ad-video to turn this product or app link into a 15s ad.
Create ad-brief.json first, ask any blocking preflight questions, harvest usable
assets, propose three concepts, implement the strongest one in Remotion, render
low-resolution stills before any MP4, and report rights or asset gaps.
```

For quick tests, allow inferred defaults but still write them into
`ad-brief.json`.

## Output Artifacts

A normal ad build should produce:

- `ad-brief.json`: source type, goal, CTA, creative route, format, audio mode,
  assumptions, unresolved questions, and blockers.
- `public/<brand>/`: approved or harvested source assets.
- `src/default-props.json`: Remotion props for scenes, dimensions, CTA, assets,
  claims, and audio settings.
- Draft stills under `examples/<ad>/out/draft/`.
- Optional preview, draft MP4, and final MP4 under `examples/<ad>/out/`.

## Safety And Rights

- Do not imply this project grants rights to third-party product photos,
  screenshots, logos, music, voices, SFX, reviews, or store assets.
- Do not render unverified numeric claims, regulated claims, customer data,
  private URLs, API keys, tokens, or internal payloads.
- If ecommerce crawling is blocked or the main product image is not credible,
  stop and request user-provided product images.
- If audio is promised, include actual audible rights-cleared files or mark the
  result as a silent draft.
- Confirm Remotion licensing separately for commercial rendering and deployment.

## Validation

Run before publishing or opening a pull request:

```bash
npm run validate
```

Create a sanitized release snapshot:

```bash
npm run snapshot
```

Optional smoke tests:

```bash
node scripts/classify-ad-source.mjs \
  "https://play.google.com/store/apps/details?id=com.king.candycrushsaga" \
  --title "Candy Crush Saga" \
  --brief-out /tmp/candy-ad-brief.json

node scripts/fast-ad-lab.mjs stills examples/example-ad --frames 30,150 --scale 0.25
```

## Open-Source Release Checklist

- Create a sanitized snapshot instead of uploading the working directory:

```bash
node scripts/create-open-source-snapshot.mjs
```

The snapshot is written to `dist/open-source-snapshot/` and intentionally
excludes `.remotion/`, `node_modules/`, render outputs, harvested media, local
task records, env files, and unreviewed examples. The reviewed synthetic demo is
included.

- Choose and add a `LICENSE` file before publishing. This repository does not
  choose one for you.
- Remove or ignore `node_modules`, Remotion `out` folders, caches, draft MP4s,
  and any generated screenshots.
- Review `examples/*/public/` before publishing; the default `.gitignore`
  excludes it because it may contain harvested or generated media.
- Do not publish local agent task records such as `docs/tasks/` or
  `docs/PROGRESS.md` unless they have been reviewed and sanitized.
- Remove third-party scraped media unless you have redistribution rights.
- Replace private product links, customer names, tokens, local absolute paths,
  and one-time IDs in examples or docs.
- Keep only examples that are either fully synthetic or explicitly licensed for
  redistribution.
- Run the validation commands above.
- Tag the first release as pre-1.0 if the API and workflow may still change.

## Limitations

- This is a skill and workflow package, not a hosted rendering service.
- The classifier is deterministic and heuristic-based; agents should still
  verify source context before production work.
- Ecommerce pages may block crawling. The correct fallback is to request user
  images, not to fabricate product visuals.
- Ad creative quality still depends on the brief, usable assets, and iteration.

## Contributing

Keep changes scoped and verifiable:

- Update or add reference files when the workflow changes.
- Prefer deterministic scripts for repeated or fragile steps.
- Run `node scripts/validate-skill.mjs` before submitting changes.
- Do not commit generated render output, dependencies, secrets, or unlicensed
  third-party media.
