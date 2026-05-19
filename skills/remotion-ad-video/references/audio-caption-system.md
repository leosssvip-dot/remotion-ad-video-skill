# Audio and Caption System

Use this when adding music, sound effects, voiceover, captions, or silent-autoplay readability. Short-form ads should work with sound on and still read with sound off.

## Audio Layers

Prefer three separate layers:

- `musicBed`: beat or loop that defines cut timing.
- `sfx`: whoosh, pop, snap, coin, click, glitch, riser, impact, or UI sound.
- `voiceover`: optional short narration for clarity or offer.

Do not use copyrighted music, voices, or celebrity likenesses unless the user supplies rights-cleared assets.
If no rights-cleared or generated audio is available, call the output a silent-safe draft. Do not say the video has SFX, music, or voiceover unless the Remotion composition includes audible audio tracks.

## Sync Discipline

- Every SFX track must map to a visible event: tap, click, swipe, card pop, score burst, block placement, CTA button press, transition, or reward.
- Write a cue sheet with `time -> visual event -> sound` before final render when SFX are included.
- Prefer short interactive sounds over a generic music bed for test drafts.
- If a sound does not have a clear on-screen trigger, remove it. A silent-safe ad is better than mismatched audio.
- Place cues within roughly 2-4 frames of the visual event unless intentionally leading a transition.

## Implementation Contract

- Store local audio under `public/<brand>/audio/` and reference it with `staticFile()`.
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

## QA

- Mute test: the ad still communicates product, benefit, and CTA.
- Sound-on test: audio reinforces cuts instead of feeling pasted on.
- Rights test: every music, SFX, and voice asset has a rights status.
- Mix test: voice and key SFX are not buried by music.
- Render test: if audio is promised, run `ffprobe` to confirm an audio stream and `ffmpeg ... volumedetect` or `silencedetect` to confirm it is not full-duration silence.
