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
  "unansweredQuestions": [],
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
