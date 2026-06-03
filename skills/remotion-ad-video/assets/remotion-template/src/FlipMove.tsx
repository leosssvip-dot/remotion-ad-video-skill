import React from "react";
import { useCurrentFrame } from "remotion";
import { type EaseName, type Rect, flipTransform, tween } from "./motion";

/**
 * FlipMove — Remotion port of GSAP Flip (shared-element transition).
 *
 * Lays its child out at the `to` rect, then morphs it in from the `from` rect:
 * the element appears to fly and resize between two known layouts. Use it for
 * the concepts the skill already names — "screenshot explodes into features",
 * "before collapses into after", "icon expands into a card" — instead of just
 * describing them.
 *
 * Rects are in composition pixels. Because both states are known, nothing is
 * measured at runtime (deterministic + render-safe), unlike DOM FLIP.
 *
 * Example:
 *   <FlipMove from={{ x: 460, y: 1150, width: 220, height: 220, rotation: -8 }}
 *             to={{ x: 72, y: 345, width: 936, height: 880 }}
 *             start={2} duration={20} ease="power3InOut" fade>
 *     <VisualFill asset={img} fallback="Product" primaryColor={color} />
 *   </FlipMove>
 */

type FlipMoveProps = {
  from: Rect;
  to: Rect;
  start?: number;
  duration?: number;
  ease?: EaseName;
  fade?: boolean; // fade in over the first ~60% of the move
  style?: React.CSSProperties;
  children: React.ReactNode;
};

export const FlipMove: React.FC<FlipMoveProps> = ({
  from,
  to,
  start = 0,
  duration = 18,
  ease = "power3InOut",
  fade = false,
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  const p = tween(frame, { start, duration, from: 0, to: 1, ease });
  const opacity = fade
    ? tween(frame, { start, duration: Math.max(1, Math.round(duration * 0.6)), from: 0, to: 1, ease: "power2Out" })
    : 1;

  return (
    <div
      style={{
        position: "absolute",
        left: to.x,
        top: to.y,
        width: to.width,
        height: to.height,
        transformOrigin: "top left",
        transform: flipTransform(from, to, p),
        opacity,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
