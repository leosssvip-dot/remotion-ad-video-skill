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
- Each scene picks a layout via its `block` field: `cold-open-payoff`, `split-before-after`, `device-frame`, `stat-slam`, `cta-card`, or `standard` (the fallback). Set varied blocks so the ad's structure renders as distinct layouts and motion instead of one repeated card. Add a new block component in `src/AdVideo.tsx` and to `SceneBlockSchema` in `src/schema.ts` when a concept needs one.
- Replace placeholder copy and image URLs with approved assets.
- For harvested assets copied under `public/<brand>/`, use `logoPath`, `heroImagePath`, or per-scene `imagePath` values such as `brand/product.jpg`.
- The default props include a richer generated SFX palette so draft renders are audible by default without bundling external music.
- Generated SFX can use exact `startFrame` / `durationFrames` timing plus `sync.sceneId`, `sync.anchor`, `category`, and `event` metadata so cues can be reviewed against picture.
- To add music, set `audio.mode` to `music-sfx` and add a `kind: "musicBed"` track with a generated music preset or a licensed/user-supplied `src`.
- Use `silent-safe` only when the user selects no audio or no generated/licensed/user-supplied audio can be used.
- Keep `audio.enabled` true only when `audio.tracks` points to audible generated, licensed, user-supplied, or otherwise rights-cleared music, SFX, or voiceover files.
- Give each SFX track an `event` that names the visible trigger, such as a swipe, reveal, metric pop, or CTA hit.
- Confirm Remotion licensing and asset rights before commercial use.
