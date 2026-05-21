# Hyperframes Ad Template

This is the Hyperframes output starter for `remotion-ad-video`.

Use it when `ad-brief.json` has `"renderEngine": "hyperframes"`.

```bash
npm run lint
npm run inspect
npm run preview
npm run render
```

Hyperframes requires Node.js 22+ and FFmpeg. Keep all media local, then pass
approved copy and asset paths through `variables.json`:

```bash
npx hyperframes render --variables-file ./variables.json --quality draft
```

For non-vertical formats, update `data-width`, `data-height`, and the layout
CSS in `index.html` to match the brief.

If adding SFX or music, first place the rights-cleared file locally, then add an
explicit `<audio src="./path/to/file.wav" class="clip" ...>` clip in
`index.html`. Do not leave an empty audio tag in the starter; Hyperframes lint
requires concrete media `src` values.
