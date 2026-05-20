# remotion-ad-video-skill Development Plan

## Roadmap Status

- Overall status: MVP skill package published and iterating from real URL tests
- Current phase: Skill workflow and reusable Remotion template
- Current milestone: Create a portable `remotion-ad-video-skill` open-source package
- Next milestone: Improve deterministic intake and creative-route answer handling
- Blockers: None
- Last roadmap review: 2026-05-21

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
- No claim that crawling can bypass anti-bot or blocked ecommerce pages.
- No guarantee that public store or product media is commercially reusable.
- No claim that scraped third-party media is safe for commercial use.

## Acceptance Criteria

- The skill has valid `SKILL.md` metadata and product-facing `agents/openai.yaml`.
- The skill defines a complete intake-to-render-QA workflow.
- The bundled Remotion template is parametrized with Zod props.
- A local validation script passes.
