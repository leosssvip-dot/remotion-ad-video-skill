import { Easing, interpolate, spring } from "remotion";

/**
 * Motion vocabulary for ad video.
 *
 * Ported from the GSAP ease/stagger vocabulary (greensock/gsap-skills) onto
 * Remotion's frame-based `Easing` + `spring`. Names mirror GSAP so a storyboard
 * "motionIdea" written as `back.out(1.7)` or `stagger from center` maps 1:1 to
 * code here. See references/motion-language.md for when to use which.
 *
 * Rule of thumb: never animate a value linearly unless you want a "machine"
 * feel (e.g. a constant background drift). Entrances decelerate (`*Out`),
 * exits accelerate (`*In`), and anything that should feel physical pops with
 * `backOut` / `springPop`.
 */

// ── Ease catalog ────────────────────────────────────────────────────────────
// Each entry is a Remotion easing function usable as `interpolate(..., { easing })`.
export const eases = {
  // power-of-N out: accelerate then decelerate to rest. Higher N = sharper snap.
  power1Out: Easing.out(Easing.ease), //  gentle settle
  power2Out: Easing.out(Easing.quad), //  default entrance
  power3Out: Easing.out(Easing.cubic), //  decisive entrance — the workhorse
  power4Out: Easing.out(Easing.poly(4)), //  hard, fast arrival
  // ins (use for exits — fast departure)
  power2In: Easing.in(Easing.quad),
  power3In: Easing.in(Easing.cubic),
  // inOut (use for moves between two on-screen positions, camera drifts)
  power2InOut: Easing.inOut(Easing.quad),
  power3InOut: Easing.inOut(Easing.cubic),
  // specialty curves
  expoOut: Easing.out(Easing.exp), //  rushes then eases hard — best for counters
  circOut: Easing.out(Easing.circle), //  late, smooth deceleration
  sineInOut: Easing.inOut(Easing.sin), //  loops / floats
  // overshoot (springy pop without the wobble of elastic) — GSAP back.out(s)
  backOutSoft: Easing.out(Easing.back(1.1)),
  backOut: Easing.out(Easing.back(1.7)), //  GSAP default overshoot
  backOutHard: Easing.out(Easing.back(2.6)),
  // wobble / impact
  elasticOut: Easing.out(Easing.elastic(1)),
  bounceOut: Easing.out(Easing.bounce),
  // escape hatch — constant velocity
  linear: Easing.linear,
} as const;

export type EaseName = keyof typeof eases;

// ── tween: eased interpolate ────────────────────────────────────────────────
// Drop-in replacement for the bare `interpolate(frame, [a,b], [from,to], {clamp})`
// pattern, but eased by default. Always clamps so values never overshoot the
// frame window.
export const tween = (
  frame: number,
  opts: {
    start?: number; // frame the tween begins (default 0)
    duration: number; // length in frames
    from?: number; // start value (default 0)
    to?: number; // end value (default 1)
    ease?: EaseName; // default power3Out
  },
): number => {
  const { start = 0, duration, from = 0, to = 1, ease = "power3Out" } = opts;
  return interpolate(frame, [start, start + Math.max(1, duration)], [from, to], {
    easing: eases[ease],
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

// ── stagger ─────────────────────────────────────────────────────────────────
// GSAP `stagger: { each | amount, from }` ported to a per-index frame delay.
// Use to choreograph feature rows, icon grids, list items, particles, and the
// characters/words inside KineticText.
export type StaggerFrom = "start" | "end" | "center" | "edges" | "random";

// Deterministic 0..1 hash (no Math.random — renders must be reproducible across
// frames and threads). Same pattern the audio synth in AdVideo.tsx already uses.
const hash01 = (i: number): number => {
  const v = Math.sin((i + 1) * 12.9898 + 4.1414) * 43758.5453;
  return v - Math.floor(v);
};

export const staggerDelay = (
  index: number,
  total: number,
  opts: {
    each?: number; // frames between consecutive items
    amount?: number; // OR: total spread in frames, divided across items
    from?: StaggerFrom; // origin of the wave (default "start")
  },
): number => {
  const n = Math.max(1, total);
  const last = n - 1;
  const { each, amount, from = "start" } = opts;
  const per = each ?? (last > 0 ? (amount ?? 0) / last : 0);
  let rank: number;
  switch (from) {
    case "end":
      rank = last - index;
      break;
    case "center":
      rank = Math.abs(index - last / 2);
      break;
    case "edges":
      rank = last / 2 - Math.abs(index - last / 2);
      break;
    case "random":
      rank = hash01(index) * last;
      break;
    default:
      rank = index; // "start"
  }
  return rank * per;
};

// ── springPop: physical entrance ────────────────────────────────────────────
// Remotion spring tuned for an ad "pop" (CTA buttons, badges, stat chips, icon
// reveals). Returns 0..~1 with a slight overshoot. Multiply into scale/opacity.
export const springPop = (
  frame: number,
  fps: number,
  opts: { start?: number; mass?: number; damping?: number; stiffness?: number } = {},
): number => {
  const { start = 0, mass = 0.6, damping = 12, stiffness = 200 } = opts;
  return spring({
    frame: frame - start,
    fps,
    config: { mass, damping, stiffness },
  });
};

// ── physics2D: ballistic integrator ─────────────────────────────────────────
// GSAP Physics2DPlugin ported to a pure, deterministic frame function. Returns
// the {x, y} pixel offset of a particle launched at `start` with initial
// `velocity` (px/sec) at `angle` under `gravity` (px/sec²). Angle convention:
// 0 = right, 90 = down, -90 = straight up (screen y points down). Drives the
// <Burst> component (confetti, coins, sparks, debris) for game + spectacle beats.
export const physics2D = (
  frame: number,
  fps: number,
  opts: { start?: number; velocity: number; angle: number; gravity?: number },
): { x: number; y: number; t: number } => {
  const { start = 0, velocity, angle, gravity = 1400 } = opts;
  const t = Math.max(0, (frame - start) / fps);
  const rad = (angle * Math.PI) / 180;
  return {
    x: velocity * Math.cos(rad) * t,
    y: velocity * Math.sin(rad) * t + 0.5 * gravity * t * t,
    t,
  };
};

// ── decayShake: trauma-style camera shake ───────────────────────────────────
// Impact feedback lives on the whole camera, not the element that landed: shake
// the scene container and the viewer's vestibular system reads "weight". Multi-
// sine deterministic noise, amplitude decays with (1-t)². Pair with sfx-impact
// or sfx-sub-boom on the same frame. heavy ≈ amplitude 18, light ≈ 7.
export const decayShake = (
  frame: number,
  opts: { start?: number; durationFrames?: number; amplitude?: number; rotationDeg?: number; seed?: number },
): { x: number; y: number; rot: number } => {
  const { start = 0, durationFrames = 10, amplitude = 14, rotationDeg = 0.8, seed = 0 } = opts;
  const t = (frame - start) / Math.max(1, durationFrames);
  if (t < 0 || t >= 1) {
    return { x: 0, y: 0, rot: 0 };
  }
  const decay = (1 - t) * (1 - t);
  const phase = hash01(seed) * Math.PI * 2;
  const f = frame - start;
  return {
    x: amplitude * decay * Math.sin(f * 2.1 + phase),
    y: amplitude * decay * Math.sin(f * 1.7 + phase * 2 + 1.3),
    rot: rotationDeg * decay * Math.sin(f * 1.3 + phase * 3 + 2.1),
  };
};

// ── holdFrames: hit-stop time remap ─────────────────────────────────────────
// Freeze the scene's *local* time for `hold` frames at each stop (fighting-game
// hit-stop): run every tween off the remapped frame, but keep flash/shake on the
// real frame so the freeze reads as impact, not a glitch. Stops must be sorted
// by `at` (real-frame positions).
export const holdFrames = (frame: number, stops: Array<{ at: number; hold: number }>): number => {
  let v = frame;
  for (const { at, hold } of stops) {
    if (frame <= at) {
      break;
    }
    v -= Math.min(frame - at, hold);
  }
  return v;
};

// ── squashLand: landing squash & stretch ────────────────────────────────────
// Volume-conserving deformation at a landing frame: squash wide+flat for `hold`
// frames, then spring back. transformOrigin should sit on the contact edge
// (usually "50% 100%"). Differential scale is what separates "rubber object
// with mass" from "uniformly scaled cardboard".
export const squashLand = (
  frame: number,
  opts: { land: number; intensity?: number; hold?: number; recover?: number },
): { scaleX: number; scaleY: number } => {
  const { land, intensity = 0.2, hold = 2, recover = 8 } = opts;
  if (frame < land) {
    return { scaleX: 1, scaleY: 1 };
  }
  if (frame < land + hold) {
    return { scaleX: 1 + intensity, scaleY: 1 - intensity };
  }
  const p = tween(frame, { start: land + hold, duration: recover, ease: "backOut" });
  return { scaleX: 1 + intensity * (1 - p), scaleY: 1 - intensity * (1 - p) };
};

// ── anticipate: pre-pop wind-up ─────────────────────────────────────────────
// Disney anticipation: dip to (1 - dip) over dipFrames before the main pop
// begins, then release back to 1 over releaseFrames while the pop plays.
// Multiply the result into the element's scale; start the springPop at
// start + dipFrames. The release matters: a wind-up that never lets go leaves
// the element permanently undersized and cancels the spring's overshoot.
export const anticipate = (
  frame: number,
  opts: { start?: number; dip?: number; dipFrames?: number; releaseFrames?: number },
): number => {
  const { start = 0, dip = 0.08, dipFrames = 4, releaseFrames = 8 } = opts;
  const down = tween(frame, { start, duration: dipFrames, ease: "power2In" });
  const up = tween(frame, { start: start + dipFrames, duration: releaseFrames, ease: "power2Out" });
  return 1 - dip * (down - up);
};

// ── flashOpacity: impact flash ──────────────────────────────────────────────
// Classic 2-frame impact flash: hold at `peak` then decay. Drive a full-screen
// overlay (see <ImpactFlash>) on landing/explosion frames.
export const flashOpacity = (
  frame: number,
  opts: { start: number; peak?: number; hold?: number; fade?: number },
): number => {
  const { start, peak = 0.85, hold = 1, fade = 4 } = opts;
  if (frame < start) {
    return 0;
  }
  if (frame < start + hold) {
    return peak;
  }
  return peak * (1 - tween(frame, { start: start + hold, duration: fade, ease: "power2Out" }));
};

// ── cameraDrift: handheld micro-drift + slow push ───────────────────────────
// A real lens never sits still. Multi-frequency sub-3px drift plus a scene-long
// push (default 4%) keeps every frame alive between beats — the cheapest cure
// for the "entrance finishes, screen dies" problem. Apply on the scene camera
// container (AdVideo's <CameraLayer> does this for every scene).
export const cameraDrift = (
  frame: number,
  sceneFrames: number,
  opts: { push?: number; ampPx?: number; seed?: number } = {},
): { x: number; y: number; scale: number } => {
  const { push = 0.04, ampPx = 2.5, seed = 0 } = opts;
  const phase = hash01(seed) * Math.PI * 2;
  const x = ampPx * (Math.sin(frame * 0.045 + phase) * 0.7 + Math.sin(frame * 0.13 + phase * 2) * 0.3);
  const y = ampPx * (Math.sin(frame * 0.038 + phase * 3 + 1.1) * 0.7 + Math.sin(frame * 0.11 + phase * 5 + 0.6) * 0.3);
  const scale = 1 + push * tween(frame, { duration: Math.max(1, sceneFrames), ease: "sineInOut" });
  return { x, y, scale };
};

// ── quadBezier: arc motion (GSAP MotionPath, the 90% case) ──────────────────
// Position and tangent angle along a quadratic bezier. Straight-line travel is
// UI; an arc with tangent-following rotation is character animation — same
// flight, twice the life. Used by FlipMove's `arc` option; use directly for
// coins arcing into a wallet, badges swinging in, logos orbiting to the corner.
export const quadBezier = (
  p: number,
  p0: { x: number; y: number },
  c: { x: number; y: number },
  p1: { x: number; y: number },
): { x: number; y: number; angleDeg: number } => {
  const inv = 1 - p;
  const x = inv * inv * p0.x + 2 * inv * p * c.x + p * p * p1.x;
  const y = inv * inv * p0.y + 2 * inv * p * c.y + p * p * p1.y;
  // derivative gives the tangent for align-to-path rotation
  const dx = 2 * inv * (c.x - p0.x) + 2 * p * (p1.x - c.x);
  const dy = 2 * inv * (c.y - p0.y) + 2 * p * (p1.y - c.y);
  return { x, y, angleDeg: (Math.atan2(dy, dx) * 180) / Math.PI };
};

// ── flipTransform: shared-element rect morph (GSAP Flip) ─────────────────────
// FLIP technique: First/Last rects are known, Invert via transform, Play by
// animating p 0→1. Lay the element out at `to` with transformOrigin "top left";
// this returns the transform that makes it appear at the interpolated rect
// between `from` and `to`. Powers "thumbnail explodes into hero", "before
// collapses into after", "icon expands into card".
export type Rect = { x: number; y: number; width: number; height: number; rotation?: number };

// `arc` bows the travel path on a quadratic bezier. Positive bows to the LEFT
// of the travel direction (up when moving left→right, screen-left when moving
// upward); negative bows right. The control point sits `arc` px off the chord
// midpoint, so the visible bow at the midpoint is arc/2. 0 keeps the
// straight-line morph. (flipTransform interpolates rotation linearly — the
// tangent angle from quadBezier is not applied here.)
export const flipTransform = (from: Rect, to: Rect, p: number, arc = 0): string => {
  const inv = 1 - p;
  let tx = (from.x - to.x) * inv;
  let ty = (from.y - to.y) * inv;
  if (arc !== 0) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const control = {
      x: (from.x + to.x) / 2 + (dy / len) * arc,
      y: (from.y + to.y) / 2 - (dx / len) * arc,
    };
    const pos = quadBezier(p, { x: from.x, y: from.y }, control, { x: to.x, y: to.y });
    tx = pos.x - to.x;
    ty = pos.y - to.y;
  }
  const sx = (from.width / to.width) * inv + p;
  const sy = (from.height / to.height) * inv + p;
  const rot = (from.rotation ?? 0) * inv + (to.rotation ?? 0) * p;
  return `translate(${tx}px, ${ty}px) scale(${sx}, ${sy}) rotate(${rot}deg)`;
};
