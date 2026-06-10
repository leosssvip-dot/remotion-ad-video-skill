import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig
} from "remotion";
import type { AdVideoProps } from "./schema";
import { cameraDrift, decayShake, eases, springPop, squashLand, tween } from "./motion";
import { Burst } from "./Burst";
import { CaptionTrack } from "./CaptionTrack";
import { ChargeBar, chargeTimings } from "./ChargeBar";
import { FakeNotification, NOTIFICATION_HEIGHT } from "./FakeOS";
import { Grain, Sheen, Vignette } from "./Finish";
import { FlipMove } from "./FlipMove";
import { getFontStacks } from "./Fonts";
import { ImpactFlash } from "./Impact";
import { KineticText } from "./KineticText";
import { LumaWipe, SceneTransition, TRANSITION_TIMING, type TransitionKind } from "./SceneTransition";

type SceneProps = {
  backgroundColor: string;
  brandName: string;
  cta: string;
  // typography from props.fontPreset: display for headlines, body for the rest
  fonts: { display: string; body: string };
  // karaoke captions own the lower third and ARE the support copy — blocks
  // skip their scene.body line to avoid two competing text layers
  hasCaptions: boolean;
  heroImagePath?: string;
  // frames this scene's Sequence started before its nominal start (whip lead).
  // Blocks keep their beats on the nominal timeline so audio cues stay aligned.
  lead: number;
  logoPath?: string;
  // resolved per-scene palette: on "inverted" scenes the accent floods the
  // background and the text flips dark (AdVideo resolves these from colorMode)
  onAccent: string;
  platform: AdVideoProps["platform"];
  primaryColor: string;
  scene: AdVideoProps["scenes"][number];
  textColor: string;
};
type SceneBlockKind = NonNullable<AdVideoProps["scenes"][number]["block"]>;

type AudioSpec = NonNullable<AdVideoProps["audio"]>;
type AudioTrack = AudioSpec["tracks"][number];
type AudioPreset = NonNullable<AudioTrack["preset"]>;
type SceneMetric = NonNullable<AdVideoProps["scenes"][number]["metric"]>;

const assetSrc = (src: string) =>
  /^(https?:|data:)/i.test(src) ? src : staticFile(src);

// Relative luminance of a hex color (linear approximation, good enough for
// picking a readable text color). Non-hex strings count as dark so the
// light-text default applies.
const relativeLuminance = (color: string): number => {
  const hex = color.replace("#", "");
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    return 0;
  }
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const isBright = (color: string): boolean => relativeLuminance(color) > 0.45;

const sampleRate = 22050;
const audioPresetCache = new Map<string, string>();

const writeAscii = (view: DataView, offset: number, value: string) => {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
};

const clampAudio = (value: number) => Math.max(-1, Math.min(1, value));
const tone = (frequency: number, time: number) => Math.sin(Math.PI * 2 * frequency * time);
const noise = (index: number) => {
  const value = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
};
const env = (time: number, duration: number, attack = 0.01, release = 0.08) =>
  Math.max(0, Math.min(1, time / attack, (duration - time) / release));
const sweepTone = (from: number, to: number, time: number, duration: number) => {
  const progress = Math.max(0, Math.min(1, time / duration));
  const frequency = from + (to - from) * progress;
  return tone(frequency, time);
};
const hit = (frequency: number, time: number, decay = 12) =>
  tone(frequency, time) * Math.exp(-time * decay);
const tick = (frequency: number, time: number, index: number, duration: number) =>
  (tone(frequency, time) * 0.42 + noise(index) * 0.2) * env(time, duration, 0.001, 0.035);

const presetDuration: Record<AudioPreset, number> = {
  "music-pulse-120": 2,
  "music-clean-100": 2.4,
  "sfx-click": 0.07,
  "sfx-tap": 0.09,
  "sfx-pop": 0.18,
  "sfx-swipe": 0.3,
  "sfx-whoosh": 0.45,
  "sfx-riser": 0.72,
  "sfx-impact": 0.42,
  "sfx-stinger": 0.55,
  "sfx-success": 0.58,
  "sfx-notification": 0.42,
  "sfx-coin": 0.46,
  "sfx-tactile-snap": 0.14,
  "sfx-glitch": 0.24,
  "sfx-camera-shutter": 0.2,
  "sfx-light-switch": 0.16,
  "sfx-sub-boom": 0.5,
  "sfx-sparkle": 0.62,
  "sfx-count-tick": 0.12,
  "sfx-bass-drop": 0.76,
  "sfx-pack-open": 0.44,
  "sfx-combo-burst": 0.58,
  "sfx-reveal-hit": 0.36,
  "sfx-soft-chime": 0.68
};

const sampleForPreset = (preset: AudioPreset, time: number, index: number, duration: number) => {
  const envelope = env(time, duration);
  switch (preset) {
    case "music-pulse-120": {
      const beat = (time * 2) % 1;
      const kick = tone(54, time) * Math.exp(-beat * 12);
      const bass = tone(110 + 18 * Math.sin(Math.PI * 2 * time), time) * 0.18;
      const hat = beat > 0.48 && beat < 0.62 ? noise(index) * env(beat - 0.48, 0.14, 0.004, 0.08) * 0.12 : 0;
      return (kick * 0.46 + bass + hat) * envelope;
    }
    case "music-clean-100": {
      const beat = (time * 1.6667) % 1;
      const pad = tone(220, time) * 0.08 + tone(330, time) * 0.06;
      const pluck = tone(440, time) * Math.exp(-beat * 8) * 0.18;
      return (pad + pluck) * envelope;
    }
    case "sfx-click":
      return (tone(2400, time) * 0.34 + noise(index) * 0.2) * env(time, duration, 0.001, 0.025);
    case "sfx-tap":
      return (tone(980, time) * 0.24 + noise(index) * 0.18) * env(time, duration, 0.002, 0.04);
    case "sfx-pop":
      return tone(520 - time * 1300, time) * env(time, duration, 0.004, 0.1) * 0.55;
    case "sfx-swipe":
      return (tone(420 + time * 1200, time) * 0.14 + noise(index) * 0.2) * env(time, duration, 0.03, 0.12);
    case "sfx-whoosh":
      return (noise(index) * 0.32 + tone(180 + time * 520, time) * 0.12) * env(time, duration, 0.08, 0.14);
    case "sfx-riser":
      return (tone(260 + time * 850, time) * 0.28 + noise(index) * 0.08) * env(time, duration, 0.04, 0.08);
    case "sfx-impact":
      return (tone(62, time) * 0.72 * Math.exp(-time * 7) + noise(index) * 0.22 * Math.exp(-time * 16)) * envelope;
    case "sfx-stinger":
      return (tone(330, time) * Math.exp(-time * 4) + tone(660, time) * Math.exp(-time * 7)) * envelope * 0.45;
    case "sfx-success":
      return (time < 0.24 ? tone(660, time) : tone(880, time - 0.24)) * env(time % 0.24, 0.24, 0.004, 0.09) * 0.45;
    case "sfx-notification":
      return (time < 0.18 ? tone(784, time) : tone(1046, time - 0.18)) * env(time % 0.18, 0.18, 0.003, 0.08) * 0.38;
    case "sfx-coin":
      return (tone(1260 + Math.sin(time * 80) * 120, time) + tone(1890, time) * 0.3) * env(time, duration, 0.006, 0.16) * 0.36;
    case "sfx-tactile-snap":
      return (tone(190, time) * 0.34 + noise(index) * 0.42) * env(time, duration, 0.002, 0.05);
    case "sfx-glitch":
      return (Math.sign(tone(95 + index % 900, time)) * 0.32 + noise(index) * 0.25) * env(time, duration, 0.002, 0.08);
    case "sfx-camera-shutter": {
      const first = time < 0.045 ? tick(900, time, index, 0.045) : 0;
      const secondTime = Math.max(0, time - 0.072);
      const second = time > 0.072 ? tick(1250, secondTime, index, 0.06) : 0;
      const body = noise(index) * Math.exp(-time * 20) * 0.18;
      return (first + second + body) * 0.78;
    }
    case "sfx-light-switch":
      return (hit(125, time, 18) * 0.42 + tick(1700, time, index, duration) * 0.55) * envelope;
    case "sfx-sub-boom":
      return (hit(46, time, 5) * 0.82 + hit(92, time, 9) * 0.28 + noise(index) * Math.exp(-time * 18) * 0.12) * envelope;
    case "sfx-sparkle": {
      const sparkleOne = time < 0.18 ? tone(1760, time) * env(time, 0.18, 0.004, 0.12) : 0;
      const sparkleTwoTime = Math.max(0, time - 0.16);
      const sparkleTwo = time > 0.16 ? tone(2349, sparkleTwoTime) * env(sparkleTwoTime, 0.22, 0.004, 0.14) : 0;
      const shimmer = tone(3136 + Math.sin(time * 24) * 140, time) * 0.12;
      return (sparkleOne * 0.34 + sparkleTwo * 0.28 + shimmer) * envelope;
    }
    case "sfx-count-tick":
      return tick(1500 + (index % 5) * 80, time, index, duration) * 0.95;
    case "sfx-bass-drop":
      return (sweepTone(180, 42, time, duration) * 0.52 + hit(55, time, 4) * 0.5 + noise(index) * Math.exp(-time * 10) * 0.08) * envelope;
    case "sfx-pack-open":
      return (noise(index) * 0.36 + sweepTone(780, 340, time, duration) * 0.14) * env(time, duration, 0.02, 0.2);
    case "sfx-combo-burst": {
      const a = time < 0.16 ? tone(660, time) * env(time, 0.16, 0.004, 0.08) : 0;
      const bTime = Math.max(0, time - 0.14);
      const b = time > 0.14 && time < 0.34 ? tone(880, bTime) * env(bTime, 0.2, 0.004, 0.08) : 0;
      const cTime = Math.max(0, time - 0.3);
      const c = time > 0.3 ? tone(1320, cTime) * env(cTime, 0.18, 0.004, 0.1) : 0;
      return (a * 0.24 + b * 0.24 + c * 0.22 + noise(index) * Math.exp(-time * 12) * 0.12) * envelope;
    }
    case "sfx-reveal-hit":
      return (hit(72, time, 8) * 0.5 + sweepTone(420, 980, time, duration) * 0.18 + noise(index) * Math.exp(-time * 22) * 0.16) * envelope;
    case "sfx-soft-chime":
      return (tone(523, time) * Math.exp(-time * 2.8) + tone(784, time) * Math.exp(-time * 3.3) * 0.5 + tone(1046, time) * Math.exp(-time * 4.2) * 0.24) * envelope * 0.32;
    default: {
      // Exhaustiveness guard: adding a preset to AudioPresetSchema without a
      // case here fails to type-check, instead of silently emitting NaN audio.
      const exhaustive: never = preset;
      throw new Error(`Unhandled audio preset: ${String(exhaustive)}`);
    }
  }
};

const wavDataUri = (preset: AudioPreset) => {
  const cached = audioPresetCache.get(preset);
  if (cached) {
    return cached;
  }

  const duration = presetDuration[preset];
  const sampleCount = Math.max(1, Math.floor(duration * sampleRate));
  const buffer = new ArrayBuffer(44 + sampleCount * 2);
  const view = new DataView(buffer);
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + sampleCount * 2, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, sampleCount * 2, true);

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const value = clampAudio(sampleForPreset(preset, time, index, duration));
    view.setInt16(44 + index * 2, value < 0 ? value * 0x8000 : value * 0x7fff, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    const chunk = bytes.subarray(index, index + 0x8000);
    binary += String.fromCharCode(...chunk);
  }
  const dataUri = `data:audio/wav;base64,${btoa(binary)}`;
  audioPresetCache.set(preset, dataUri);
  return dataUri;
};

const audioPresetSrc = (preset: AudioPreset) => wavDataUri(preset);

const formatMetricValue = (value: number, decimals: number) =>
  value.toLocaleString("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  });

const AudioLayer: React.FC<{ audio?: AudioSpec }> = ({ audio }) => {
  const { fps } = useVideoConfig();
  if (!audio?.enabled || audio.tracks.length === 0) {
    return null;
  }

  return (
    <>
      {audio.tracks.map((track: AudioTrack) => {
        const from = track.startFrame ?? Math.round((track.startSecond ?? 0) * fps);
        const durationInFrames = track.durationFrames ?? (track.durationSecond
          ? Math.round(track.durationSecond * fps)
          : undefined);
        const source = track.src ? assetSrc(track.src) : track.preset ? audioPresetSrc(track.preset) : undefined;
        if (!source) {
          return null;
        }
        const renderedAudio = (
          <Audio
            src={source}
            volume={track.volume ?? (track.kind === "musicBed" ? 0.24 : 0.68)}
            loop={track.loop ?? false}
          />
        );

        return durationInFrames ? (
          <Sequence key={track.id} from={from} durationInFrames={durationInFrames}>
            {renderedAudio}
          </Sequence>
        ) : (
          <Sequence key={track.id} from={from}>
            {renderedAudio}
          </Sequence>
        );
      })}
    </>
  );
};

const AnimatedMetric: React.FC<{
  isLandscape: boolean;
  isSquare: boolean;
  metric: SceneMetric;
  primaryColor: string;
  onAccent?: string; // text color on top of the accent-colored card
  borderColor?: string; // card border — pass the scene textColor
  sceneFrames: number;
  delay?: number; // shift the count onto the nominal scene timeline (pass L.lead)
  variant?: "card" | "poster";
}> = ({ isLandscape, isSquare, metric, primaryColor, onAccent = "#111", borderColor = "#fff", sceneFrames, delay = 0, variant = "card" }) => {
  const frame = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  const from = metric.from ?? 0;
  const decimals = metric.decimals ?? (Number.isInteger(metric.to) && Number.isInteger(from) ? 0 : 1);
  const countFrames = Math.max(1, Math.min(sceneFrames - 1, Math.round(fps * 1.15)));
  const value = interpolate(frame, [0, countFrames], [from, metric.to], {
    easing: eases.expoOut,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const valueText = `${metric.prefix ?? ""}${formatMetricValue(value, decimals)}${metric.suffix ?? ""}`;
  // landing punch: the count locking on its final value is a physical event,
  // not the end of an interpolation — pop past 1 and settle back
  const landPunch =
    frame < countFrames
      ? 1
      : tween(frame, { start: countFrames, duration: 8, from: variant === "poster" ? 1.16 : 1.12, to: 1, ease: "backOut" });

  if (variant === "poster") {
    const posterScale = interpolate(frame, [0, countFrames], [0.7, 1], {
      easing: eases.backOut,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    });
    const posterSize = isLandscape ? 200 : isSquare ? 240 : 300;
    const posterLabel = isLandscape ? 28 : isSquare ? 32 : 38;
    return (
      <div style={{ alignItems: "center", display: "flex", flexDirection: "column", gap: 8, textAlign: "center" }}>
        <strong
          style={{
            color: primaryColor,
            fontSize: posterSize,
            letterSpacing: -4,
            lineHeight: 0.82,
            transform: `scale(${posterScale * landPunch})`
          }}
        >
          {valueText}
        </strong>
        {metric.label ? (
          <span style={{ fontSize: posterLabel, fontWeight: 800, textTransform: "uppercase", letterSpacing: 2 }}>
            {metric.label}
          </span>
        ) : null}
      </div>
    );
  }

  const scale = interpolate(frame, [0, countFrames], [0.84, 1], {
    easing: eases.backOut,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const rotate = interpolate(frame, [0, countFrames], [-4, -1], {
    easing: eases.power3Out,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const metricSize = isLandscape ? 54 : isSquare ? 62 : 78;
  const labelSize = isLandscape ? 18 : isSquare ? 20 : 24;

  return (
    <div
      style={{
        alignItems: "flex-start",
        background: primaryColor,
        border: `5px solid ${borderColor}`,
        borderRadius: 8,
        boxShadow: "0 24px 70px rgba(0,0,0,0.42)",
        color: onAccent,
        display: "inline-flex",
        flexDirection: "column",
        gap: 2,
        marginTop: isLandscape ? 24 : 28,
        padding: isLandscape ? "16px 22px" : "20px 26px",
        transform: `rotate(${rotate}deg) scale(${scale * landPunch})`,
        transformOrigin: "left center",
        width: "fit-content"
      }}
    >
      <strong style={{ fontSize: metricSize, lineHeight: 0.86 }}>{valueText}</strong>
      {metric.label ? (
        <span style={{ fontSize: labelSize, fontWeight: 900, lineHeight: 1.1 }}>
          {metric.label}
        </span>
      ) : null}
    </div>
  );
};

const visualAssetFor = (scene: SceneProps["scene"], heroImagePath?: string) =>
  scene.imagePath ?? scene.imageUrl ?? (scene.id === "hook" ? heroImagePath : undefined);

// Scene-level enter/exit is owned by <SceneTransition>; blocks only choreograph
// their own internal beats. No per-scene opacity envelope — the old global
// fade-to-background was the single biggest source of slide-deck feel.
// `lead` shifts the local clock so frame 0 = the nominal scene start even when
// the Sequence began early for a whip window (beats clamp to their frame-0
// state during the slide-in, and audio cues authored on the nominal timeline
// stay in sync). Components that read useCurrentFrame() themselves
// (KineticText, FlipMove, Burst, ImpactFlash, AnimatedMetric) must add
// `L.lead` to their start props instead.
const useSceneLayout = (platform: SceneProps["platform"], scene: SceneProps["scene"], lead = 0) => {
  const frame = useCurrentFrame() - lead;
  const { fps, height, width } = useVideoConfig();
  const isLandscape = platform.includes("landscape") || width > height;
  const isSquare = platform.includes("square") || width === height;
  const sceneFrames = Math.max(1, Math.round(scene.durationSecond * fps));
  return {
    frame,
    lead,
    fps,
    height,
    width,
    isLandscape,
    isSquare,
    sceneFrames,
    padding: isLandscape ? 56 : isSquare ? 60 : 72,
    headlineSize: isLandscape ? 64 : isSquare ? 70 : 84,
    bodySize: isLandscape ? 30 : isSquare ? 32 : 38,
    proofSize: isLandscape ? 25 : isSquare ? 27 : 30,
    brandSize: isLandscape ? 27 : isSquare ? 30 : 34,
    eyebrowSize: isLandscape ? 22 : isSquare ? 24 : 28
  };
};

const BrandHeader: React.FC<{
  brandName: string;
  logoPath?: string;
  eyebrow?: string;
  primaryColor: string;
  brandSize: number;
  eyebrowSize: number;
}> = ({ brandName, logoPath, eyebrow, primaryColor, brandSize, eyebrowSize }) => (
  <div
    style={{
      alignItems: "center",
      display: "flex",
      gap: 24,
      justifyContent: "space-between",
      position: "relative",
      zIndex: 2
    }}
  >
    <div style={{ alignItems: "center", display: "flex", gap: 16, minWidth: 0 }}>
      {logoPath ? (
        <Img
          src={assetSrc(logoPath)}
          style={{ borderRadius: 8, height: 46, objectFit: "contain", width: 46 }}
        />
      ) : null}
      <strong style={{ fontSize: brandSize }}>{brandName}</strong>
    </div>
    {eyebrow ? (
      <span style={{ color: primaryColor, fontSize: eyebrowSize, fontWeight: 700 }}>{eyebrow}</span>
    ) : null}
  </div>
);

const VisualFill: React.FC<{
  asset?: string;
  fallback: string;
  primaryColor: string;
  cover?: boolean;
  fontSize?: number;
}> = ({ asset, fallback, primaryColor, cover = true, fontSize = 44 }) =>
  asset ? (
    <Img
      src={assetSrc(asset)}
      style={{ height: "100%", objectFit: cover ? "cover" : "contain", width: "100%" }}
    />
  ) : (
    <span
      style={{
        alignItems: "center",
        color: primaryColor,
        display: "flex",
        fontSize,
        fontWeight: 800,
        height: "100%",
        justifyContent: "center",
        padding: 36,
        textAlign: "center",
        width: "100%"
      }}
    >
      {fallback}
    </span>
  );

// standard: the original balanced layout (brand header, framed visual, copy column).
const StandardBlock: React.FC<SceneProps> = ({
  backgroundColor,
  brandName,
  fonts,
  hasCaptions,
  heroImagePath,
  lead,
  logoPath,
  onAccent,
  platform,
  primaryColor,
  scene,
  textColor
}) => {
  const L = useSceneLayout(platform, scene, lead);
  const visualAsset = visualAssetFor(scene, heroImagePath);
  const y = tween(L.frame, { duration: 16, from: 36, to: 0, ease: "power3Out" });
  // decisive entrance with overshoot, then a slow scene-length drift so the
  // frame never fully stops
  const visualScale =
    tween(L.frame, { duration: 16, from: 0.86, to: 1.02, ease: "backOutSoft" }) +
    tween(L.frame, { start: 16, duration: Math.max(1, L.sceneFrames - 16), from: 0, to: 0.05, ease: "sineInOut" });
  const visualRotate = tween(L.frame, { duration: 16, from: L.isLandscape ? -2 : -3, to: 0, ease: "power3Out" });
  const headlineScale = tween(L.frame, { duration: 14, from: 1.08, to: 1, ease: "power3Out" });
  const accentShift = interpolate(L.frame, [0, L.sceneFrames], [-120, 120], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // second beat at ~58%: proof/metric snaps in with a pop instead of sitting
  // there from frame 0 — long scenes keep a reason to watch. Without either,
  // the visual itself takes the beat with a punch-in.
  const secondBeat = Math.round(L.sceneFrames * 0.58);
  const proofPop = springPop(L.frame, L.fps, { start: secondBeat, damping: 11 });
  const bodyIn = tween(L.frame, { start: 10, duration: 12, ease: "power2Out" });
  const visualPunch =
    scene.proof || scene.metric
      ? 0
      : 0.05 * tween(L.frame, { start: secondBeat, duration: 10, ease: "power2InOut" });
  const contentLayout: React.CSSProperties = L.isLandscape
    ? { gridTemplateColumns: "0.95fr 1.05fr", gridTemplateRows: "1fr", minHeight: Math.max(520, L.height - L.padding * 3) }
    : { gridTemplateRows: "1fr auto", minHeight: L.isSquare ? 650 : 980 };
  const visualFrameStyle: React.CSSProperties = {
    alignItems: "center",
    border: `3px solid ${primaryColor}`,
    borderRadius: 8,
    display: "flex",
    height: L.isLandscape ? Math.min(620, L.height - L.padding * 4) : "100%",
    justifyContent: "center",
    maxHeight: L.isSquare ? 470 : undefined,
    minHeight: L.isLandscape ? 420 : L.isSquare ? 390 : 560,
    overflow: "hidden",
    boxShadow: `0 28px 96px rgba(0,0,0,0.36), 0 0 0 12px ${primaryColor}22`,
    transform: `rotate(${visualRotate}deg) scale(${visualScale + visualPunch})`,
    width: "100%"
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        color: textColor,
        fontFamily: fonts.body,
        justifyContent: "space-between",
        overflow: "hidden",
        padding: L.padding,
        transform: `translateY(${y}px)`
      }}
    >
      <div
        aria-hidden="true"
        style={{
          background: `repeating-linear-gradient(115deg, transparent 0 44px, ${primaryColor}20 44px 56px)`,
          inset: -160,
          opacity: 0.72,
          position: "absolute",
          transform: `translateX(${accentShift}px)`,
          zIndex: 0
        }}
      />
      <BrandHeader brandName={brandName} logoPath={logoPath} eyebrow={scene.eyebrow} primaryColor={primaryColor} brandSize={L.brandSize} eyebrowSize={L.eyebrowSize} />
      <div style={{ alignItems: "center", display: "grid", gap: L.isLandscape ? 52 : 48, position: "relative", zIndex: 1, ...contentLayout }}>
        <div style={{ ...visualFrameStyle, position: "relative" }}>
          <VisualFill asset={visualAsset} fallback={scene.visual} primaryColor={primaryColor} />
          <Sheen start={20 + L.lead} duration={16} opacity={0.35} />
        </div>
        <div>
          <KineticText
            as="h1"
            text={scene.headline}
            split="words"
            from="start"
            startFrame={3 + L.lead}
            perItem={2}
            duration={14}
            y={32}
            ease="power3Out"
            style={{ fontFamily: fonts.display, fontSize: L.headlineSize, lineHeight: L.isLandscape ? 0.98 : 1.02, margin: 0, transform: `scale(${headlineScale})`, transformOrigin: "left center" }}
          />
          {scene.body && !hasCaptions ? (
            <p style={{ fontSize: L.bodySize, lineHeight: 1.18, margin: "28px 0 0", opacity: bodyIn, transform: `translateY(${(1 - bodyIn) * 18}px)` }}>
              {scene.body}
            </p>
          ) : null}
          {scene.proof ? (
            <p
              style={{
                color: primaryColor,
                fontSize: L.proofSize,
                fontWeight: 800,
                margin: "24px 0 0",
                opacity: Math.min(1, proofPop * 1.4),
                transform: `scale(${0.7 + 0.3 * proofPop})`,
                transformOrigin: "left center"
              }}
            >
              {scene.proof}
            </p>
          ) : null}
          {scene.metric ? <AnimatedMetric isLandscape={L.isLandscape} isSquare={L.isSquare} metric={scene.metric} primaryColor={primaryColor} onAccent={onAccent} borderColor={textColor} sceneFrames={L.sceneFrames} delay={L.lead} /> : null}
        </div>
      </div>
      <div aria-hidden="true" style={{ height: 48, position: "relative", zIndex: 1 }} />
    </AbsoluteFill>
  );
};

// cold-open-payoff: full-bleed visual first; headline slams in late.
const ColdOpenBlock: React.FC<SceneProps> = ({ backgroundColor, brandName, fonts, heroImagePath, lead, logoPath, platform, primaryColor, scene }) => {
  const L = useSceneLayout(platform, scene, lead);
  const visualAsset = visualAssetFor(scene, heroImagePath);
  // crash-in: fast push that settles, then keeps creeping for the whole scene;
  // without a proof line, a zoom kick at ~70% takes the second beat instead
  const zoomKick = scene.proof
    ? 0
    : 0.05 * tween(L.frame, { start: Math.round(L.sceneFrames * 0.7), duration: 8, ease: "power2InOut" });
  const zoom =
    tween(L.frame, { duration: 12, from: 1.3, to: 1.16, ease: "power3Out" }) +
    tween(L.frame, { start: 12, duration: Math.max(1, L.sceneFrames - 12), from: 0, to: 0.1, ease: "sineInOut" }) +
    zoomKick;
  const textStart = Math.round(L.sceneFrames * 0.34);
  const textY = tween(L.frame, { start: textStart, duration: 12, from: 60, to: 0, ease: "power3Out" });
  const proofPop = springPop(L.frame, L.fps, { start: textStart + 10, damping: 11 });
  return (
    <AbsoluteFill style={{ backgroundColor, color: "#fff", fontFamily: fonts.body, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <VisualFill asset={visualAsset} fallback={scene.visual} primaryColor={primaryColor} fontSize={84} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 32%, rgba(0,0,0,0) 46%, rgba(0,0,0,0.84) 100%)" }} />
      <div style={{ left: L.padding, position: "absolute", right: L.padding, top: L.padding, zIndex: 2 }}>
        <BrandHeader brandName={brandName} logoPath={logoPath} eyebrow={scene.eyebrow} primaryColor={primaryColor} brandSize={L.brandSize} eyebrowSize={L.eyebrowSize} />
      </div>
      <div style={{ bottom: L.padding + 20, left: L.padding, position: "absolute", right: L.padding, transform: `translateY(${textY}px)`, zIndex: 2 }}>
        <KineticText
          as="h1"
          text={scene.headline}
          split="words"
          from="center"
          enter="clip"
          startFrame={textStart + L.lead}
          perItem={2}
          duration={12}
          y={44}
          ease="power4Out"
          style={{ fontFamily: fonts.display, fontSize: L.headlineSize + 8, lineHeight: 1.0, margin: 0, textShadow: "0 6px 30px rgba(0,0,0,0.5)" }}
        />
        {scene.proof ? (
          <p
            style={{
              color: primaryColor,
              fontSize: L.proofSize,
              fontWeight: 800,
              margin: "16px 0 0",
              opacity: Math.min(1, proofPop * 1.4),
              transform: `scale(${0.75 + 0.25 * proofPop})`,
              transformOrigin: "left center"
            }}
          >
            {scene.proof}
          </p>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// split-before-after: kinetic split; dim "before" half vs colored "after" half.
const SplitBlock: React.FC<SceneProps> = ({ backgroundColor, brandName, fonts, heroImagePath, lead, logoPath, onAccent, platform, primaryColor, scene }) => {
  const L = useSceneLayout(platform, scene, lead);
  const visualAsset = visualAssetFor(scene, heroImagePath);
  const revealEnd = Math.max(14, Math.round(L.sceneFrames * 0.5));
  const reveal = tween(L.frame, { start: 6, duration: revealEnd - 6, from: 0.5, to: 1, ease: "power3InOut" });
  // second beat: the "after" label snaps in right as the reveal lands
  const afterPop = springPop(L.frame, L.fps, { start: revealEnd, damping: 10 });
  const beforeLabel = "Before";
  const afterLabel = "After";
  const panelBase: React.CSSProperties = { alignItems: "center", display: "flex", flex: 1, justifyContent: "center", overflow: "hidden", position: "relative" };
  return (
    <AbsoluteFill style={{ backgroundColor, color: "#fff", fontFamily: fonts.body, overflow: "hidden" }}>
      <div style={{ display: "flex", flexDirection: L.isLandscape ? "row" : "column", height: "100%", width: "100%" }}>
        <div style={{ ...panelBase, filter: "grayscale(1) brightness(0.55)" }}>
          <VisualFill asset={visualAsset} fallback={scene.visual} primaryColor="#888" fontSize={56} />
          <span style={{ background: "rgba(0,0,0,0.55)", borderRadius: 6, fontSize: L.eyebrowSize, fontWeight: 800, left: 24, letterSpacing: 1, padding: "8px 14px", position: "absolute", textTransform: "uppercase", top: 108 }}>{beforeLabel}</span>
        </div>
        <div style={{ ...panelBase, transform: `scale(${reveal})` }}>
          <div aria-hidden="true" style={{ background: primaryColor, inset: 0, opacity: 0.16, position: "absolute" }} />
          <VisualFill asset={visualAsset} fallback={scene.visual} primaryColor={primaryColor} fontSize={56} />
          <span
            style={{
              background: primaryColor,
              borderRadius: 6,
              bottom: 76,
              color: onAccent,
              fontSize: L.eyebrowSize,
              fontWeight: 900,
              letterSpacing: 1,
              padding: "8px 14px",
              position: "absolute",
              right: 24,
              textTransform: "uppercase",
              opacity: Math.min(1, afterPop * 1.5),
              transform: `scale(${0.5 + 0.55 * afterPop}) rotate(${(1 - Math.min(1, afterPop)) * -8}deg)`
            }}
          >
            {afterLabel}
          </span>
        </div>
      </div>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <KineticText
          as="h1"
          text={scene.headline}
          split="words"
          from="center"
          startFrame={4 + L.lead}
          perItem={2}
          duration={13}
          y={30}
          ease="power3Out"
          style={{ background: "rgba(0,0,0,0.5)", borderRadius: 10, color: "#fff", fontFamily: fonts.display, fontSize: L.headlineSize, lineHeight: 1.0, margin: 0, maxWidth: "82%", padding: "18px 26px", textAlign: "center" }}
        />
      </AbsoluteFill>
      <div style={{ left: L.padding, position: "absolute", right: L.padding, top: Math.round(L.padding * 0.5), zIndex: 3 }}>
        <BrandHeader brandName={brandName} logoPath={logoPath} eyebrow={scene.eyebrow} primaryColor={primaryColor} brandSize={L.brandSize} eyebrowSize={L.eyebrowSize} />
      </div>
    </AbsoluteFill>
  );
};

// device-frame: content shown inside a phone frame; feed/app-native feel.
const DeviceFrameBlock: React.FC<SceneProps> = ({ backgroundColor, brandName, fonts, hasCaptions, heroImagePath, lead, logoPath, platform, primaryColor, scene, textColor }) => {
  const L = useSceneLayout(platform, scene, lead);
  const visualAsset = visualAssetFor(scene, heroImagePath);
  // smooth idle float (3s period) instead of the old triangle wave
  const float = Math.sin((L.frame / L.fps) * Math.PI * 2 * 0.33) * -10;
  const rise = tween(L.frame, { duration: 16, from: 40, to: 0, ease: "power3Out" });
  const riseScale = tween(L.frame, { duration: 16, from: 0.92, to: 1, ease: "backOutSoft" });
  // mid beat at ~30%: the screen content "switches pages" — jump right and
  // slide back in, the visual event a swipe SFX can anchor to
  const swipeBeat = Math.round(L.sceneFrames * 0.3);
  const screenSwipe =
    L.frame < swipeBeat ? 0 : tween(L.frame, { start: swipeBeat, duration: 10, from: 30, to: 0, ease: "power3Out" });
  // second beat at ~55%: punch into the screen content so the demo re-engages
  const screenPunch = 1 + 0.12 * tween(L.frame, { start: Math.round(L.sceneFrames * 0.55), duration: 10, ease: "backOut" });
  const bodyIn = tween(L.frame, { start: 12, duration: 12, ease: "power2Out" });
  const deviceH = L.isLandscape ? Math.min(560, L.height - 200) : Math.min(L.height * 0.62, 1080);
  const deviceW = deviceH * 0.48;
  return (
    <AbsoluteFill style={{ alignItems: "center", backgroundColor, color: textColor, display: "flex", flexDirection: L.isLandscape ? "row" : "column", fontFamily: fonts.body, gap: L.isLandscape ? 64 : 36, justifyContent: "center", overflow: "hidden", padding: L.padding }}>
      <div aria-hidden="true" style={{ background: `radial-gradient(circle at 50% 40%, ${primaryColor}33, transparent 60%)`, inset: 0, position: "absolute", zIndex: 0 }} />
      <div style={{ background: "#0b0b0b", borderRadius: 44, boxShadow: `0 40px 120px rgba(0,0,0,0.5), 0 0 0 10px ${primaryColor}22`, height: deviceH, padding: 14, position: "relative", transform: `translateY(${float + rise}px) scale(${riseScale})`, width: deviceW, zIndex: 1 }}>
        <div aria-hidden="true" style={{ background: "#0b0b0b", borderBottomLeftRadius: 12, borderBottomRightRadius: 12, height: 26, left: "50%", position: "absolute", top: 14, transform: "translateX(-50%)", width: deviceW * 0.42, zIndex: 2 }} />
        <div style={{ background: "#151515", borderRadius: 32, height: "100%", overflow: "hidden", width: "100%" }}>
          <div style={{ height: "100%", transform: `translateX(${screenSwipe}%) scale(${screenPunch})`, width: "100%" }}>
            <VisualFill asset={visualAsset} fallback={scene.visual} primaryColor={isBright(primaryColor) ? primaryColor : "#f2f2f2"} fontSize={40} />
          </div>
        </div>
      </div>
      <div style={{ maxWidth: L.isLandscape ? "42%" : "90%", position: "relative", textAlign: L.isLandscape ? "left" : "center", zIndex: 1 }}>
        <KineticText
          as="h1"
          text={scene.headline}
          split="words"
          from="start"
          startFrame={4 + L.lead}
          perItem={2}
          duration={14}
          y={30}
          ease="power3Out"
          style={{ fontFamily: fonts.display, fontSize: L.headlineSize, lineHeight: 1.02, margin: 0 }}
        />
        {scene.body && !hasCaptions ? <p style={{ fontSize: L.bodySize, lineHeight: 1.18, margin: "20px 0 0", opacity: 0.92 * bodyIn, transform: `translateY(${(1 - bodyIn) * 16}px)` }}>{scene.body}</p> : null}
      </div>
      <div style={{ left: L.padding, position: "absolute", right: L.padding, top: Math.round(L.padding * 0.5), zIndex: 2 }}>
        <BrandHeader brandName={brandName} logoPath={logoPath} eyebrow={scene.eyebrow} primaryColor={primaryColor} brandSize={L.brandSize} eyebrowSize={L.eyebrowSize} />
      </div>
    </AbsoluteFill>
  );
};

// stat-slam: a source-backed number dominates the frame.
const StatSlamBlock: React.FC<SceneProps> = ({ backgroundColor, brandName, fonts, lead, logoPath, onAccent, platform, primaryColor, scene, textColor }) => {
  const L = useSceneLayout(platform, scene, lead);
  // the number locking on its final value is the beat of this block: shake the
  // whole frame and flash for 1 frame, matching AnimatedMetric's count window
  const landFrame = scene.metric
    ? Math.max(1, Math.min(L.sceneFrames - 1, Math.round(L.fps * 1.15)))
    : 10;
  const shake = decayShake(L.frame, { start: landFrame, durationFrames: 9, amplitude: 9, rotationDeg: 0.5, seed: 3 });
  // echo beat: the proof line rises right after the number locks
  const proofIn = tween(L.frame, { start: landFrame + 6, duration: 12, ease: "power2Out" });
  return (
    <AbsoluteFill style={{ alignItems: "center", backgroundColor, color: textColor, display: "flex", flexDirection: "column", fontFamily: fonts.body, gap: 24, justifyContent: "center", overflow: "hidden", padding: L.padding, transform: `translate(${shake.x}px, ${shake.y}px) rotate(${shake.rot}deg)` }}>
      <ImpactFlash start={landFrame + L.lead} peak={0.32} hold={1} fade={4} />
      <div aria-hidden="true" style={{ background: `repeating-linear-gradient(135deg, transparent 0 60px, ${primaryColor}14 60px 78px)`, inset: 0, position: "absolute", zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        {scene.eyebrow ? <p style={{ color: primaryColor, fontSize: L.eyebrowSize, fontWeight: 800, letterSpacing: 2, margin: 0, textAlign: "center", textTransform: "uppercase" }}>{scene.eyebrow}</p> : null}
        {scene.metric ? (
          <AnimatedMetric isLandscape={L.isLandscape} isSquare={L.isSquare} metric={scene.metric} primaryColor={primaryColor} onAccent={onAccent} sceneFrames={L.sceneFrames} delay={L.lead} variant="poster" />
        ) : (
          <strong style={{ color: primaryColor, display: "block", fontFamily: fonts.display, fontSize: L.isLandscape ? 160 : 240, letterSpacing: -4, lineHeight: 0.82, textAlign: "center" }}>{scene.visual}</strong>
        )}
      </div>
      <KineticText
        as="h1"
        text={scene.headline}
        split="words"
        from="center"
        enter="slam"
        startFrame={2 + L.lead}
        perItem={2}
        duration={10}
        ease="power3In"
        style={{ fontFamily: fonts.display, fontSize: L.headlineSize, lineHeight: 1.02, margin: 0, maxWidth: "84%", position: "relative", textAlign: "center", zIndex: 1 }}
      />
      {scene.proof ? (
        <p style={{ fontSize: L.proofSize, fontWeight: 700, margin: 0, opacity: 0.86 * proofIn, position: "relative", textAlign: "center", transform: `translateY(${(1 - proofIn) * 14}px)`, zIndex: 1 }}>
          {scene.proof}
        </p>
      ) : null}
      <div style={{ left: L.padding, position: "absolute", right: L.padding, top: Math.round(L.padding * 0.5), zIndex: 2 }}>
        <BrandHeader brandName={brandName} logoPath={logoPath} primaryColor={primaryColor} brandSize={L.brandSize} eyebrowSize={L.eyebrowSize} />
      </div>
    </AbsoluteFill>
  );
};

// cta-card: centered conversion poster with a pulsing CTA button.
const CtaCardBlock: React.FC<SceneProps> = ({ backgroundColor, brandName, cta, fonts, hasCaptions, lead, logoPath, onAccent, platform, primaryColor, scene, textColor }) => {
  const L = useSceneLayout(platform, scene, lead);
  const pop = tween(L.frame, { duration: 14, from: 0.84, to: 1, ease: "backOutSoft" });
  // CTA button: wind down for 4 frames, then hand the full range to the spring
  // so its overshoot actually crosses 1 (peak ≈1.10, rest 1.0), squash on
  // landing, keep a pulse loop — energy gathered, spent, absorbed, sustained
  const btnWind = tween(L.frame, { duration: 4, from: 0.62, to: 0.56, ease: "power2In" });
  const btnPop = springPop(L.frame, L.fps, { start: 4, damping: 10, stiffness: 230 });
  const btnBase = L.frame < 4 ? btnWind : 0.56 + 0.44 * btnPop;
  const btnSquash = squashLand(L.frame, { land: 12, intensity: 0.14, hold: 2, recover: 8 });
  const pulse = 1 + 0.04 * Math.sin(Math.max(0, L.frame - 22) / L.fps * Math.PI * 2 * 1.4);
  const btnScaleX = btnBase * btnSquash.scaleX * pulse;
  const btnScaleY = btnBase * btnSquash.scaleY * pulse;
  return (
    <AbsoluteFill style={{ alignItems: "center", backgroundColor, color: textColor, display: "flex", flexDirection: "column", fontFamily: fonts.body, gap: 30, justifyContent: "center", overflow: "hidden", padding: L.padding, textAlign: "center" }}>
      <div aria-hidden="true" style={{ background: `radial-gradient(circle at 50% 50%, ${primaryColor}3a, transparent 62%)`, inset: 0, position: "absolute", zIndex: 0 }} />
      <ImpactFlash start={12 + L.lead} peak={0.28} hold={1} fade={4} />
      <Burst start={12 + L.lead} preset="confetti" colors={[primaryColor, textColor, primaryColor]} origin={{ x: "50%", y: "46%" }} zIndex={0} />
      <div style={{ alignItems: "center", display: "flex", flexDirection: "column", gap: 18, position: "relative", transform: `scale(${pop})`, zIndex: 1 }}>
        {logoPath ? <Img src={assetSrc(logoPath)} style={{ borderRadius: 12, height: 72, objectFit: "contain", width: 72 }} /> : null}
        <KineticText
          as="h1"
          text={scene.headline}
          split="words"
          startFrame={2 + L.lead}
          perItem={2}
          duration={13}
          y={34}
          ease="power3Out"
          style={{ fontFamily: fonts.display, fontSize: L.headlineSize + 6, lineHeight: 1.0, margin: 0, maxWidth: "90%" }}
        />
        {scene.body && !hasCaptions ? <p style={{ fontSize: L.bodySize, lineHeight: 1.2, margin: 0, opacity: 0.9 }}>{scene.body}</p> : null}
      </div>
      <div style={{ background: primaryColor, borderRadius: 999, boxShadow: `0 24px 70px ${primaryColor}66`, color: onAccent, fontSize: L.brandSize + 2, fontWeight: 900, overflow: "hidden", padding: "22px 52px", position: "relative", transform: `scale(${btnScaleX}, ${btnScaleY})`, transformOrigin: "50% 100%", zIndex: 1 }}>
        {cta}
        <Sheen start={24 + L.lead} duration={14} period={75} opacity={0.55} />
      </div>
      {scene.proof ? <p style={{ fontSize: L.proofSize, fontWeight: 700, margin: 0, opacity: 0.82, position: "relative", zIndex: 1 }}>{scene.proof}</p> : null}
      <strong style={{ bottom: L.padding, fontSize: L.brandSize, position: "absolute", zIndex: 1 }}>{brandName}</strong>
    </AbsoluteFill>
  );
};

// hero-morph: the visual flies in from a thumbnail and expands to fill the hero
// frame (GSAP Flip shared-element morph); the headline then resolves over it.
const HeroMorphBlock: React.FC<SceneProps> = ({ backgroundColor, brandName, fonts, hasCaptions, heroImagePath, lead, logoPath, platform, primaryColor, scene, textColor }) => {
  const L = useSceneLayout(platform, scene, lead);
  const visualAsset = visualAssetFor(scene, heroImagePath);
  const pad = L.padding;
  const heroW = L.width - pad * 2;
  const heroTop = Math.round(L.height * (L.isLandscape ? 0.16 : 0.17));
  const heroH = Math.round(L.height * (L.isLandscape ? 0.5 : 0.45));
  const to = { x: pad, y: heroTop, width: heroW, height: heroH };
  const thumb = Math.round(Math.min(heroW, heroH) * 0.3);
  const from = { x: Math.round(L.width / 2 - thumb / 2), y: Math.round(L.height * 0.62), width: thumb, height: thumb, rotation: -8 };
  const headlineTop = heroTop + heroH + 30;
  // the morph arriving at the hero rect is a landing: small shake sells the
  // mass, then copy and proof follow as separate beats (land → body → proof)
  const morphLand = 22;
  const shake = decayShake(L.frame, { start: morphLand, durationFrames: 8, amplitude: 6, rotationDeg: 0.35, seed: 5 });
  const bodyIn = tween(L.frame, { start: morphLand + 4, duration: 12, ease: "power2Out" });
  const proofPop = springPop(L.frame, L.fps, { start: morphLand + 14, damping: 11 });
  return (
    <AbsoluteFill style={{ backgroundColor, color: textColor, fontFamily: fonts.body, overflow: "hidden", transform: `translate(${shake.x}px, ${shake.y}px) rotate(${shake.rot}deg)` }}>
      <div aria-hidden="true" style={{ background: `radial-gradient(circle at 50% 32%, ${primaryColor}26, transparent 60%)`, inset: 0, position: "absolute", zIndex: 0 }} />
      <FlipMove
        from={from}
        to={to}
        start={2 + L.lead}
        duration={20}
        ease="power3InOut"
        arc={130}
        fade
        style={{ border: `3px solid ${primaryColor}`, borderRadius: 8, overflow: "hidden", boxShadow: `0 28px 96px rgba(0,0,0,0.4), 0 0 0 12px ${primaryColor}22`, zIndex: 1 }}
      >
        <VisualFill asset={visualAsset} fallback={scene.visual} primaryColor={primaryColor} />
      </FlipMove>
      <div style={{ left: pad, position: "absolute", right: pad, top: headlineTop, zIndex: 2 }}>
        <KineticText as="h1" text={scene.headline} split="words" from="start" startFrame={20 + L.lead} perItem={2} duration={13} y={28} ease="power3Out" style={{ fontFamily: fonts.display, fontSize: L.headlineSize, lineHeight: 1.02, margin: 0 }} />
        {scene.body && !hasCaptions ? (
          <p style={{ fontSize: L.bodySize, lineHeight: 1.18, margin: "18px 0 0", opacity: 0.9 * bodyIn, transform: `translateY(${(1 - bodyIn) * 16}px)` }}>{scene.body}</p>
        ) : null}
        {scene.proof ? (
          <p
            style={{
              color: primaryColor,
              fontSize: L.proofSize,
              fontWeight: 800,
              margin: "16px 0 0",
              opacity: Math.min(1, proofPop * 1.4),
              transform: `scale(${0.75 + 0.25 * proofPop})`,
              transformOrigin: "left center"
            }}
          >
            {scene.proof}
          </p>
        ) : null}
      </div>
      <div style={{ left: pad, position: "absolute", right: pad, top: Math.round(pad * 0.5), zIndex: 3 }}>
        <BrandHeader brandName={brandName} logoPath={logoPath} eyebrow={scene.eyebrow} primaryColor={primaryColor} brandSize={L.brandSize} eyebrowSize={L.eyebrowSize} />
      </div>
    </AbsoluteFill>
  );
};

// ui-takeover: a fake push notification drops in, hovers, gets pressed, and
// expands into the full-bleed hero — the system-UI hook. The viewer's muscle
// memory does the first second of work.
const UiTakeoverBlock: React.FC<SceneProps> = ({ backgroundColor, brandName, fonts, hasCaptions, heroImagePath, lead, logoPath, platform, primaryColor, scene, textColor }) => {
  const L = useSceneLayout(platform, scene, lead);
  const visualAsset = visualAssetFor(scene, heroImagePath);
  const appName = scene.eyebrow ?? brandName;

  // system notifications hug the screen edge much tighter than scene padding
  const bannerPad = 24;
  const bannerW = L.width - bannerPad * 2;
  const bannerTop = Math.round(L.height * 0.1);
  const bannerRect = { x: bannerPad, y: bannerTop, width: bannerW, height: NOTIFICATION_HEIGHT };
  const fullRect = { x: 0, y: 0, width: L.width, height: L.height };

  // beats: drop (0) → hover (the reading window) → press → expand → headline.
  // The expansion is clamped so the headline + proof always fit before the
  // scene ends (>=44 frames of tail); the press needs >=1.5s of reading time —
  // give this block at least 3s, ideally 4s.
  const expandStart = Math.min(
    Math.max(Math.round(L.sceneFrames * 0.45), Math.round(L.fps * 1.5)) + 4,
    Math.max(8, L.sceneFrames - 44)
  );
  const pressFrame = expandStart - 4;
  const expandLand = expandStart + 18;

  const drop = springPop(L.frame, L.fps, { start: 2, damping: 13, stiffness: 160 });
  // the hover bob dies when the banner is pressed — a held thing stops moving
  const hoverDecay = 1 - tween(L.frame, { start: pressFrame, duration: 4, ease: "power2Out" });
  const hover = Math.sin((L.frame / L.fps) * Math.PI * 2 * 0.45) * 3 * hoverDecay;
  const press = tween(L.frame, { start: pressFrame, duration: 3, from: 1, to: 0.96, ease: "power2In" });
  const expandP = tween(L.frame, { start: expandStart, duration: 18, ease: "power3InOut" });
  // elliptical corner compensation: the un-rounding corner radius must be
  // divided by the (non-uniform) flip scale or it collapses on the first frame
  const inv = 1 - expandP;
  const sxEff = (bannerRect.width / fullRect.width) * inv + expandP;
  const syEff = (bannerRect.height / fullRect.height) * inv + expandP;
  const cornerPx = 48 * inv;
  const shake = decayShake(L.frame, { start: expandLand, durationFrames: 8, amplitude: 7, rotationDeg: 0.4, seed: 9 });
  const proofPop = springPop(L.frame, L.fps, { start: expandLand + 12, damping: 11 });

  return (
    <AbsoluteFill style={{ backgroundColor, color: textColor, fontFamily: fonts.body, overflow: "hidden", transform: `translate(${shake.x}px, ${shake.y}px) rotate(${shake.rot}deg)` }}>
      {/* ambient lock-screen glow */}
      <div aria-hidden="true" style={{ background: `radial-gradient(circle at 50% 18%, ${primaryColor}1f, transparent 55%)`, inset: 0, position: "absolute" }} />
      {/* the notification */}
      <div
        style={{
          left: bannerPad,
          position: "absolute",
          top: bannerTop,
          transform: `translateY(${(1 - drop) * -(bannerTop + NOTIFICATION_HEIGHT + 40) + hover}px) scale(${press})`,
          transformOrigin: "50% 0%",
          width: bannerW,
          zIndex: 1
        }}
      >
        <FakeNotification
          appName={appName}
          title={scene.headline}
          body={scene.body}
          iconSrc={logoPath ? assetSrc(logoPath) : undefined}
          width={bannerW}
          pressed={L.frame >= pressFrame}
        />
      </div>
      {/* press feedback + expansion into the hero */}
      <ImpactFlash start={expandStart + lead} peak={0.18} hold={1} fade={3} />
      {expandP > 0 ? (
        <FlipMove
          from={bannerRect}
          to={fullRect}
          start={expandStart + lead}
          duration={18}
          ease="power3InOut"
          fade
          style={{ borderRadius: `${cornerPx / Math.max(0.01, sxEff)}px / ${cornerPx / Math.max(0.01, syEff)}px`, overflow: "hidden", zIndex: 2 }}
        >
          <AbsoluteFill>
            <VisualFill asset={visualAsset} fallback={scene.visual} primaryColor={primaryColor} fontSize={84} />
            <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.8) 100%)" }} />
            <div style={{ bottom: L.padding + 20, left: L.padding, position: "absolute", right: L.padding }}>
              <KineticText
                as="h1"
                text={scene.headline}
                split="words"
                from="center"
                enter="clip"
                startFrame={expandLand + lead}
                perItem={2}
                duration={12}
                y={44}
                ease="power4Out"
                style={{ color: "#fff", fontFamily: fonts.display, fontSize: L.headlineSize + 8, lineHeight: 1.0, margin: 0, textShadow: "0 6px 30px rgba(0,0,0,0.5)" }}
              />
              {scene.proof && !hasCaptions ? (
                <p style={{ color: primaryColor, fontSize: L.proofSize, fontWeight: 800, margin: "16px 0 0", opacity: Math.min(1, proofPop * 1.4), transform: `scale(${0.75 + 0.25 * proofPop})`, transformOrigin: "left center" }}>
                  {scene.proof}
                </p>
              ) : null}
            </div>
          </AbsoluteFill>
        </FlipMove>
      ) : null}
    </AbsoluteFill>
  );
};

// charge-reveal: the ChargeBar progress beat (rush → squeeze → hold → slam).
const ChargeRevealBlock: React.FC<SceneProps> = ({ backgroundColor, brandName, fonts, lead, logoPath, platform, primaryColor, scene, textColor }) => {
  const L = useSceneLayout(platform, scene, lead);
  const { slamFrame } = chargeTimings(L.sceneFrames);
  return (
    <AbsoluteFill style={{ alignItems: "center", backgroundColor, color: textColor, display: "flex", flexDirection: "column", fontFamily: fonts.body, justifyContent: "center", overflow: "hidden", padding: L.padding }}>
      <div aria-hidden="true" style={{ background: `radial-gradient(circle at 50% 50%, ${primaryColor}26, transparent 60%)`, inset: 0, position: "absolute", zIndex: 0 }} />
      {/* full-frame slam flash at the block root: covers everything and does
          not travel with the bar's shake */}
      <ImpactFlash start={slamFrame + L.lead} peak={0.45} hold={2} fade={5} />
      <ChargeBar
        chargingLabel={scene.body ?? scene.visual}
        completeLabel={scene.headline}
        accent={primaryColor}
        textColor={textColor}
        fontDisplay={fonts.display}
        sceneFrames={L.sceneFrames}
        lead={L.lead}
      />
      <div style={{ left: L.padding, position: "absolute", right: L.padding, top: Math.round(L.padding * 0.5), zIndex: 2 }}>
        <BrandHeader brandName={brandName} logoPath={logoPath} eyebrow={scene.eyebrow} primaryColor={primaryColor} brandSize={L.brandSize} eyebrowSize={L.eyebrowSize} />
      </div>
    </AbsoluteFill>
  );
};

// CameraLayer — one camera per scene: handheld micro-drift + a scene-long slow
// push (no frame is ever fully static), plus the storyboard-declared impact
// shake. Wraps every block so the whole frame reacts, not just one element.
const CameraLayer: React.FC<{
  nominalFrames: number;
  seed: number;
  lead: number; // frames this Sequence started before the nominal scene start
  impact?: AdVideoProps["scenes"][number]["impact"];
  children: React.ReactNode;
}> = ({ nominalFrames, seed, lead, impact, children }) => {
  const frame = useCurrentFrame();
  const cam = cameraDrift(frame, nominalFrames, { seed });
  const heavy = impact?.strength !== "light";
  const shake = impact
    ? decayShake(frame, {
        start: impact.atFrame + lead,
        durationFrames: heavy ? 13 : 8,
        amplitude: heavy ? 18 : 7,
        rotationDeg: heavy ? 1 : 0.4,
        seed
      })
    : { x: 0, y: 0, rot: 0 };
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${cam.x + shake.x}px, ${cam.y + shake.y}px) rotate(${shake.rot}deg) scale(${cam.scale})`
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// Route each scene to its block; "standard" is the safe fallback.
const Scene: React.FC<SceneProps> = (props) => {
  const block: SceneBlockKind = props.scene.block ?? "standard";
  switch (block) {
    case "hero-morph":
      return <HeroMorphBlock {...props} />;
    case "cold-open-payoff":
      return <ColdOpenBlock {...props} />;
    case "split-before-after":
      return <SplitBlock {...props} />;
    case "device-frame":
      return <DeviceFrameBlock {...props} />;
    case "stat-slam":
      return <StatSlamBlock {...props} />;
    case "cta-card":
      return <CtaCardBlock {...props} />;
    case "ui-takeover":
      return <UiTakeoverBlock {...props} />;
    case "charge-reveal":
      return <ChargeRevealBlock {...props} />;
    case "standard":
      return <StandardBlock {...props} />;
    default: {
      const exhaustive: never = block;
      void exhaustive;
      return <StandardBlock {...props} />;
    }
  }
};

export const AdVideo: React.FC<AdVideoProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  const isLandscape = props.platform.includes("landscape") || width > height;
  const isSquare = props.platform.includes("square") || width === height;
  const footerInset = isLandscape ? 56 : isSquare ? 60 : 72;
  const footerFontSize = isLandscape ? 18 : isSquare ? 19 : 20;
  const fonts = getFontStacks(props.fontPreset);
  // the footer (offer + disclaimer) must stay readable when an inverted scene
  // floods the screen with a bright color — follow the current scene's bg
  const footerScene =
    props.scenes.find(
      (s) =>
        frame >= Math.round(s.startSecond * fps) &&
        frame < Math.round((s.startSecond + s.durationSecond) * fps)
    ) ?? props.scenes[props.scenes.length - 1];
  const footerBg = footerScene.colorMode === "inverted" ? props.primaryColor : props.backgroundColor;
  const footerColor = isBright(footerBg) ? "rgba(16,16,16,0.78)" : "rgba(255,255,255,0.72)";

  return (
    <AbsoluteFill style={{ backgroundColor: props.backgroundColor }}>
      <AudioLayer audio={props.audio} />

      {props.scenes.map((scene, index) => {
        const prev = index > 0 ? props.scenes[index - 1] : undefined;
        const next = props.scenes[index + 1];
        const isLast = index === props.scenes.length - 1;
        // entrance is derived from the previous scene's transitionOut so both
        // sides of a boundary move as one gesture; default handoff is a cut
        const enterKind: TransitionKind | undefined = prev ? (prev.transitionOut ?? "cut") : undefined;
        const exitKind: TransitionKind | undefined = isLast ? undefined : (scene.transitionOut ?? "cut");
        const nominalFrom = Math.round(scene.startSecond * fps);
        // anchor the scene's end on the next scene's rounded start when the
        // scenes are contiguous, so both sides of a boundary round identically
        // (round(start)+round(duration) can differ from round(next.start) by 1)
        const naturalEnd = Math.round((scene.startSecond + scene.durationSecond) * fps);
        const nextFrom = next ? Math.round(next.startSecond * fps) : naturalEnd;
        const sceneEnd = next && Math.abs(naturalEnd - nextFrom) <= 1 ? nextFrom : naturalEnd;
        const nominalFrames = Math.max(1, sceneEnd - nominalFrom);
        // whip transitions need both scenes alive during the shared window:
        // start this Sequence `lead` frames early, extend it `tail` frames late
        const lead = Math.min(enterKind ? TRANSITION_TIMING[enterKind].lead : 0, nominalFrom);
        const tail = exitKind ? TRANSITION_TIMING[exitKind].tail : 0;
        // stat-slam, charge-reveal, and ui-takeover fire their own landing
        // flash/shake; suppress the scene-level flash so a storyboard impact
        // on those blocks does not double-expose
        const blockKind = scene.block ?? "standard";
        const wantsSceneFlash =
          Boolean(scene.impact) && !["stat-slam", "charge-reveal", "ui-takeover"].includes(blockKind);
        // "inverted" floods the scene with the accent color; text colors are
        // picked by actual background luminance so dark brand colors stay
        // readable instead of assuming the primary is bright
        const inverted = scene.colorMode === "inverted";
        const sceneBg = inverted ? props.primaryColor : props.backgroundColor;
        const sceneAccent = inverted ? props.backgroundColor : props.primaryColor;
        const textColor = isBright(sceneBg) ? "#101010" : "#ffffff";
        const onAccent = isBright(sceneAccent) ? "#111111" : "#f2f2f2";
        return (
          <Sequence key={scene.id} from={nominalFrom - lead} durationInFrames={nominalFrames + lead + tail}>
            <SceneTransition enter={enterKind} exit={exitKind} enterLead={lead} nominalFrames={nominalFrames}>
              <CameraLayer nominalFrames={nominalFrames} seed={index} lead={lead} impact={scene.impact}>
                <Scene
                  backgroundColor={sceneBg}
                  brandName={props.brandName}
                  cta={props.cta}
                  fonts={fonts}
                  hasCaptions={Boolean(props.captions && props.captions.length > 0)}
                  heroImagePath={props.heroImagePath}
                  lead={lead}
                  logoPath={props.logoPath}
                  onAccent={onAccent}
                  platform={props.platform}
                  primaryColor={sceneAccent}
                  scene={scene}
                  textColor={textColor}
                />
                {scene.celebrate ? (
                  <Burst
                    start={
                      (scene.celebrate.startFrame ??
                        // charge-reveal's payoff is the slam, not the 40% mark
                        // (which lands mid-crawl and breaks the squeeze)
                        (blockKind === "charge-reveal"
                          ? chargeTimings(nominalFrames).slamFrame
                          : Math.round(nominalFrames * 0.4))) + lead
                    }
                    preset={scene.celebrate.preset}
                    colors={[sceneAccent, textColor, sceneAccent]}
                    origin={{ x: "50%", y: "44%" }}
                    zIndex={4}
                  />
                ) : null}
              </CameraLayer>
              {/* the flash sits outside the camera so it covers the real frame
                  even while the shake displaces the scene */}
              {wantsSceneFlash && scene.impact ? (
                <ImpactFlash
                  start={scene.impact.atFrame + lead}
                  peak={scene.impact.strength === "light" ? 0.3 : 0.7}
                  hold={scene.impact.strength === "light" ? 1 : 2}
                />
              ) : null}
            </SceneTransition>
          </Sequence>
        );
      })}

      {/* luma-wipe overlay panels: the cut hides while the panel covers the screen */}
      {props.scenes.map((scene, index) => {
        const next = props.scenes[index + 1];
        if (!next || scene.transitionOut !== "luma-wipe") {
          return null;
        }
        const boundary = Math.round(next.startSecond * fps);
        const from = Math.max(0, boundary - 6);
        // an inverted scene is already flooded with the primary color — sweep
        // the background color instead so the panel reads against it
        const panelColor = scene.colorMode === "inverted" ? props.backgroundColor : props.primaryColor;
        return (
          <Sequence key={`wipe-${scene.id}`} from={from} durationInFrames={13}>
            <LumaWipe color={panelColor} startOffset={6 - (boundary - from)} />
          </Sequence>
        );
      })}

      {/* karaoke captions: the voiceover's visual carrier, above all scenes.
          On inverted scenes the accent floods the screen, so the caption
          accent swaps to the background color for contrast. */}
      {props.captions && props.captions.length > 0 ? (
        <CaptionTrack
          captions={props.captions}
          accentColor={props.primaryColor}
          accentSwaps={props.scenes
            .filter((scene) => scene.colorMode === "inverted")
            .map((scene) => ({
              // ±4 frames: cover the whip lead-in and boundary rounding — both
              // ends sit inside transition windows where the early/late swap
              // is invisible
              from: Math.max(0, Math.round(scene.startSecond * fps) - 4),
              to: Math.round((scene.startSecond + scene.durationSecond) * fps) + 4,
              color: props.backgroundColor
            }))}
          fontFamily={fonts.display}
        />
      ) : null}

      {/* film finish: grain + vignette unify every layer into one medium */}
      {props.finish?.vignette === false ? null : <Vignette />}
      {props.finish?.grain === false ? null : <Grain />}

      <div
        style={{
          bottom: 36,
          color: footerColor,
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          fontSize: footerFontSize,
          left: footerInset,
          position: "absolute",
          right: footerInset
        }}
      >
        {props.offer ? `${props.offer} ` : ""}
        {props.disclaimer ?? ""}
      </div>
    </AbsoluteFill>
  );
};
