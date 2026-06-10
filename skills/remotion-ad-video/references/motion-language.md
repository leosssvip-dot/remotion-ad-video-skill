# Motion Language

The vocabulary for *how* things move. Strategy and storyboard decide what happens;
this decides whether it feels like an ad or a slide deck. The default failure mode
is animating everything with a bare linear `interpolate(...)` — values slide at
constant speed, nothing has weight, and the spot reads as cheap. Fix that here.

Techniques are ported from the GSAP skill vocabulary
(`github.com/greensock/gsap-skills`) onto each render engine.

## Engine map

- **Remotion (default):** use `src/motion.ts` (`eases`, `tween`, `staggerDelay`,
  `springPop`, `decayShake`, `holdFrames`, `squashLand`, `anticipate`, `cameraDrift`)
  plus `src/KineticText.tsx`, `src/SceneTransition.tsx`, and `src/Impact.tsx`.
  Names mirror GSAP so a storyboard `motionIdea` like `back.out(1.7)` or
  `stagger from center` maps 1:1 to code.
- **Hyperframes:** the timeline *is* GSAP (`gsap.timeline()` in the template). Use
  the GSAP eases directly — `power3.out`, `back.out(1.7)`, `expo.out`, `elastic`,
  yoyo pulses, `stagger: { each, from }`. The gsap-skills repo is the upstream
  reference for this path; nothing to port.

## 1. Easing — never animate linearly

Pick a curve by the *job*, not by taste. Entrances decelerate (`*Out`), exits
accelerate (`*In`), on-screen moves and camera drifts use `*InOut`.

| `eases` name (Remotion) | GSAP equiv | Feel | Use for |
|---|---|---|---|
| `power2Out` | `power2.out` | soft arrival | body copy, support lines, secondary visuals |
| `power3Out` | `power3.out` | decisive arrival | **the workhorse** — headlines, visuals, most entrances |
| `power4Out` | `power4.out` | hard, fast snap | impact words, hero slams |
| `expoOut` | `expo.out` | rushes then eases hard | **number count-ups**, progress bars, sweeps |
| `backOut` | `back.out(1.7)` | overshoot pop, no wobble | badges, chips, CTA buttons, stat cards, icons |
| `backOutSoft` | `back.out(1.1)` | restrained overshoot | flip3d text, subtle pops, visual frames |
| `backOutHard` | `back.out(2.6)` | aggressive pop | playful / game / reward beats |
| `elasticOut` | `elastic.out` | springy wobble | bouncy mascots, toy-like UI (use sparingly) |
| `bounceOut` | `bounce.out` | drops and bounces | falling objects landing, coins, pieces |
| `power2InOut` / `power3InOut` | `power2/3.inOut` | smooth both ends | moving an element A→B, panning, scrubbed reveals |
| `power2In` / `power3In` | `power2/3.in` | accelerate away | exits, things flying off-screen |
| `sineInOut` | `sine.inOut` | gentle loop | idle floats, pulses, ambient drift |
| `linear` | `none` | constant | only deliberate machine motion (bg drift, conveyor) |

```ts
// before — flat, lifeless
interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
// after — eased
import { eases, tween } from "./motion";
interpolate(frame, [0, 14], [0, 1], { easing: eases.power3Out, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
tween(frame, { start: 0, duration: 14, from: 0, to: 1, ease: "power3Out" }); // same thing, terser
```

## 2. Duration & timing (frames at 30 fps)

Ads are fast. When in doubt, shorter.

- Snap / pop: **6–10 frames** (`backOut`).
- Standard entrance: **12–16 frames** (`power3Out`).
- Number count-up: **24–40 frames** (`expoOut`) — long enough to read the climb.
- Camera / zoom / ambient drift: scene-length, `linear` or `sineInOut`.
- Exit: **8–12 frames** (`power2In`) — leave faster than you arrived.
- Always `clamp` both extrapolations so values hold at the ends of the window.

## 3. Stagger — choreograph multiple elements

Revealing N things at once is flat; offsetting them reads as designed. Use
`staggerDelay(index, total, { each | amount, from })` for the per-item delay.

- `from: "start"` — list items, steps, top-to-bottom benefits.
- `from: "center"` — headline words, hero reveals (energy radiates out).
- `from: "edges"` — framing, "closing in" moves.
- `from: "random"` — particles, confetti, scattered tiles, reward bursts (deterministic).
- `each` = frames between items (2–4 is punchy); or `amount` = total spread, split across all.

```ts
import { staggerDelay, tween } from "./motion";
items.map((item, i) => {
  const delay = staggerDelay(i, items.length, { each: 3, from: "start" });
  const p = tween(frame, { start: delay, duration: 12, ease: "power3Out" });
  return <Row style={{ opacity: p, transform: `translateY(${(1 - p) * 24}px)` }} />;
});
```

## 4. Kinetic typography (`KineticText`)

The single most ad-like text move: don't fade a headline as one block — split it
and stagger the units. Remotion port of GSAP SplitText.

- `split="words"` — **default for headlines.** Punchy, stays readable.
- `split="chars"` — CTAs, short power phrases, logo words. High energy; keep the
  string short (a long line becomes visual noise).
- `split="lines"` — multi-line benefit/feature copy cascading in.

```tsx
import { KineticText } from "./KineticText";
<KineticText as="h1" text={scene.headline} split="words" from="center"
  startFrame={2} perItem={2} duration={14} y={30} ease="power3Out"
  style={{ fontSize: 84, margin: 0 }} />
```

`enter` picks the per-unit move — vary it across scenes so headlines don't all
make the same gesture:

| `enter` | Move | Recommended ease | Use for |
|---|---|---|---|
| `rise` (default) | translate + fade | `power3Out` | the readable workhorse |
| `clip` | cut out of an invisible mask, no fade | `power4Out` | editorial "knife" reveals, premium hooks |
| `pop` | scale 0.4→1 | `backOutHard` | badges, CTAs, playful beats |
| `flip3d` | rotateX hinge from the top edge | `backOutSoft` | app/tech reveals, flipping stats |
| `blur` | 12px focus-in | `power3Out` | dreamy/premium openers |
| `slam` | scale 2.6→1 crash-in | `power3In` | impact words — pair with shake + flash |

`accentWords={["faster"]} accentColor={primaryColor}` paints the operative
word in the accent color (matching is case- and punctuation-insensitive;
applies to `split="words"`/`"chars"` only — `lines` ignores it).

Recipes:
- **Hook headline:** `words`, `from="center"`, `power3Out`, `y≈30` — or `enter="clip"` + `power4Out` for the knife cut.
- **CTA:** `chars`, `from="start"`, `backOut`, small `y`, optional `rotate`.
- **Stat slam:** `words`, `enter="slam"`, `power3In`, then shake + flash on the landing frame.
- **Stat label / eyebrow:** `chars`, fast `perItem` (1–2), `power4Out`.
- **Benefit list:** `lines`, `from="start"`, `power2Out`.

## 5. Motion per ad moment (cheatsheet)

| Moment | Move | Ease | Notes |
|---|---|---|---|
| Hook (0–2s) | headline words in + visual scale-up | `power3Out` + `backOut` | hit on the first beat |
| Demo / proof | element A→B, screenshot rise | `power3InOut` / `power3Out` | keep motion continuous, don't fully stop |
| Number / metric | count-up + chip pop | `expoOut` (value) + `backOut` (chip) | land on the exact approved value |
| Spectacle beat | surreal scale / physics burst | `backOutHard` / `bounceOut` + random stagger | the "wait, what?" frame |
| Scene handoff | `transitionOut`: whip / zoom-punch / luma-wipe | built-in | never all-fade; vary kinds; align whoosh/impact SFX |
| Landing / slam | flash + `decayShake` + `squashLand` | built-in / `backOut` | the world reacts, not just the element; sync sfx-impact |
| CTA (last 3s) | wind-up + `springPop` + squash + pulse | `backOut` + `springPop` | pulse loop with `sineInOut` |

## 6. Do / avoid (ported best practices)

- **Do** animate transforms (`transform: translate/scale/rotate`) and `opacity` —
  not layout properties (`width`, `height`, `top`, `left`), which are slow and janky.
- **Do** keep renders deterministic: no `Math.random()` / `Date.now()`. Use
  `staggerDelay(from: "random")` or the index-hash pattern for scatter.
- **Do** ease exits too — a hard linear cut-out undoes a nice entrance.
- **Avoid** one global fade between scenes as the only transition; declare a
  directional `transitionOut` per scene (§9) and give each scene an internal
  entrance on top of it.
- **Avoid** `elasticOut` / `bounceOut` on text or anything the viewer must read mid-motion.
- **Avoid** stacking max-energy on every element — choose one focal move per beat.

## 7. Shared-element morph (`FlipMove`)

Remotion port of GSAP Flip. Makes an element fly + resize between two known
rects (composition px) — the concepts the skill already names, made real:
"screenshot explodes into features", "before collapses into after", "icon
expands into a card". Both states are known, so nothing is measured at runtime.

```tsx
import { FlipMove } from "./FlipMove";
<FlipMove from={{ x: 460, y: 1190, width: 220, height: 220, rotation: -8 }}
          to={{ x: 72, y: 326, width: 936, height: 864 }}
          start={2} duration={20} ease="power3InOut" fade>
  <VisualFill asset={img} fallback="Product" primaryColor={color} />
</FlipMove>
```

- Use `power3InOut` (a move between two on-screen positions), not an `*Out`.
- Lay the child out at `to`; `from` is where it starts. `rotation` is optional on either rect.
- `arc={px}` bows the flight path on a quadratic bezier (positive = "up"
  relative to travel) — a straight morph is UI, an arc is animation. The
  underlying `quadBezier(p, p0, c, p1)` in `motion.ts` also returns the tangent
  angle for align-to-path rotation (coins arcing into a wallet, badges swinging
  in).
- The `hero-morph` scene block is a ready-made example (thumbnail → hero frame, arc 70).

## 8. Particle bursts (`Burst`)

Remotion port of GSAP Physics2DPlugin — N particles under velocity + angle +
gravity, deterministic per index (no `Math.random`). The reward / spectacle /
game primitive: confetti, coin showers, score pops, explosions.

```tsx
import { Burst } from "./Burst";
<Burst start={4} preset="confetti" colors={[primaryColor, "#fff"]} origin={{ x: "50%", y: "46%" }} />
```

- Presets: `confetti` (celebration / CTA land), `coins` (reward / score),
  `sparks` (magic / AI / generate beat), `debris` (impact / explosion).
- Override `baseAngle` (-90 = up), `spread`, `velocity` `[min,max]` px/sec,
  `gravity`, `size`, `life`, `count` as needed.
- Fire one as a metric lands, a CTA appears, or a level completes, and sync it
  to an `sfx-coin` / `sfx-combo-burst` / `sfx-success` cue.

## 9. Scene transitions (`transitionOut`)

The handoff between scenes is editing language, not decoration — it carries most
of the "cut by an editor" feel. Each scene declares how it exits via
`scene.transitionOut` in the props; `<SceneTransition>` (wired into `AdVideo`)
derives the next scene's entrance from the same spec so both sides move as one
camera gesture. The old behavior — every scene fading to the background color —
is the slide-deck failure mode; it is no longer the default.

| Kind | What happens | Pair with SFX | Use for |
|---|---|---|---|
| `cut` | hard cut (default) | — | fast factual sequences; blocks carry their own entrances |
| `whip-left` / `whip-right` / `whip-up` | synchronized push with ghost-trail motion blur | `sfx-whoosh` | energy handoffs, hook→pain, feed-native pace |
| `zoom-punch` | exit crash-zooms + blurs, hard cut, entry settles 1.3→1 under a 2-frame flash | `sfx-impact` / `sfx-bass-drop` | punchline→evidence, beat drops |
| `luma-wipe` | brand-color skewed panel sweeps; the cut hides under full cover | `sfx-swipe` | brand moments, into CTA |
| `fade` | legacy dip-to-background | — | deliberate breath only; an all-fade spot fails QA |

Rules: vary kinds across boundaries (never the same kind twice in a row), keep
the last scene exit-free so the CTA holds, and put the matching SFX on the
boundary frame (`sync.anchor: "scene-cut"` / `"transition-lead"`).

## 10. Impact & juice (the world reacts)

An element popping in with `backOut` is motion; the *frame* reacting to it is
weight. `motion.ts` primitives, all deterministic:

- `decayShake(frame, {start, amplitude, rotationDeg, seed})` — trauma-style
  camera shake with (1-t)² decay. Apply to the scene/block container on landing
  frames. heavy ≈ 18px, light ≈ 7px.
- `<ImpactFlash start={f} />` (`src/Impact.tsx`) — the classic 1-2 frame flash.
- `squashLand(frame, {land, intensity})` — volume-conserving squash & stretch on
  contact (`transformOrigin` on the contact edge).
- `anticipate(frame, {start, dip, dipFrames, releaseFrames})` — pre-pop wind-up
  dip that releases back to 1 while the pop plays; multiply into scale around a
  `springPop`.
- `holdFrames(frame, [{at, hold}])` — hit-stop: freeze local time 2-4 frames at
  the contact moment (run tweens off the remapped frame; keep flash/shake on the
  real frame).
- `cameraDrift(frame, sceneFrames, {seed})` — handheld micro-drift + scene-long
  4% push. `AdVideo`'s `CameraLayer` applies this to every scene automatically
  so no frame is ever fully static.

The bundled blocks already fire these (metric lock → punch + shake + flash, CTA
button → wind-up + spring + squash, hero morph → landing shake). Storyboards
trigger them per scene with `scene.impact: { atFrame, strength }` and a particle
payoff with `scene.celebrate: { preset, startFrame }` — always synced to an
impact-class SFX on the same frame.

The full impact idiom on a landing frame F: squash at F, flash F→F+2, shake
F→F+10, `Burst` debris from the contact point, `sfx-impact`/`sfx-sub-boom` at F.

## 11. Not yet ported (T3, niche)

Add these from gsap-skills the same way when a concept needs them:
- **DrawSVG** — stroke-draw underlines, checkmarks, connecting arrows.
- **MorphSVG** — icon-to-icon shape morphs.

(MotionPath's 90% case is covered: `quadBezier` in `motion.ts` + FlipMove's
`arc` option, §7.)
