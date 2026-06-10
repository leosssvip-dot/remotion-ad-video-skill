import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Burst } from "./Burst";
import { KineticText } from "./KineticText";
import { decayShake, eases, tween } from "./motion";

/**
 * ChargeBar — progress-bar psychology as a scene.
 *
 * Four fixed beats scaled to the scene length: RUSH (0→88% on an expo curve,
 * momentum), CRAWL (88→99 in discrete ticks with a tremble — the loss-aversion
 * squeeze), HOLD (2 frames of dead air, the inhale), SLAM (100% with overshoot,
 * flash, confetti from the bar tip, and the label flipping from the charging
 * line to the payoff headline). Twenty years of loot-box psychology, packaged
 * as the `charge-reveal` block.
 *
 * Sync sfx-count-tick to `chargeTimings(sceneFrames).tickFrames` (the exact
 * frame of each +1%) and sfx-impact + sfx-success to `slamFrame`. The slam
 * flash lives in the parent block (ChargeRevealBlock) so it covers the full
 * frame and does not travel with the shake.
 */

const crawlProgress = (frame: number, rushEnd: number, crawlEnd: number) =>
  interpolate(frame, [rushEnd, crawlEnd], [0, 1], {
    easing: eases.power1Out,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const crawlPct = (frame: number, rushEnd: number, crawlEnd: number) =>
  Math.min(99, 88 + Math.floor(crawlProgress(frame, rushEnd, crawlEnd) * 12));

export const chargeTimings = (sceneFrames: number) => {
  const rushEnd = Math.max(10, Math.round(sceneFrames * 0.26));
  const crawlEnd = Math.max(rushEnd + 12, Math.round(sceneFrames * 0.62));
  const slamFrame = crawlEnd + 2;
  // the exact frame each +1% tick lands on — sync sfx-count-tick to these
  const tickFrames: number[] = [];
  let last = 88;
  for (let f = rushEnd; f < crawlEnd; f += 1) {
    const pct = crawlPct(f, rushEnd, crawlEnd);
    if (pct > last) {
      tickFrames.push(f);
      last = pct;
    }
  }
  return { rushEnd, crawlEnd, slamFrame, tickFrames };
};

type ChargeBarProps = {
  chargingLabel: string;
  completeLabel: string;
  accent: string;
  textColor: string;
  fontDisplay: string;
  sceneFrames: number;
  lead: number;
};

export const ChargeBar: React.FC<ChargeBarProps> = ({
  chargingLabel,
  completeLabel,
  accent,
  textColor,
  fontDisplay,
  sceneFrames,
  lead,
}) => {
  const frame = useCurrentFrame() - lead;
  const { fps, width } = useVideoConfig();
  const { rushEnd, crawlEnd, slamFrame } = chargeTimings(sceneFrames);

  // percent through the four beats
  let pct: number;
  if (frame < rushEnd) {
    pct = tween(frame, { duration: rushEnd, from: 0, to: 88, ease: "expoOut" });
  } else if (frame < crawlEnd) {
    // discrete ticks 88→99: each +1% is its own micro-event
    pct = crawlPct(frame, rushEnd, crawlEnd);
  } else if (frame < slamFrame) {
    pct = 99; // the held breath — nothing moves here, by design
  } else {
    pct = 100;
  }

  const inCrawl = frame >= rushEnd && frame < crawlEnd;
  const crawlP = inCrawl ? crawlProgress(frame, rushEnd, crawlEnd) : 0;
  // tremble: the bar strains against the last percent, harder near the top;
  // frozen during the 2-frame hold (the inhale must be dead still)
  const tremble = inCrawl ? Math.sin(frame * 1.6) * 2.6 * (1 + 0.6 * crawlP) : 0;
  const trembleRot = inCrawl ? Math.sin(frame * 1.45 + 1.2) * 0.18 * (1 + 0.6 * crawlP) : 0;
  // punch the readout on the frame the percent actually ticks (the eased
  // crawl is non-uniform, so derive the event from the value itself)
  let tickAge = 99;
  if (inCrawl) {
    for (let d = 0; d < 4; d += 1) {
      const at = frame - d;
      if (at > rushEnd && crawlPct(at, rushEnd, crawlEnd) !== crawlPct(at - 1, rushEnd, crawlEnd)) {
        tickAge = d;
        break;
      }
    }
  }
  const tickPunch = tickAge < 3 ? 1 + 0.12 * (1 - tickAge / 3) : 1;
  // slam: overshoot the fill, flash, shake, land the payoff
  const slamPop = tween(frame, { start: slamFrame, duration: 8, from: 1.12, to: 1, ease: "backOut" });
  const slamScale = frame < slamFrame ? 1 : slamPop;
  const shake = decayShake(frame, { start: slamFrame, durationFrames: 10, amplitude: 10, rotationDeg: 0.6, seed: 7 });

  const barW = Math.round(width * 0.78);
  const pctSize = 200;

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
        gap: 36,
        position: "relative",
        transform: `translate(${shake.x}px, ${shake.y}px) rotate(${shake.rot}deg)`,
        width: "100%",
        zIndex: 1,
      }}
    >
      <strong
        style={{
          color: accent,
          fontFamily: fontDisplay,
          fontSize: pctSize,
          letterSpacing: -4,
          lineHeight: 0.9,
          transform: `scale(${(frame < slamFrame ? tickPunch : 1) * slamScale})`,
        }}
      >
        {Math.round(pct)}%
      </strong>
      <div
        style={{
          background: "rgba(127,127,127,0.22)",
          borderRadius: 999,
          height: 26,
          overflow: "hidden",
          position: "relative",
          transform: `translateX(${tremble}px) rotate(${trembleRot}deg) scaleX(${frame >= slamFrame ? slamScale : 1})`,
          width: barW,
        }}
      >
        <div
          style={{
            background: accent,
            borderRadius: 999,
            boxShadow: `0 0 24px ${accent}`,
            height: "100%",
            width: `${pct}%`,
          }}
        />
      </div>
      {frame >= slamFrame ? (
        <>
          <Burst
            start={slamFrame + lead}
            preset="confetti"
            colors={[accent, textColor, accent]}
            origin={{ x: "88%", y: "55%" }}
            zIndex={2}
          />
          <KineticText
            as="h1"
            text={completeLabel}
            split="words"
            from="center"
            enter="pop"
            startFrame={slamFrame + 2 + lead}
            perItem={2}
            duration={10}
            ease="backOutHard"
            style={{
              color: textColor,
              fontFamily: fontDisplay,
              fontSize: 84,
              lineHeight: 1.02,
              margin: 0,
              maxWidth: "86%",
              textAlign: "center",
            }}
          />
        </>
      ) : (
        <p
          style={{
            color: textColor,
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: 4,
            margin: 0,
            opacity: 0.85,
            textTransform: "uppercase",
          }}
        >
          {chargingLabel}
          {/* fixed-width dots so the centered line never reflows */}
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              style={{ opacity: dot <= Math.floor(frame / Math.max(1, Math.round(fps / 3))) % 3 ? 1 : 0 }}
            >
              .
            </span>
          ))}
        </p>
      )}
    </div>
  );
};
