# Variant System

Use this for commercial-quality ads, batch requests, or whenever one concept may be too narrow. Do not implement five full videos by default; first create concise concepts, score them, then build the strongest or user-selected variant.

Record concepts in `concepts.json` per `references/concept-contract.md` and pass `node scripts/validate-creative.mjs <concepts.json>` before the storyboard. Pull mechanics from `references/ad-exemplars.md`.

## Default Variant Set

Create 3-5 concept cards:

- `Hook Shock`: strongest visual interruption in the first 2 seconds.
- `Demo Proof`: product behavior and proof are the main story.
- `Pain Relief`: old way is painful, product removes friction.
- `Social Proof`: rating, review, usage, or source-backed trust leads.
- `Offer CTA`: discount, trial, deadline, or explicit install/buy action leads.

For games, replace weak concepts with gameplay-loop variants. For social/feed apps, replace weak concepts with feed-native variants.

## Concept Card

Each concept should include:

- `angle`: one sentence.
- `insight`: the one true customer tension or surprising fact the ad weaponizes.
- `hookLine`: 3-8 words.
- `firstFrame`: what is visible at frame 0-30.
- `structure`: ordered scene blocks (>= 3) for this concept's arc, not the stock five scenes.
- `motionIdea`: the main moving system.
- `proof`: source-backed or user-supplied evidence.
- `cta`: one action.
- `risk`: rights, claim, or production concern.

## Scoring

Score each concept 1-5:

- `attention`: would the first 2 seconds stop scrolling?
- `nativeFit`: does it feel native to the platform/category?
- `productProof`: is the product actually visible or demonstrated?
- `conversion`: is there a clear reason to click/install/buy?
- `productionFeasibility`: can it be built with available assets in the current turn?
- `claimSafety`: are claims source-backed and low risk?
- `distinctiveness`: is the structure and hook mechanic distinct from the stock template and from the other concepts?
- `boldness`: how exaggerated, dramatized, and visually loud is it? A tasteful, restrained, presentation-safe idea scores low here on purpose. Boldness rates the creative register, never the truth of a claim.

Prefer the highest total score. Break ties by choosing the concept with stronger product proof and lower claim risk. The chosen concept must score `attention`, `distinctiveness`, and `boldness` at least 4, with `claimSafety` at least 3; if nothing clears that bar, generate bolder concepts instead of shipping the weakest passable one.

## Required Pushback

Reject or revise concepts that:

- Depend on unavailable footage.
- Need unauthorized music, voice, logo, or celebrity likeness.
- Make earnings, health, legal, financial, or performance claims without approval.
- Would still look like a sequence of static slides.
- Hide the product until after the first 2 seconds.

## Handoff

When delivering one built variant, include the chosen concept and one brief note on why the other concepts were not built. When delivering batch variants, keep claims and CTA consistent unless the user asks to test copy.
