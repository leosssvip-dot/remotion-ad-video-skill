# Hyperframes Output

Use this reference when `ad-brief.json` resolves `renderEngine` to
`hyperframes`, the user asks for Hyperframes, the target repo is already a
Hyperframes project, or open-source licensing matters more than Remotion's
React-based authoring model.

## Engine Choice

- Render-engine selection order is explicit user/caller choice, existing target
  project stack, then local renderer availability.
- Use `renderEngine: "hyperframes"` when selected explicitly, when an existing
  Hyperframes project is present, or when it is the only locally available
  renderer.
- If both engines are available, ask the user. If neither is available, ask the
  user to choose one to install.
- Do not use Hyperframes' `remotion-to-hyperframes` workflow for a new ad. That
  workflow is for porting existing Remotion code; new ads should be native
  Hyperframes HTML.

## Project Shape

Copy `assets/hyperframes-template/` into the target project, or adapt an
existing Hyperframes project. Hyperframes requires Node.js 22+ and FFmpeg.

Core files:

- `index.html`: source of truth for the composition.
- `variables.json`: approved ad copy, CTA, colors, local asset paths, and
  format fields (`width`, `height`, `layoutMode`).
- `package.json`: local dev-loop commands.

Composition rules:

- The root composition is an HTML element with `data-composition-id`,
  `data-start`, `data-duration`, `data-width`, and `data-height`.
- Every clip has `data-start`, `data-duration`, and `data-track-index`.
- Declare editable fields on the `<html>` root with
  `data-composition-variables`.
- Read variables once in script with `window.__hyperframes.getVariables()`.
- Write `variables.width` and `variables.height` back to `data-width`,
  `data-height`, `--stage-width`, and `--stage-height` so square and landscape
  outputs do not render through the vertical starter layout.
- Register one paused GSAP timeline with
  `window.__timelines["<composition-id>"] = tl`.
- Keep internal ids and enum values in English. Use `outputLanguage` for
  rendered copy.

## Commands

Run the Hyperframes loop instead of Remotion commands:

```bash
npm install
npx hyperframes lint
npx hyperframes inspect --samples 12
npx hyperframes preview
npx hyperframes render --variables-file ./variables.json --quality draft
```

For handoff, report the Hyperframes Studio URL from `preview`, typically:

```text
http://localhost:<port>/#project/<project-directory-name>
```

## Asset And Audio Rules

- Store approved media locally next to the project, for example
  `assets/<brand>/logo.svg` and `assets/<brand>/hero.png`.
- Reference local asset paths through `variables.json`; do not hard-code remote
  URLs in the final composition.
- If `audioMode` is `sfx-only`, first create or choose a generated or
  rights-cleared SFX file, then add an explicit `<audio src="./assets/...">`
  clip in `index.html`. Do not leave empty audio tags or unresolved audio
  variables; Hyperframes lint requires concrete media `src` values. If no sound
  file exists yet, report that audio is not implemented in the current
  Hyperframes draft.

## QA Differences

For Hyperframes, replace Remotion still/typecheck gates with:

- `npx hyperframes lint` for composition and track structure.
- `npx hyperframes inspect` for timeline layout overflow and clipping.
- Browser preview for motion review.
- Draft render with `--quality draft` before full/high quality output.

The same ad QA still applies: product visible early, hook/middle/CTA differ,
text fits mobile, claims are approved, and rights gaps are reported.
