# Synthetic URL Ad Demo

This demo is safe for public repositories. It uses a fake product URL, synthetic
copy, and CSS-only visuals. No third-party product photos, logos, screenshots,
music, or generated-video AI are used.

## Source URL

```text
https://example.com/products/focus-lamp
```

## What It Shows

- URL classified as an ecommerce product.
- `ad-brief.json` created before storyboard or code.
- A 15s Remotion ad built from structured props.
- Programmatic visuals instead of a generated video model.

## Run

```bash
npm install
npm run still
npm run render
```

From the repository root, the fast lab can also stage this example:

```bash
node scripts/fast-ad-lab.mjs stills examples/synthetic-url-ad --frames 30,150,285,390 --scale 0.5
```
