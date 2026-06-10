import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { z } from "zod";
import type { CaptionSchema } from "./schema";
import { tween } from "./motion";

/**
 * CaptionTrack — karaoke captions, the visual carrier for the voiceover.
 *
 * Most feeds play muted: without burned-in, word-synced captions the voiceover
 * effectively does not exist. This is a global layer (rendered once in AdVideo,
 * above all scenes, so captions survive scene cuts): each spoken sentence pops
 * in word by word on its own beat, the word currently being spoken is lit in
 * the accent color, emphasized words land bigger and tilted, and the finished
 * sentence flies out as the next one enters.
 *
 * Feed `props.captions` from the voiceover script — same timestamps as the
 * voiceover audio track. When per-word timing is omitted, words are spread
 * evenly across the sentence window.
 */

type Caption = z.infer<typeof CaptionSchema>;

const hash01 = (i: number): number => {
  const v = Math.sin((i + 1) * 12.9898 + 4.1414) * 43758.5453;
  return v - Math.floor(v);
};

type TimedWord = { w: string; atFrame: number; emphasis: boolean };

const timeWords = (caption: Caption): TimedWord[] => {
  if (caption.words && caption.words.length > 0) {
    // defensive: sort by beat and clamp into the sentence window so an
    // out-of-order or out-of-range timestamp degrades gracefully instead of
    // silently dropping the word or scrambling the highlight
    const lastBeat = Math.max(caption.startFrame, caption.endFrame - 8);
    return caption.words
      .map((word) => ({
        w: word.w,
        atFrame: Math.min(Math.max(word.atFrame, caption.startFrame), lastBeat),
        emphasis: word.emphasis ?? false,
      }))
      .sort((a, b) => a.atFrame - b.atFrame);
  }
  const words = caption.text.split(/\s+/).filter(Boolean);
  const window = Math.max(1, caption.endFrame - caption.startFrame - 14);
  return words.map((w, i) => ({
    w,
    atFrame: caption.startFrame + Math.round((i * window) / Math.max(1, words.length)),
    emphasis: false,
  }));
};

export const CaptionTrack: React.FC<{
  captions: Caption[];
  accentColor: string;
  // frame windows where the accent must swap (e.g. colorMode:"inverted" scenes
  // flood the screen with the accent color — AdVideo passes the swap color)
  accentSwaps?: Array<{ from: number; to: number; color: string }>;
  fontFamily?: string;
  zIndex?: number;
}> = ({ captions, accentColor, accentSwaps, fontFamily, zIndex = 20 }) => {
  const frame = useCurrentFrame();
  const { height, width } = useVideoConfig();
  const isLandscape = width > height;
  const isSquare = width === height;
  const fontSize = isLandscape ? 46 : isSquare ? 50 : 58;
  const bottom = isLandscape ? "12%" : isSquare ? "18%" : "26%";

  // when windows overlap, the most recently started sentence wins so the new
  // line gets its word-by-word entrance instead of flashing in fully formed
  let active: Caption | undefined;
  for (const c of captions) {
    if (frame >= c.startFrame && frame < c.endFrame && (!active || c.startFrame > active.startFrame)) {
      active = c;
    }
  }
  if (!active) {
    return null;
  }

  const swap = accentSwaps?.find((s) => frame >= s.from && frame < s.to);
  const accent = swap ? swap.color : accentColor;

  const words = timeWords(active);
  // the word currently being spoken = the latest word whose beat has passed
  let activeIndex = -1;
  for (let i = 0; i < words.length; i += 1) {
    if (frame >= words[i].atFrame) {
      activeIndex = i;
    }
  }

  // sentence exit: fly up over the last 6 frames of the window
  const exitP = tween(frame, { start: active.endFrame - 6, duration: 6, ease: "power3In" });

  return (
    <div
      aria-label={active.text}
      style={{
        bottom,
        left: "6%",
        opacity: 1 - exitP,
        pointerEvents: "none",
        position: "absolute",
        right: "6%",
        textAlign: "center",
        transform: `translateY(${exitP * -40}px)`,
        zIndex,
      }}
    >
      {words.map((word, i) => {
        const p = tween(frame, { start: word.atFrame, duration: 7, ease: "backOutHard" });
        if (p <= 0) {
          return null;
        }
        const isActive = i === activeIndex;
        const tilt = word.emphasis ? (hash01(i) - 0.5) * 8 : 0;
        return (
          <span
            key={`${active.startFrame}-${i}`}
            aria-hidden
            style={{
              color: word.emphasis || isActive ? accent : "#ffffff",
              display: "inline-block",
              fontFamily,
              fontSize: word.emphasis ? fontSize * 1.3 : fontSize,
              fontWeight: 900,
              letterSpacing: 0.5,
              lineHeight: 1.25,
              margin: "0 0.18em",
              opacity: Math.min(1, p * 1.6),
              paintOrder: "stroke fill",
              textShadow: "0 4px 26px rgba(0,0,0,0.7)",
              textTransform: "uppercase",
              transform: `scale(${0.3 + 0.7 * p}) rotate(${tilt}deg)`,
              WebkitTextStroke: "6px rgba(0,0,0,0.85)",
            }}
          >
            {word.w}
          </span>
        );
      })}
    </div>
  );
};
