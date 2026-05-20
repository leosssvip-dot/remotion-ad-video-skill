# Audio and Caption System

Use this when adding music, sound effects, voiceover, captions, or silent-autoplay readability. Short-form ads should work with sound on and still read with sound off.

## Audio Layers

Prefer three separate layers:

- `musicBed`: beat or loop that defines cut timing.
- `sfx`: whoosh, pop, snap, coin, click, glitch, riser, impact, or UI sound.
- `voiceover`: optional short narration for clarity or offer.

Do not use copyrighted music, voices, or celebrity likenesses unless the user supplies rights-cleared assets.
Default URL ads should use `sfx-only` with short generated interaction sounds unless the user selects `silent-safe`. Audio is a default implementation detail, not a required preflight or QA gate.

## Sync Discipline

- Every SFX track must map to a visible event: tap, click, swipe, card pop, score burst, block placement, CTA button press, transition, or reward.
- Write a cue sheet with `time -> visual event -> sound` before final render when SFX are included.
- Prefer short interactive sounds over a generic music bed for test drafts.
- For `sfx-only`, generate or include small click/pop/whoosh/impact sounds before rendering; do not downgrade to `silent-safe` just because the user did not provide audio.
- If a sound does not have a clear on-screen trigger, remove it. A silent-safe ad is better than mismatched audio.
- Place cues within roughly 2-4 frames of the visual event unless intentionally leading a transition.

## Implementation Contract

- Store local audio under `public/<brand>/audio/` and reference it with `staticFile()`, or use generated data-URI WAV clips for small template/test SFX.
- Set `audio.enabled` to `true` only when at least one track is present.
- Use one track per music bed, SFX hit, or voiceover clip so cuts can be timed precisely.
- Each audio track must include `rightsStatus`: `user_supplied`, `licensed`, `generated`, `public_reference`, or `needs_verification`.
- For silent-safe drafts, set `audio.enabled` to `false` and keep on-screen copy readable without sound.

## Timing

- Align scene cuts, sticker pops, score bursts, and CTA pulses to beat moments.
- In 15s ads, use audio events roughly every 0.5-1.5 seconds.
- Reserve the biggest impact sound for the hook payoff or CTA.
- Keep voiceover under 35 spoken words for 15s.

## Captions

- Captions should support the ad, not duplicate every on-screen word.
- Use 1-2 short lines, high contrast, and safe-area margins.
- Burn in essential CTA or offer text for silent autoplay.
- If voiceover is present, caption claims exactly and keep source-backed proof separate.

## Platform Notes

- TikTok/Reels/Shorts: punchy SFX, rhythmic cuts, captions low or mid-low.
- Games: combo, burst, reward, fail-rescue, and level-up sounds.
- SaaS/productivity: click, complete, send, success, notification, whoosh.
- Ecommerce: tactile product sounds, reveal hits, comparison snaps.

## Optional Audio Review

Only do this when the user explicitly asks for audio review, music, voiceover,
silent-safe output, or platform-specific sound polish:

- Sound-on check: audio reinforces cuts instead of feeling pasted on.
- Rights check: every music, SFX, and voice asset has a rights status.
- Mix check: voice and key SFX are not buried by music.
- Stream check: use `ffprobe` only when audio deliverables are part of the ask.
