import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { flashOpacity } from "./motion";

/**
 * ImpactFlash — the classic 1-2 frame impact flash.
 *
 * A full-screen color overlay that holds at peak for `hold` frames and decays
 * over `fade`. Fire it on the frame something heavy lands (metric lock, CTA
 * slam, shatter) together with decayShake on the scene container and an
 * sfx-impact / sfx-sub-boom cue. White reads as impact; the brand primary
 * reads as energy.
 *
 *   <ImpactFlash start={14} />
 *   <ImpactFlash start={14} color={primaryColor} peak={0.4} />
 */
type ImpactFlashProps = {
  start: number;
  color?: string;
  peak?: number;
  hold?: number;
  fade?: number;
  zIndex?: number;
};

export const ImpactFlash: React.FC<ImpactFlashProps> = ({
  start,
  color = "#ffffff",
  peak = 0.85,
  hold = 1,
  fade = 4,
  zIndex = 30,
}) => {
  const frame = useCurrentFrame();
  const opacity = flashOpacity(frame, { start, peak, hold, fade });
  if (opacity <= 0.003) {
    return null;
  }
  return <AbsoluteFill style={{ background: color, opacity, pointerEvents: "none", zIndex }} />;
};
