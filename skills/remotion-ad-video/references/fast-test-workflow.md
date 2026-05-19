# Fast Test Workflow

Use this for skill tests, iteration, and first-pass creative QA. The goal is to make obvious issues cheap and reserve full MP4 render for the final candidate.

## Default Fast Path

1. Run source classification and create or update `ad-brief.json`:

```bash
node scripts/classify-ad-source.mjs "<url>" --brief-out examples/<brand>-ad/ad-brief.json
```

2. Harvest assets and create the source summary.
3. Generate concept cards and choose one direction using the brief.
4. Run text/claim/asset/secret checks before rendering.
5. Stage the example into the shared lab:

```bash
node scripts/fast-ad-lab.mjs stage examples/<brand>-ad
```

6. Render low-resolution stills. This command uses one Remotion bundle for the
   requested frames instead of re-bundling per frame:

```bash
node scripts/fast-ad-lab.mjs stills examples/<brand>-ad --frames 30,150,285,390 --scale 0.5
```

7. Inspect stills. If motion timing needs review, render a low-resolution preview:

```bash
node scripts/fast-ad-lab.mjs preview examples/<brand>-ad --scale 0.35 --crf 30
```

8. Render a half-size draft MP4 only after the stills or preview pass:

```bash
node scripts/fast-ad-lab.mjs render examples/<brand>-ad --scale 0.5 --crf 24
```

9. Render full-size production MP4 only when the user explicitly approves the final candidate:

```bash
node scripts/fast-ad-lab.mjs final examples/<brand>-ad --scale 1 --crf 18
```

## Blocking vs Non-Blocking

Blocking before full render:

- Blank or broken frame.
- Product/logo missing from hook.
- Text overlap that makes copy unreadable.
- Unsupported or risky claim rendered as fact.
- Actual secret, token, private URL, or customer data.
- Wrong product visual that could misrepresent the product.
- Typecheck or Remotion render failure.

Non-blocking for skill tests:

- Placeholder variable names such as `api_key`, `REACHAPI_BASE_URL`, or `PROJECT_KEY` when no real value is present.
- Minor copy polish that does not change claim meaning.
- A harvested asset kept in the manifest but not used.
- Small layout preference that does not impair readability.
- Dependency audit warnings inherited from the template.

Do not rerender full-size MP4 for non-blocking issues. Record them as notes unless the user asks for production polish.
Do not render full-size MP4 before low-resolution stills and draft video pass.

## Time Budget

For ordinary skill tests, target:

- 3-6 minutes to source summary, preflight defaults, concept score, and draft stills.
- 1-3 minutes for a low-resolution preview when motion timing needs review.
- Half-size draft MP4 is the default video deliverable for skill tests: vertical 540x960, square 540x540, landscape 960x540.
- Full-size MP4 is the expensive final step; run it only after the draft video is accepted or the user explicitly asks for production output.

If a task exceeds the budget, stop after the draft stills and report the blocker or decision needed.
