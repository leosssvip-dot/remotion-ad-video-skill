# Render QA Checklist

## Before Render

- Remotion: props JSON matches the Zod schema.
- Hyperframes: `variables.json` matches declared `data-composition-variables`
  and the root composition has the expected dimensions.
- Duration, fps, width, and height match the target platform.
- Local assets exist and remote assets load.
- Asset manifest exists when URL assets were harvested and the project has a stable `public/<brand>/` folder.
- Claims tagged `blocked` are removed.
- CTA, offer, and disclaimer use approved copy.
- Brand colors have enough contrast.

## Commands

For the bundled Remotion template:

```bash
npm install
npm run typecheck
npm run still
npm run render
```

Adapt commands to the target repo package manager.

For the bundled Hyperframes template:

```bash
npm install
npx hyperframes lint
npx hyperframes inspect --samples 12
npx hyperframes preview
npx hyperframes render --variables-file ./variables.json --quality draft
```

For fast skill tests, prefer the shared lab:

```bash
node scripts/fast-ad-lab.mjs stills examples/<brand>-ad --scale 0.5
node scripts/fast-ad-lab.mjs render examples/<brand>-ad --scale 0.5 --crf 24
node scripts/fast-ad-lab.mjs final examples/<brand>-ad --scale 1 --crf 18
```

Use `render` for half-size draft video review. Use `final` only for approved full-size production output.

## Visual Checks

Inspect hook, middle, and CTA stills:

- No blank frame.
- Product or app is visible in the first viewport.
- Text fits and does not overlap.
- Safe-area margins are respected.
- Scene transitions do not hide important copy.
- Disclaimer remains readable but does not dominate.
- For commercial-quality requests, run the creative scorecard in `ad-aesthetic-qa.md`.

## Handoff Evidence

Report:

- Commands run and pass/fail status.
- Output paths for MP4 and stills.
- Render engine used: Remotion or Hyperframes.
- Any asset substitutions.
- Asset manifest path when generated.
- Remaining rights, license, or claim gaps.
- One assumption that could be wrong and what would disprove it for high-risk campaigns.
- Whether any remaining issues are blocking or non-blocking for the current test.

Audio is default-on via generated SFX, but it is not part of required render QA.
Run audio-specific checks only when the user asks for music, voiceover,
silent-safe output, or sound polish.
