# Ad Intake

## Required Inputs

Use the smallest reliable source set:

- `source_url`: Product page, Google Play link, App Store link, landing page, or brief.
- `product_name`: Product, app, or service name.
- `target_customer`: Who the ad is for.
- `pain_or_desire`: Main problem, outcome, or use case.
- `conversion_goal`: Install, buy, trial, lead, waitlist, or retargeting.
- `size_preset`: Vertical, square, landscape, or a platform-specific alias.
- `duration_seconds`: 15, 30, or 45 unless the user asks otherwise.
- `assets`: Logo, screenshots, product images, clips, music, SFX, voice, fonts.
- `rights_status`: User-owned, licensed, generated, public reference only, or unknown.

If the user supplies only a URL, ask the compact questions in `preflight-questionnaire.md` only when the missing choice changes the output. Otherwise infer defaults and record them.

Recorded default:

- `audio_mode`: default `sfx-only`; ask only when the user requests silent-safe,
  music plus SFX, voiceover, or a specific sound direction.

## Source Confidence Tags

Tag every claim:

- `observed`: Directly visible in supplied or inspected source.
- `user_supplied`: Provided by the user.
- `inferred`: Reasonable interpretation, must be phrased softly.
- `blocked`: Not safe to use until confirmed.

Do not render `blocked` claims.

## Extraction Checklist

For product pages:

- Product name, category, price or offer, main benefit, proof points, images, variants, shipping or guarantee, CTA.

For app store pages:

- App name, category, rating count, screenshots, core features, target user, pricing or trial, privacy-sensitive claims.

For SaaS or landing pages:

- Value proposition, problem, workflow, differentiators, proof, integrations, target segment, CTA.

## Safety Rules

- Do not include secrets, tokens, one-time IDs, personal data, or private customer content in prompts, docs, screenshots, or videos.
- Do not assume reviews, app screenshots, music, logos, or product photos are commercially reusable.
- Regulated claims need supplied approved copy.
- Note whether Remotion commercial licensing needs review for the intended use.
