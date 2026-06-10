# Audio and Caption System

Use this when adding music, sound effects, voiceover, captions, or silent-autoplay readability. Short-form ads should work with sound on and still read with sound off.

## Audio Layers

Prefer three separate layers:

- `musicBed`: beat or loop that defines cut timing.
- `sfx`: whoosh, pop, snap, coin, click, glitch, riser, impact, or UI sound.
- `voiceover`: scripted narration that drives the hook, benefit, and spoken CTA.

Do not use copyrighted music, voices, or celebrity likenesses unless the user supplies rights-cleared assets. A generated TTS voice is allowed: mark it `rightsStatus: generated`.

## Audio Posture By Job Type

The soundscape scales with the ambition of the job, not a single global default:

- Quick URL jobs, fast tests, and first-pass iterations: `sfx-only` with short generated interaction sounds (or `silent-safe` if the user asks). Keep it cheap and fast.
- Commercial-quality requests, batch variants, or any "make it more creative / bolder" ask: default to a full soundscape — `music-sfx` plus a scripted `voiceover` — not bare `sfx-only`. A bold ad with no voice and a single repeated click sounds thin. Plan the music bed, dense SFX, and voiceover together.
- Always honor an explicit user audio choice over these defaults.

Audio is a default implementation detail, not a required preflight or QA gate. Do not interrogate the user about audio; pick the posture from the job type and proceed.

## Music Bed Decision

- Keep URL jobs on `sfx-only` by default.
- Use `music-sfx` only when the user asks for music, sound polish, a platform-native sound plan, or supplies a rights-cleared track.
- A music bed must be generated, licensed, or user-supplied. Never imply commercial reuse of platform music or trending songs from the source page.
- When using generated music, prefer a short loopable bed with a stable BPM so cuts and SFX can land on beat.
- When using user-supplied or licensed music, record source, license status, and allowed usage in the asset manifest or handoff.

## Voiceover Scriptcraft

When the job uses voiceover, treat it as a performance, not a flat readout of the
on-screen text. A rich voiceover is what makes an ad feel alive.

- Write a `voiceover` script with explicit beats, not one run-on sentence. A 15s
  spot usually has 3-5 spoken beats: a spoken hook, one or two benefit/proof
  beats, and a landed CTA. Give each beat its own line.
- The spoken hook should NOT just read the on-screen headline. Let voice and text
  play off each other — voice asks, text answers; voice teases, text reveals.
- Vary the delivery across beats. Annotate each line with a short `delivery` note:
  energy (whisper -> shout), pace (slow burn -> rapid-fire), and tone (deadpan,
  hyped, conspiratorial, urgent, warm). Flat, even narration is the failure mode.
- Use punchy fragments and concrete verbs over full grammatical sentences.
  "Glare? Gone. One tap." beats "This lamp will reduce the glare on your screen."
- Build to a peak. The energy should rise into the CTA so the spoken close lands
  the action ("Tap to try it." / "Get it free."), not trail off.
- Keep it tight: roughly 30-40 spoken words for 15s so the voice has room to
  breathe and hit beats; never wall-to-wall talk. Leave gaps for SFX and music
  to punch through.
- Match `outputLanguage` from `ad-brief.json`. Write the voiceover in the video's
  language, and caption it exactly if captions are on.
- A generated TTS voice is fine (`rightsStatus: generated`). Pick a voice persona
  that fits the brand energy and note it in the track. Never imitate a real,
  identifiable, or celebrity voice without cleared rights.
- Each `voiceover` track maps to its beat with `sync.sceneId` / `sync.anchor` and
  `startFrame` like any other cue, so lines land on the picture.

Voiceover beat example:

```json
{
  "kind": "voiceover",
  "rightsStatus": "generated",
  "persona": "hyped, fast, confident",
  "lines": [
    { "text": "Still squinting at your screen?", "delivery": "conspiratorial, slow", "sync": { "sceneId": "hook", "anchor": "scene-start" } },
    { "text": "One tap. Glare gone.", "delivery": "snap, punchy", "sync": { "sceneId": "demo", "anchor": "visual-lock" } },
    { "text": "Your desk, finally calm.", "delivery": "warm, settling", "sync": { "sceneId": "benefit", "anchor": "headline-enter" } },
    { "text": "Tap to try it free.", "delivery": "rising, urgent CTA", "sync": { "sceneId": "cta", "anchor": "cta-land" } }
  ]
}
```

The `lines` array above is the voiceover *script*. In the Remotion template each
spoken beat renders as its own audio track carrying the generated clip via `src`
or `preset` plus its `startFrame`/`sync`; the template audio schema strips unknown
fields, so do not expect a raw `lines` array in props to produce sound.

## Sync Discipline

- Every SFX track must map to a visible event: tap, click, swipe, card pop, score burst, block placement, CTA button press, transition, or reward.
- Write a cue sheet with `frame/time -> scene -> visual event -> sound` before final render when SFX are included.
- Prefer short interactive sounds over a generic music bed for test drafts.
- For `sfx-only`, generate or include small click/pop/whoosh/impact sounds before rendering; do not downgrade to `silent-safe` just because the user did not provide audio.
- If a sound does not have a clear on-screen trigger, remove it. A silent-safe ad is better than mismatched audio.
- Place cues within roughly 2-4 frames of the visual event unless intentionally leading a transition.

## Frame-Locked Cue Sheet

- Use exact `startFrame` for generated template SFX whenever the composition fps is known; keep `startSecond` as a readable mirror of `startFrame / fps`.
- Use `durationFrames` for short hits that must not smear across cuts. Use `durationSecond` only for external music, voiceover, or clips whose source timing matters more than frame trimming.
- Each SFX cue should include `sync.sceneId`, `sync.anchor`, and optional `sync.offsetFrames` so the sound can be audited against a visible scene event.
- Valid anchors should describe the picture event, for example `scene-start`, `scene-cut`, `headline-enter`, `visual-lock`, `metric-count`, `cta-land`, `transition-lead`, or `reward`.
- Treat a cue without `startFrame` or `sync.anchor` as a draft placeholder, not a final sound pass.

## SFX Palette

Use a varied palette instead of repeating one click or pop:

- Core UI: click, tap, pop, notification, success.
- Motion: swipe, whoosh, riser, stinger, impact.
- Game/app reward: coin, combo, burst, level-up, fail-rescue.
- Ecommerce/product: tactile snap, fabric, pack open, reveal hit, comparison snap.
- Social/feed: sticker pop, glitch, live ping, shop tap, camera shutter.
- Physical product: light switch, pack open, camera shutter, tactile snap, reveal hit.
- Proof/metric: count tick, sparkle, soft chime, notification.
- Bass/impact: sub boom, bass drop, impact, stinger.

Pick sounds by visual event and audio category. A 15s ad should usually use at least twelve distinct generated or rights-cleared SFX presets across product, transition, impact, UI, metric, reward, and notification categories unless the creative is intentionally restrained.

## Cue Density

- For `sfx-only`, plan roughly 8-14 picture-locked cues in a 15s ad.
- Use 0.5-1.5s spacing for high-energy social, game, and ecommerce ads; use fewer cues for premium or enterprise SaaS.
- Reserve risers for lead-ins, impacts for hook/CTA landings, and success sounds for final confirmation.
- If two visual events happen within 5 frames, use one stronger sound rather than stacking muddy hits.

## Mix Targets

- Generated SFX should be clearly audible but short; start around 0.35-0.75 volume and reduce repeated hits.
- Music beds should sit under SFX around 0.16-0.35 volume.
- If voiceover is present, lower music and nonessential SFX under speech.
- Treat near-silent output as blocking when `audio.enabled=true` and `audio.mode` is `sfx-only`, `music-sfx`, or `voiceover`.

## Implementation Contract

- Store local audio under `public/<brand>/audio/` and reference it with `staticFile()`, or use generated data-URI WAV clips / template presets for small template/test SFX.
- Set `audio.enabled` to `true` only when at least one track is present.
- Use one track per music bed, SFX hit, or voiceover clip so cuts can be timed precisely.
- Each track should include `kind`: `musicBed`, `sfx`, or `voiceover`.
- Each SFX track should include an audio category such as `product`, `transition`, `impact`, `ui`, `metric`, `reward`, or `notification`.
- Each generated template track should use a named `preset`; external tracks should use `src`.
- Each SFX track should include an `event` that names the visible trigger.
- Each final SFX track should include exact `startFrame`; include `durationFrames` for clipped hits and `sync.sceneId` / `sync.anchor` for reviewable cue timing.
- Each audio track must include `rightsStatus`: `user_supplied`, `licensed`, `generated`, `public_reference`, or `needs_verification`.
- A `voiceover` track may carry multiple `lines`, each with its own `text`, `delivery` note, and `sync`, or be split into one track per spoken beat. Either way, every spoken beat needs picture-locked `sync`. Record a `persona` for the voice. A generated TTS voiceover uses `rightsStatus: generated`.
- For silent-safe drafts, set `audio.enabled` to `false` and keep on-screen copy readable without sound.

## Timing

- Align scene cuts, sticker pops, score bursts, and CTA pulses to beat moments.
- In 15s ads, use audio events roughly every 0.5-1.5 seconds.
- Reserve the biggest impact sound for the hook payoff or CTA.
- Keep voiceover to roughly 30-40 spoken words for 15s across 3-5 beats; leave breathing gaps so SFX and music land. See `Voiceover Scriptcraft`.

## Captions

- Captions should support the ad, not duplicate every on-screen word.
- Use 1-2 short lines, high contrast, and safe-area margins.
- Burn in essential CTA or offer text for silent autoplay.
- If voiceover is present, caption claims exactly and keep source-backed proof separate.

### Karaoke captions (Remotion `CaptionTrack`)

Most feeds play muted — without burned-in, word-synced captions the voiceover
effectively does not exist. Whenever the ad has a voiceover track, also fill
`props.captions` (the template renders them via `src/CaptionTrack.tsx` as a
global layer that survives scene cuts):

```json
"captions": [
  { "text": "Your desk deserves better light",
    "startFrame": 12, "endFrame": 58,
    "words": [
      { "w": "Your", "atFrame": 12 },
      { "w": "desk", "atFrame": 18 },
      { "w": "deserves", "atFrame": 26 },
      { "w": "BETTER", "atFrame": 36, "emphasis": true },
      { "w": "light", "atFrame": 44 }
    ] }
]
```

- One entry per spoken sentence; use the same timestamps as the voiceover
  audio track so the words land on the voice.
- Each word pops in on its beat; the word being spoken is lit in the accent
  color; `emphasis: true` words land bigger, tilted, and stay lit in the
  accent color — mark the numbers, pain words, and brand names.
- Omit `words` to spread the words evenly across the window (fine for drafts;
  per-word beats read better).
- On `colorMode: "inverted"` scenes the caption accent automatically swaps to
  the background color for contrast — no extra work needed.

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
