import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { physics2D } from "./motion";

/**
 * Burst — Remotion port of GSAP Physics2DPlugin, as a particle emitter.
 *
 * Fires N particles from an origin under real ballistic motion (velocity +
 * angle + gravity). Deterministic per-index seeding (no Math.random) so renders
 * are reproducible. This is the spectacle / reward primitive the game and
 * social patterns ask for: confetti, coin showers, score pops, explosions.
 *
 * Example (celebration as a CTA lands):
 *   <Burst start={4} preset="confetti" colors={[primaryColor, "#fff"]} origin={{ x: "50%", y: "44%" }} />
 */

type BurstPreset = "confetti" | "coins" | "sparks" | "debris";

type PresetDef = {
  count: number;
  baseAngle: number; // deg; -90 = up
  spread: number; // deg of angular scatter
  velocity: [number, number]; // px/sec range
  gravity: number; // px/sec²
  size: [number, number]; // px range
  life: number; // frames a particle lives before it has faded out
  spin: number; // max degrees of rotation over its life
  shape: "rect" | "circle" | "bar";
};

const PRESETS: Record<BurstPreset, PresetDef> = {
  confetti: { count: 30, baseAngle: -90, spread: 150, velocity: [720, 1320], gravity: 1500, size: [10, 22], life: 58, spin: 900, shape: "rect" },
  coins: { count: 22, baseAngle: -90, spread: 96, velocity: [820, 1420], gravity: 1900, size: [22, 34], life: 52, spin: 540, shape: "circle" },
  sparks: { count: 26, baseAngle: -90, spread: 360, velocity: [520, 1120], gravity: 340, size: [4, 9], life: 38, spin: 0, shape: "circle" },
  debris: { count: 24, baseAngle: -90, spread: 360, velocity: [640, 1240], gravity: 1650, size: [8, 18], life: 50, spin: 720, shape: "rect" },
};

const DEFAULT_COLORS = ["#FFD54A", "#FF5E5E", "#5EC8FF", "#7CFF6B", "#FFFFFF"];

// Deterministic 0..1 hash; `salt` decorrelates the streams (angle vs speed vs size).
const rnd = (index: number, salt: number): number => {
  const v = Math.sin((index + 1) * (12.9898 + salt * 0.137) + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type BurstProps = {
  start?: number;
  preset?: BurstPreset;
  count?: number; // override preset count
  origin?: { x: number | string; y: number | string }; // default screen center
  colors?: string[];
  baseAngle?: number;
  spread?: number;
  velocity?: [number, number];
  gravity?: number;
  size?: [number, number];
  life?: number;
  zIndex?: number;
};

export const Burst: React.FC<BurstProps> = ({
  start = 0,
  preset = "confetti",
  count,
  origin = { x: "50%", y: "50%" },
  colors = DEFAULT_COLORS,
  baseAngle,
  spread,
  velocity,
  gravity,
  size,
  life,
  zIndex = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const def = PRESETS[preset];
  const n = count ?? def.count;
  const ba = baseAngle ?? def.baseAngle;
  const sp = spread ?? def.spread;
  const vRange = velocity ?? def.velocity;
  const g = gravity ?? def.gravity;
  const sRange = size ?? def.size;
  const lifeFrames = life ?? def.life;

  const local = frame - start;
  if (local < 0) {
    return null;
  }

  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex }}>
      {Array.from({ length: n }, (_, i) => {
        const progress = local / lifeFrames;
        if (progress > 1) {
          return null;
        }
        const angle = ba + (rnd(i, 1) - 0.5) * sp;
        const speed = lerp(vRange[0], vRange[1], rnd(i, 2));
        const { x, y } = physics2D(frame, fps, { start, velocity: speed, angle, gravity: g });
        const px = lerp(sRange[0], sRange[1], rnd(i, 3));
        const color = colors[i % colors.length];
        const spin = def.spin * progress * (rnd(i, 4) > 0.5 ? 1 : -1);
        // fade in fast, hold, fade out over the last third of life
        const opacity = Math.max(0, Math.min(1, progress * 6, (1 - progress) * 3));
        const common: React.CSSProperties = {
          position: "absolute",
          left: origin.x,
          top: origin.y,
          width: px,
          height: def.shape === "bar" ? Math.max(2, px * 0.34) : px,
          background: color,
          opacity,
          transform: `translate(${x - px / 2}px, ${y - px / 2}px) rotate(${spin}deg)`,
          willChange: "transform, opacity",
        };
        const radius = def.shape === "circle" ? "50%" : def.shape === "rect" ? 2 : 1;
        return <div key={i} style={{ ...common, borderRadius: radius }} />;
      })}
    </AbsoluteFill>
  );
};
