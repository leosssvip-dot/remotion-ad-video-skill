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

// ── flipTransform: shared-element rect morph (GSAP Flip) ─────────────────────
// FLIP technique: First/Last rects are known, Invert via transform, Play by
// animating p 0→1. Lay the element out at `to` with transformOrigin "top left";
// this returns the transform that makes it appear at the interpolated rect
// between `from` and `to`. Powers "thumbnail explodes into hero", "before
// collapses into after", "icon expands into card".
export type Rect = { x: number; y: number; width: number; height: number; rotation?: number };

export const flipTransform = (from: Rect, to: Rect, p: number): string => {
  const inv = 1 - p;
  const tx = (from.x - to.x) * inv;
  const ty = (from.y - to.y) * inv;
  const sx = (from.width / to.width) * inv + p;
  const sy = (from.height / to.height) * inv + p;
  const rot = (from.rotation ?? 0) * inv + (to.rotation ?? 0) * p;
  return `translate(${tx}px, ${ty}px) scale(${sx}, ${sy}) rotate(${rot}deg)`;
};
