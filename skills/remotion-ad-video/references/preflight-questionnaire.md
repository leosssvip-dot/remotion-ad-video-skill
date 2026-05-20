# Preflight Questionnaire

Use this after the first URL/source skim and before storyboard or Remotion code.
The goal is to learn what kind of ad creative the user wants, not to collect
generic project trivia.

Record the inferred defaults and user answers in `ad-brief.json`. Chat-only
answers are not enough; the storyboard and props must be traceable back to the
brief.

## Trigger Rules

- For URL-only requests, ask link-adapted questions before creative work by default.
- Do not treat "test this skill" as permission to skip questions. A test should still ask unless the user explicitly says to skip questions, use fastest possible defaults, or run a benchmark with inferred defaults.
- When proceeding without answers by explicit user request, the answer must include a short `Preflight defaults` block before work continues.
- For all URL jobs, create or update `ad-brief.json` with source type, goal,
  CTA, creative route, format, audio mode, unresolved questions, and blockers.
- Ask only unresolved questions; do not ask what the link already proves.
- The initial blocking preflight should be exactly three required choices:
  format, creative route, and audio mode.
- Format choices should be vertical, square, or landscape.
- If harvesting is blocked, stop and ask for user-provided product images,
  screenshots, logo, or approved media before making the ad.
- If product/app visuals cannot be harvested after crawler and browser-backed attempts, stop and ask the user to provide images or screenshots before making the ad.

## Interaction Adapter

Prefer agent-native structured choice UI when available. Use it for the first
three choices in `interactionPlan.choiceQuestions`: output size, creative route,
and audio mode. If structured choice UI is not available, use a text fallback
with the same options.

Do not ask the old 1-6 questionnaire up front. `unansweredQuestions` should
mirror only the three required choice questions. Ask open questions only after
the user has answered those choices, or when the user requests deeper creative
briefing.

Do not block a generic agent on UI support. The skill is universal: selectable
chips/forms/dropdowns are preferred, but plain chat questions are valid fallback.

## Optional Follow-Up Questions

After the three required choices are answered, ask at most 1-3 optional follow-up
questions only if they materially change the ad. Do not ask them as a required
1-6 list before storyboard.

- Goal/CTA: confirm the inferred conversion action only if the source is ambiguous.
- Audience/hook: ask who to target and whether the first 2 seconds should hit desire, pain, curiosity, offer, status, FOMO, or challenge.
- Proof/assets: ask which proof may be shown and whether page-harvested assets can be used as draft references.

## Default Block For Fast Tests

When proceeding without answers, write a compact block like:

```text
Preflight defaults: goal=purchase, audience=inferred from page, format=vertical 9:16, creative route=category-native product demo, assets=page-harvested public references, audio=synced SFX only.
```

If any default is high-risk or materially affects the creative, ask instead of
guessing.
