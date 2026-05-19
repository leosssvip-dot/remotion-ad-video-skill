# remotion-ad-video-skill Development Plan

## Roadmap Status

- Overall status: MVP skill package created
- Current phase: Skill workflow and reusable Remotion template
- Current milestone: Create a portable `remotion-ad-video-skill` open-source package
- Next milestone: Validate the skill against real product and app links
- Blockers: None
- Last roadmap review: 2026-05-19

## Goal

Create a reusable agent skill that turns product links, app store links, or product briefs into ad video plans and Remotion renderable templates without requiring a generated-video AI API.

## Business Context

The useful wedge is not generic Remotion code generation. The wedge is a repeatable ad production workflow: source intake, offer and angle selection, storyboard, Remotion props, render QA, and safe handoff.

## Scope

- Skill instructions for ad video creation with Remotion.
- Reference contracts for intake, storyboard, and render QA.
- A minimal Remotion starter template bundled as a skill asset.
- Local validation that checks the skill package shape.

## Non-Goals

- No hosted rendering service yet.
- No product scraper implementation yet.
- No live Remotion render in this empty repo.
- No claim that scraped third-party media is safe for commercial use.

## Acceptance Criteria

- The skill has valid `SKILL.md` metadata and product-facing `agents/openai.yaml`.
- The skill defines a complete intake-to-render-QA workflow.
- The bundled Remotion template is parametrized with Zod props.
- A local validation script passes.
