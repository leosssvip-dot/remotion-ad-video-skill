# Ad Brief Contract

Use `ad-brief.json` as the mandatory handoff artifact between source intake and
storyboard/code. It keeps the ad from drifting into a generic presentation and
makes unanswered creative or asset decisions explicit.

## When To Create It

- Create or update `ad-brief.json` after the first URL/source skim and before
  storyboard, Remotion props, or code.
- For URL jobs, run the deterministic source classifier first:

```bash
node scripts/classify-ad-source.mjs "<url>" --brief-out examples/<brand>-ad/ad-brief.json
```

- If the user answers preflight questions, update `mode` to `answered` and move
  answered items out of `unansweredQuestions`.
- For quick tests, defaults are allowed, but defaults must be recorded in the
  brief instead of only mentioned in chat.

## Required Fields

```json
{
  "schemaVersion": "1.0",
  "sourceUrl": "https://example.com/product",
  "generatedAt": "2026-05-19T00:00:00.000Z",
  "mode": "defaults",
  "status": "draft",
  "sourceType": "ecommerce_product",
  "classificationConfidence": 0.85,
  "classificationReasons": [],
  "productName": "Product",
  "goal": "purchase",
  "cta": "Shop now",
  "audience": "inferred from source; needs confirmation",
  "hookFocus": "curiosity",
  "creativeRoute": "product close-up",
  "proofPlan": {
    "allowed": [],
    "blocked": [],
    "notes": "Only render observed or user-approved claims."
  },
  "assetPlan": {
    "status": "weak",
    "rightsStatus": "needs_verification",
    "required": ["product main image", "brand/logo"],
    "notes": "Run harvesting before storyboard."
  },
  "format": {
    "preset": "vertical-9x16",
    "width": 1080,
    "height": 1920,
    "renderScale": 0.5,
    "draftWidth": 540,
    "draftHeight": 960
  },
  "durationSeconds": 15,
  "audioMode": "sfx-only",
  "interactionPlan": {
    "preferredMode": "structured_choices",
    "fallbackMode": "text",
    "instructions": "Ask only choiceQuestions first. If the agent supports selectable UI, use it; if not, render the same choices as text fallback.",
    "requiredChoiceQuestionIds": ["format", "creativeRoute", "audioMode"],
    "choiceQuestions": [
      {
        "id": "format",
        "question": "Choose the output size.",
        "options": [
          {"label": "Vertical 9:16", "value": "vertical-9x16"},
          {"label": "Square 1:1", "value": "square-1x1"},
          {"label": "Landscape 16:9", "value": "landscape-16x9"}
        ]
      }
    ],
    "openQuestions": []
  },
  "unansweredQuestions": [
    "format: Choose the output size. Options: Vertical 9:16=vertical-9x16, Square 1:1=square-1x1, Landscape 16:9=landscape-16x9."
  ],
  "assumptions": [],
  "blockers": []
}
```

## Allowed Values

`status`:

- `draft`: inferred defaults, not user-approved.
- `answered`: user answered enough questions to proceed.
- `blocked`: missing assets or decisions prevent a truthful ad.
- `approved`: user-approved final creative brief.

`sourceType`:

- `ecommerce_product`
- `mobile_game`
- `social_content_app`
- `saas_api`
- `service_local`
- `mobile_app`
- `unknown`

`assetPlan.status`:

- `confirmed`: required visuals are available and usable.
- `weak`: visuals exist but quality/fit/rights need review.
- `blocked`: crawler/browser failed or assets do not match the product.
- `user_required`: stop and ask the user for product images, screenshots, logo,
  or approved media.

## Blocking Rules

- If `blockers` is non-empty, do not storyboard or render. Resolve blockers
  first.
- If `blockers` includes `preflight_answers_required`, ask
  `interactionPlan.choiceQuestions` first using structured choices when
  supported, or text fallback when not supported. Do not ask the longer
  optional follow-up questions as the initial required prompt.
- If `assetPlan.status` is `blocked` or `user_required`, stop and ask the user
  for assets. Do not make a fake product ad.
- For ecommerce product links, do not proceed without a credible product main
  image or user-provided product visual.
- For audio, do not promise sound unless `audioMode` maps to real rights-cleared
  files or generated cue assets in props.

## Storyboard Traceability

The storyboard and `default-props.json` should cite these brief values:

- `sourceType` drives the category-native creative route.
- `goal` and `cta` drive the final call-to-action.
- `hookFocus` drives the first 2 seconds.
- `creativeRoute` drives motion language and scene structure.
- `proofPlan.allowed` is the only source for rendered proof claims.
- `assetPlan.required` drives harvesting and visual QA.
- `format` and `durationSeconds` drive Remotion composition settings.
- `interactionPlan.choiceQuestions` drives agent-native selectable preflight UI
  when supported.
