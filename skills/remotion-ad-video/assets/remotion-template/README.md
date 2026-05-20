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
- Replace placeholder copy and image URLs with approved assets.
- For harvested assets copied under `public/<brand>/`, use `logoPath`, `heroImagePath`, or per-scene `imagePath` values such as `brand/product.jpg`.
- The default props include short generated SFX so draft renders are audible by default.
- Use `silent-safe` only when the user selects no audio or no generated/licensed/user-supplied audio can be used.
- Keep `audio.enabled` true only when `audio.tracks` points to audible generated, licensed, user-supplied, or otherwise rights-cleared music, SFX, or voiceover files.
- Confirm Remotion licensing and asset rights before commercial use.
