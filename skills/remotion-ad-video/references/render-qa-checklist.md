# Render QA Checklist

## Before Render

- Props JSON matches the Zod schema.
- Duration, fps, width, and height match the target platform.
- Local assets exist and remote assets load.
- Asset manifest exists when URL assets were harvested and the project has a stable `public/<brand>/` folder.
- If audio is promised, every audio file exists or every remote audio URL is reachable.
- If SFX are promised, an audio cue sheet maps each sound to a visible event.
- Claims tagged `blocked` are removed.
- CTA, offer, and disclaimer use approved copy.
- Brand colors have enough contrast.

## Commands

For the bundled template:

```bash
npm install
npm run typecheck
npm run still
npm run render
```

Adapt commands to the target repo package manager.

For sound-on renders:

```bash
ffprobe -v error -show_streams -select_streams a out/ad-video.mp4
ffmpeg -hide_banner -nostats -i out/ad-video.mp4 -af volumedetect -f null -
```

If `volumedetect` reports only near-silent levels for the full duration, the render is a silent draft even if an audio stream exists. When `audioMode` is `sfx-only`, `music-sfx`, or `voiceover`, that is blocking and must be fixed before handoff unless the user explicitly accepts a silent-safe draft.

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
- Sound-on renders are not full-duration silence.
- SFX line up with visible taps, swipes, pops, transitions, or CTA actions; remove any sound that feels detached.
- For commercial-quality requests, run the creative scorecard in `ad-aesthetic-qa.md`.

## Handoff Evidence

Report:

- Commands run and pass/fail status.
- Output paths for MP4 and stills.
- Any asset substitutions.
- Asset manifest path when generated.
- Audio mode, audio asset paths, and whether sound QA passed or the render is silent-safe.
- Remaining rights, license, or claim gaps.
- One assumption that could be wrong and what would disprove it for high-risk campaigns.
- Whether any remaining issues are blocking or non-blocking for the current test.
