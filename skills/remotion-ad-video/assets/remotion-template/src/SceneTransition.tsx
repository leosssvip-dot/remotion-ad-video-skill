import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { z } from "zod";
import type { TransitionKindSchema } from "./schema";
import { ImpactFlash } from "./Impact";
import { tween } from "./motion";

/**
 * SceneTransition — the editing layer between scenes.
 *
 * Replaces the old "every scene fades to the background color" handoff (the
 * slide-deck failure mode motion-language.md warns about) with directional,
 * synchronized moves. A scene declares how it *exits* via `scene.transitionOut`;
 * the next scene's entrance is derived from the same spec so both sides move as
 * one camera gesture.
 *
 * Kinds:
 * - cut          hard cut. The default — blocks carry their own entrances.
 * - fade         legacy dip-to-background. Available, never the default.
 * - whip-left/right/up  synchronized push: outgoing and incoming scenes share
 *                one power3InOut window (8 frames straddling the boundary) and
 *                travel as adjacent panels; ghost copies fake directional
 *                motion blur at peak velocity. Align an sfx-whoosh to the cut.
 * - zoom-punch   outgoing scene accelerates into a scale+blur crash zoom, hard
 *                cut, incoming settles from 1.3→1 under a 2-frame flash. Align
 *                sfx-impact / sfx-bass-drop.
 * - luma-wipe    a skewed brand-color panel sweeps the screen and the cut hides
 *                under full cover (overlay rendered by AdVideo); the incoming
 *                scene slides 40px against the wipe direction. Align sfx-swipe.
 *
 * Timing contract with AdVideo: for whip-* the incoming scene's Sequence starts
 * `lead` frames before its nominal start and the outgoing scene's Sequence is
 * extended by `tail` frames past its nominal end, so both exist during the
 * shared window. TRANSITION_TIMING is the single source of truth for those
 * offsets.
 */

export type TransitionKind = z.infer<typeof TransitionKindSchema>;

export const TRANSITION_TIMING: Record<TransitionKind, { lead: number; tail: number }> = {
  cut: { lead: 0, tail: 0 },
  fade: { lead: 0, tail: 0 },
  "whip-left": { lead: 4, tail: 4 },
  "whip-right": { lead: 4, tail: 4 },
  "whip-up": { lead: 4, tail: 4 },
  "zoom-punch": { lead: 0, tail: 0 },
  "luma-wipe": { lead: 0, tail: 2 },
};

const WHIP_WINDOW = 8; // frames, straddling the boundary (lead 4 + tail 4)

const whipAxis = (kind: TransitionKind): { x: number; y: number } => {
  switch (kind) {
    case "whip-left":
      return { x: -1, y: 0 };
    case "whip-right":
      return { x: 1, y: 0 };
    case "whip-up":
      return { x: 0, y: -1 };
    default:
      return { x: 0, y: 0 };
  }
};

const isWhip = (kind?: TransitionKind): boolean =>
  kind === "whip-left" || kind === "whip-right" || kind === "whip-up";

type SceneTransitionProps = {
  enter?: TransitionKind; // how the previous scene handed off to us
  exit?: TransitionKind; // our own transitionOut (undefined on the last scene)
  enterLead: number; // frames this Sequence started before the nominal scene start
  nominalFrames: number; // scene duration in frames, without lead/tail
  children: React.ReactNode;
};

export const SceneTransition: React.FC<SceneTransitionProps> = ({
  enter,
  exit,
  enterLead,
  nominalFrames,
  children,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  let translateX = 0;
  let translateY = 0;
  let scale = 1;
  let opacity = 1;
  let blurPx = 0;
  let ghostShiftX = 0;
  let ghostShiftY = 0;
  let whipV = 0;
  let flash: React.ReactNode = null;

  // Synchronized push progress for a whip window centered on a boundary.
  // windowStart is in local-frame space; returns progress now and one frame ago.
  const whipProgress = (windowStart: number) => {
    const p = tween(frame, { start: windowStart, duration: WHIP_WINDOW, ease: "power3InOut" });
    const pPrev = tween(frame - 1, { start: windowStart, duration: WHIP_WINDOW, ease: "power3InOut" });
    return { p, v: p - pPrev };
  };

  // ── entrance (driven by the previous scene's transitionOut) ───────────────
  if (isWhip(enter)) {
    const axis = whipAxis(enter as TransitionKind);
    // The shared window straddles the boundary: [boundary - W/2, boundary + W/2].
    // In local frames that is enterLead - W/2, which is 0 when the lead was not
    // clamped at the start of the video; anchoring on enterLead keeps both
    // sides aligned even when it was.
    const { p, v } = whipProgress(enterLead - WHIP_WINDOW / 2);
    translateX += (1 - p) * -axis.x * width;
    translateY += (1 - p) * -axis.y * height;
    if (v > 0.04) {
      // same sign as the exit branch: ghosts trail at the previous-frame
      // position, behind the motion, not ahead of it
      ghostShiftX += axis.x * v * width;
      ghostShiftY += axis.y * v * height;
      whipV = Math.max(whipV, v);
    }
  } else if (enter === "zoom-punch") {
    scale *= tween(frame, { start: 0, duration: 8, from: 1.3, to: 1, ease: "power3Out" });
    flash = <ImpactFlash start={0} peak={0.7} hold={2} fade={4} />;
  } else if (enter === "luma-wipe") {
    // settle against the wipe direction — start after the panel begins to
    // clear (local ~3) and travel far enough that the push is actually seen
    translateX += tween(frame, { start: 3, duration: 12, from: 120, to: 0, ease: "power3Out" });
  } else if (enter === "fade") {
    opacity *= tween(frame, { start: 0, duration: 8, from: 0, to: 1, ease: "power2Out" });
  }

  // ── exit (this scene's own transitionOut) ─────────────────────────────────
  if (isWhip(exit)) {
    const axis = whipAxis(exit as TransitionKind);
    const windowStart = enterLead + nominalFrames - WHIP_WINDOW / 2;
    const { p, v } = whipProgress(windowStart);
    translateX += p * axis.x * width;
    translateY += p * axis.y * height;
    if (v > 0.04) {
      ghostShiftX += axis.x * v * width;
      ghostShiftY += axis.y * v * height;
      whipV = Math.max(whipV, v);
    }
  } else if (exit === "zoom-punch") {
    const p = tween(frame, { start: enterLead + nominalFrames - 5, duration: 5, ease: "power3In" });
    scale *= 1 + 0.55 * p;
    blurPx = p * 6;
  } else if (exit === "fade") {
    opacity *= 1 - tween(frame, { start: enterLead + nominalFrames - 10, duration: 10, ease: "power2In" });
  }
  // luma-wipe exit needs no transform: the cut hides under the overlay panel.

  const moving = Math.abs(ghostShiftX) + Math.abs(ghostShiftY) > 1;
  // smear the main layer at peak velocity so the discrete ghosts read as one
  // continuous blur instead of a triple exposure
  if (whipV > 0.15) {
    blurPx = Math.max(blurPx, 2.5);
  }
  const baseTransform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  // tight sub-frame sampling: 3 trailing copies inside one frame of travel
  const GHOSTS: Array<[number, number]> = [
    [0.3, 0.3],
    [0.6, 0.18],
    [0.9, 0.1],
  ];

  return (
    <AbsoluteFill>
      {/* ghost copies fake directional motion blur during whip peaks */}
      {moving
        ? GHOSTS.map(([shift, ghostOpacity]) => (
            <AbsoluteFill
              key={shift}
              aria-hidden="true"
              style={{
                opacity: opacity * ghostOpacity,
                transform: `translate(${translateX - ghostShiftX * shift}px, ${translateY - ghostShiftY * shift}px) scale(${scale})`,
              }}
            >
              {children}
            </AbsoluteFill>
          ))
        : null}
      <AbsoluteFill
        style={{
          opacity,
          transform: baseTransform,
          filter: blurPx > 0.2 ? `blur(${blurPx}px)` : undefined,
        }}
      >
        {children}
      </AbsoluteFill>
      {flash}
    </AbsoluteFill>
  );
};

/**
 * LumaWipe — the sweeping brand-color panel for the "luma-wipe" transition.
 * Rendered by AdVideo in its own Sequence straddling the scene boundary
 * (from boundary-6, 13 frames): the panel fully covers the screen around the
 * boundary, hiding the cut. The panel is 3x screen width (inset -100%) with a
 * ±80%-of-panel travel, which yields ~3 frames of full cover around the
 * boundary (derived for 9:16 with the -12° skew shear) so ±1 frame of rounding
 * cannot expose the cut. `startOffset` compensates when the Sequence start was
 * clamped at frame 0.
 */
export const LumaWipe: React.FC<{ color: string; startOffset?: number }> = ({ color, startOffset = 0 }) => {
  const frame = useCurrentFrame();
  const p = tween(frame + startOffset, { start: 0, duration: 12, ease: "power3InOut" });
  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none", zIndex: 40 }}>
      <div
        style={{
          position: "absolute",
          inset: "-100%",
          background: color,
          transform: `translateX(${(p * 2 - 1) * 80}%) skewX(-12deg)`,
        }}
      />
    </AbsoluteFill>
  );
};
