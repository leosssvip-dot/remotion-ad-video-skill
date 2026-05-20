# Ad Brief Contract

Use `ad-brief.json` as the mandatory handoff artifact between source intake and
storyboard/code. It keeps the ad from drifting into a generic presentation and
makes unanswered creative or asset decisions explicit.

## When To Create It

- Create or update `ad-brief.json` after the first URL/source skim and before
  storyboard, Remotion props, or code.
- For URL jobs, run the deterministic source classifier first:

```bash
node scripts/classify-ad-source.mjs "<url>" --interaction-language zh-CN --brief-out examples/<brand>-ad/ad-brief.json
```

- If the user answers preflight questions, update `mode` to `answered` and move
  answered items out of `unansweredQuestions`.
- To write answered choices deterministically, pass `--format` and
  `--creative-route` with `--preflight-mode answered`.
- For quick tests, defaults are allowed, but defaults must be recorded in the
  brief instead of only mentioned in chat.
- `interactionLanguage` controls user-facing questions. `sourceLanguage` is
  detected from the URL/source content. `outputLanguage` controls video script,
  captions, CTA, and on-screen copy, and defaults to `sourceLanguage`.

## Required Fields

```json
{
  "schemaVersion": "1.0",
  "sourceUrl": "https://example.com/product",
  "generatedAt": "2026-05-19T00:00:00.000Z",
  "mode": "requires_input",
  "status": "blocked",
  "sourceType": "ecommerce_product",
  "classificationConfidence": 0.85,
  "classificationReasons": [],
  "productName": "Product",
  "interactionLanguage": "zh-CN",
  "sourceLanguage": "en",
  "outputLanguage": "en",
  "languagePlan": {
    "preflightQuestions": "zh-CN",
    "videoScriptAndCaptions": "en",
    "note": "Ask user-facing preflight questions in interactionLanguage. Generate video script, captions, and on-screen copy in outputLanguage unless the user explicitly overrides it."
  },
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
    "language": "zh-CN",
    "instructions": "先只询问 choiceQuestions。若 agent 支持可选择 UI，就用可选择 UI；否则用同样选项的文本 fallback。Audio 默认 sfx-only，除非用户要求 silent-safe、音乐或旁白，否则不要作为必答预检问题。",
    "requiredChoiceQuestionIds": ["format", "creativeRoute"],
    "choiceQuestions": [
      {
        "id": "format",
        "question": "选择输出尺寸。",
        "options": [
          {"label": "竖屏 9:16", "value": "vertical-9x16"},
          {"label": "方形 1:1", "value": "square-1x1"},
          {"label": "横屏 16:9", "value": "landscape-16x9"}
        ]
      },
      {
        "id": "creativeRoute",
        "question": "选择这个电商商品广告的主要创意路线。",
        "options": [
          {"label": "产品特写", "value": "product close-up"},
          {"label": "试用/生活方式", "value": "try-on/lifestyle"},
          {"label": "优惠促单", "value": "offer push"}
        ]
      }
    ],
    "openQuestions": []
  },
  "unansweredQuestions": [
    "format: 选择输出尺寸。 选项: 竖屏 9:16=vertical-9x16, 方形 1:1=square-1x1, 横屏 16:9=landscape-16x9.",
    "creativeRoute: 选择这个电商商品广告的主要创意路线。 选项: 产品特写=product close-up, 试用/生活方式=try-on/lifestyle, 优惠促单=offer push."
  ],
  "assumptions": [],
  "blockers": ["preflight_answers_required"]
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
  supported, or text fallback when not supported. Use
  `interactionPlan.language` / `interactionLanguage` for those questions. Do
  not ask the longer optional follow-up questions as the initial required
  prompt.
- Audio defaults to `sfx-only`; do not ask audio as a required preflight choice
  unless the user requests silent-safe, music, voiceover, or a specific sound
  direction.
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
- `interactionLanguage` drives user-facing questions.
- `outputLanguage` drives script, captions, CTA, and on-screen copy.
