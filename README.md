# remotion-ad-video-skill

[中文说明](README.zh-CN.md)

Create advertising videos from a URL with an AI coding agent and Remotion.
No video-generation AI required.

Built on [Remotion](https://github.com/remotion-dev/remotion), the React
framework for creating videos programmatically.

This project is an agent-agnostic skill and toolkit for turning product links,
app-store listings, landing pages, or product briefs into performance-oriented
Remotion ad video projects. The agent plans the ad; Remotion renders
deterministic React-based video. You do not need Sora, Runway, Pika, Kling, or
any other generated-video API.

## Demo Video
https://github.com/user-attachments/assets/5dbe2ade-fe7f-419f-8349-d73045320cd2

https://github.com/user-attachments/assets/8e3605dc-f776-4f62-b763-f618f6d7f8d8

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
  SKILL.md                         Main agent skill entrypoint
  agents/openai.yaml               Optional OpenAI/Codex listing metadata
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

## Agent Compatibility

The workflow is generic and can be used by any coding agent that can read local
files and run Node scripts.

- Codex / OpenAI-compatible skill loaders can install `skills/remotion-ad-video/`
  directly.
- Claude Code, Cursor, Windsurf, or other agents can load
  `skills/remotion-ad-video/SKILL.md` as the playbook and use the scripts in
  `scripts/`.
- The deterministic parts are plain Node scripts and a Remotion template; they
  are not tied to one agent runtime.

## Install With Your AI Agent

You do not need to install this manually. Open your coding agent and ask it to
install the skill for you.

Copy this prompt:

```text
Install the remotion-ad-video skill from this repository into my available
skills directory. Use a symlink if my agent supports it; otherwise copy
skills/remotion-ad-video. After installing, tell me how to reload or restart the
agent so the skill becomes available.
```

For Codex/OpenAI-compatible agents, the agent should install
`skills/remotion-ad-video/` into the local skills directory, then ask you to
reload the skill list.

## Quick Start

Use it from your AI agent. Give the agent a URL and ask it to create an ad
video project:

```text
Use the remotion-ad-video skill to create a 15s ad video for this product:
https://example.com/products/focus-lamp
```

Or with the OpenAI/Codex skill trigger:

```text
Use $remotion-ad-video to create a 15s vertical ad video for:
https://example.com/products/focus-lamp
```

The agent should:

1. Classify the URL and create `ad-brief.json`.
2. Ask only blocking preflight questions.
3. Harvest or request usable assets.
4. Propose ad concepts and pick the strongest route.
5. Create or update a Remotion project.
6. Render low-resolution stills before any MP4.
7. Report rights, asset, and claim gaps.

For normal use, you should let the agent run the scripts, create the Remotion
project, and render the draft. You do not need to run validation commands.

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

Ask your agent to run it:

```text
Use the remotion-ad-video skill to run the synthetic URL demo. Install any local
dependencies needed for examples/synthetic-url-ad, render one still frame first,
then render the demo video if the still looks correct.
```

## Fast Render Workflow

When you want faster iteration, ask the agent to use the fast render workflow.
The important rule is simple:

1. Render low-resolution still frames first.
2. Render a low-resolution preview only if motion timing needs review.
3. Render a half-size draft MP4 for normal review.
4. Render full-size output only after you approve the draft.

Copy this prompt:

```text
Use the fast Remotion ad workflow: render low-resolution stills first, then a
half-size draft MP4 only if the stills are correct. Do not render full-size video
until I approve the draft.
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

## Maintainer Checks

These commands are for maintainers and contributors, not normal skill users.

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

## Maintainer Release Checklist

This checklist is for maintainers preparing a public release. Normal users do
not need it.

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
- Run `npm run validate` before submitting changes.
- Do not commit generated render output, dependencies, secrets, or unlicensed
  third-party media.
