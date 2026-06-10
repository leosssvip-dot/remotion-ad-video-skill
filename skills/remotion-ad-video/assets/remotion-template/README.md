# Remotion Ad Template

Starter template for `remotion-ad-video`.

## Use

```bash
npm install
npm run dev
npm run still
npm run render
```

Edit `src/default-props.json` or pass another props file to Remotion.

## Notes

- The template is intentionally simple and data-driven.
- Each scene picks a layout via its `block` field: `cold-open-payoff`, `split-before-after`, `device-frame`, `stat-slam`, `hero-morph`, `ui-takeover` (fake notification expands into the hero), `charge-reveal` (progress-bar squeeze→slam), `cta-card`, or `standard` (the fallback). Set varied blocks so the ad's structure renders as distinct layouts and motion instead of one repeated card. Add a new block component in `src/AdVideo.tsx` and to `SceneBlockSchema` in `src/schema.ts` when a concept needs one.
- Each scene declares how it hands off to the next via `transitionOut`: `whip-left`, `whip-right`, `whip-up`, `zoom-punch`, `luma-wipe`, `cut` (default), or `fade`. Vary the kinds, never ship an all-fade spot, align an SFX to each boundary, and leave the final scene without one so the CTA holds. See `references/motion-language.md` §9.
- `impact: { "atFrame": n, "strength": "light" | "heavy" }` fires a screen shake + impact flash on a scene-local frame (0 = the scene's nominal start; `strength` defaults to heavy) — sync an `sfx-impact`/`sfx-sub-boom` cue to the same frame. `stat-slam`, `hero-morph`, `ui-takeover` (expand landing), and `charge-reveal` (slam, which also has built-in confetti — skip `celebrate` there) already fire their own landing impact; do not stack another on the same frame.
- `ui-takeover` scenes remap copy: `eyebrow` → app name, `headline` → notification title, `body` → notification body, `logoPath` → app icon, image → expanded hero; give them ≥3s (4s recommended). `charge-reveal` scenes: `body` → charging label, `headline` → payoff line; ≥4s recommended; sync `sfx-count-tick` to `chargeTimings(sceneFrames).tickFrames` from `src/ChargeBar.tsx`.
- `celebrate: { "preset": "confetti" | "coins" | "sparks" | "debris", "startFrame": n }` fires a particle burst (`startFrame` defaults to 40% of the scene). See `references/motion-language.md` §10.
- Scenes are assumed back-to-back (each `startSecond` = previous scene's end) — transitions anchor on the next scene's start frame.
- `fontPreset` sets the typography direction: `clean-sans` (default, no network), `bold-geometric`, `condensed-impact`, `editorial-serif`, `rounded-friendly`, `mono-tech`. Non-default presets load a display face via `@remotion/google-fonts` (network needed once per render).
- `colorMode: "inverted"` on one scene floods it with the primary color and flips text dark — the spot's color beat.
- `captions` renders word-synced karaoke captions above all scenes (the voiceover's visual carrier for muted feeds); `emphasis: true` words land bigger in the accent color. See `references/audio-caption-system.md`.
- `finish: { "grain": bool, "vignette": bool }` controls the film-finish overlays (both default on).
- Replace placeholder copy and image URLs with approved assets.
- For harvested assets copied under `public/<brand>/`, use `logoPath`, `heroImagePath`, or per-scene `imagePath` values such as `brand/product.jpg`.
- The default props include a richer generated SFX palette so draft renders are audible by default without bundling external music.
- Generated SFX can use exact `startFrame` / `durationFrames` timing plus `sync.sceneId`, `sync.anchor`, `category`, and `event` metadata so cues can be reviewed against picture.
- To add music, set `audio.mode` to `music-sfx` and add a `kind: "musicBed"` track with a generated music preset or a licensed/user-supplied `src`.
- Use `silent-safe` only when the user selects no audio or no generated/licensed/user-supplied audio can be used.
- Keep `audio.enabled` true only when `audio.tracks` points to audible generated, licensed, user-supplied, or otherwise rights-cleared music, SFX, or voiceover files.
- Give each SFX track an `event` that names the visible trigger, such as a swipe, reveal, metric pop, or CTA hit.
- Confirm Remotion licensing and asset rights before commercial use.
