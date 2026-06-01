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

type SceneProps = {
  backgroundColor: string;
  brandName: string;
  cta: string;
  heroImagePath?: string;
  logoPath?: string;
  platform: AdVideoProps["platform"];
  primaryColor: string;
  scene: AdVideoProps["scenes"][number];
};
type SceneBlockKind = NonNullable<AdVideoProps["scenes"][number]["block"]>;

type AudioSpec = NonNullable<AdVideoProps["audio"]>;
type AudioTrack = AudioSpec["tracks"][number];
type AudioPreset = NonNullable<AudioTrack["preset"]>;
type SceneMetric = NonNullable<AdVideoProps["scenes"][number]["metric"]>;

const assetSrc = (src: string) =>
  /^(https?:|data:)/i.test(src) ? src : staticFile(src);

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
  sceneFrames: number;
  variant?: "card" | "poster";
}> = ({ isLandscape, isSquare, metric, primaryColor, sceneFrames, variant = "card" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const from = metric.from ?? 0;
  const decimals = metric.decimals ?? (Number.isInteger(metric.to) && Number.isInteger(from) ? 0 : 1);
  const countFrames = Math.max(1, Math.min(sceneFrames - 1, Math.round(fps * 1.15)));
  const value = interpolate(frame, [0, countFrames], [from, metric.to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const valueText = `${metric.prefix ?? ""}${formatMetricValue(value, decimals)}${metric.suffix ?? ""}`;

  if (variant === "poster") {
    const posterScale = interpolate(frame, [0, countFrames], [0.7, 1], {
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
            transform: `scale(${posterScale})`
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
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const rotate = interpolate(frame, [0, countFrames], [-4, -1], {
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
        border: "5px solid #fff",
        borderRadius: 8,
        boxShadow: "0 24px 70px rgba(0,0,0,0.42)",
        color: "#111",
        display: "inline-flex",
        flexDirection: "column",
        gap: 2,
        marginTop: isLandscape ? 24 : 28,
        padding: isLandscape ? "16px 22px" : "20px 26px",
        transform: `rotate(${rotate}deg) scale(${scale})`,
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

const FONT_STACK =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const visualAssetFor = (scene: SceneProps["scene"], heroImagePath?: string) =>
  scene.imagePath ?? scene.imageUrl ?? (scene.id === "hook" ? heroImagePath : undefined);

const useSceneLayout = (platform: SceneProps["platform"], scene: SceneProps["scene"]) => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  const isLandscape = platform.includes("landscape") || width > height;
  const isSquare = platform.includes("square") || width === height;
  const sceneFrames = Math.max(1, Math.round(scene.durationSecond * fps));
  const fadeOutStart = Math.max(10, sceneFrames - 16);
  const opacity = interpolate(frame, [0, 10, fadeOutStart, sceneFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  return {
    frame,
    fps,
    height,
    width,
    isLandscape,
    isSquare,
    sceneFrames,
    opacity,
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
  heroImagePath,
  logoPath,
  platform,
  primaryColor,
  scene
}) => {
  const L = useSceneLayout(platform, scene);
  const visualAsset = visualAssetFor(scene, heroImagePath);
  const y = interpolate(L.frame, [0, 18], [36, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const visualScale = interpolate(L.frame, [0, 18, L.sceneFrames], [0.88, 1.02, 1.07], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const visualRotate = interpolate(L.frame, [0, 18], [L.isLandscape ? -2 : -3, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const headlineScale = interpolate(L.frame, [0, 14, L.sceneFrames], [1.08, 1, 1.02], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const accentShift = interpolate(L.frame, [0, L.sceneFrames], [-120, 120], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
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
    transform: `rotate(${visualRotate}deg) scale(${visualScale})`,
    width: "100%"
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        color: "#fff",
        fontFamily: FONT_STACK,
        justifyContent: "space-between",
        overflow: "hidden",
        opacity: L.opacity,
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
        <div style={visualFrameStyle}>
          <VisualFill asset={visualAsset} fallback={scene.visual} primaryColor={primaryColor} />
        </div>
        <div>
          <h1 style={{ fontSize: L.headlineSize, lineHeight: L.isLandscape ? 0.98 : 1.02, margin: 0, transform: `scale(${headlineScale})`, transformOrigin: "left center" }}>{scene.headline}</h1>
          {scene.body ? <p style={{ fontSize: L.bodySize, lineHeight: 1.18, margin: "28px 0 0" }}>{scene.body}</p> : null}
          {scene.proof ? <p style={{ color: primaryColor, fontSize: L.proofSize, fontWeight: 800, margin: "24px 0 0" }}>{scene.proof}</p> : null}
          {scene.metric ? <AnimatedMetric isLandscape={L.isLandscape} isSquare={L.isSquare} metric={scene.metric} primaryColor={primaryColor} sceneFrames={L.sceneFrames} /> : null}
        </div>
      </div>
      <div aria-hidden="true" style={{ height: 48, position: "relative", zIndex: 1 }} />
    </AbsoluteFill>
  );
};

// cold-open-payoff: full-bleed visual first; headline slams in late.
const ColdOpenBlock: React.FC<SceneProps> = ({ backgroundColor, brandName, heroImagePath, logoPath, platform, primaryColor, scene }) => {
  const L = useSceneLayout(platform, scene);
  const visualAsset = visualAssetFor(scene, heroImagePath);
  const zoom = interpolate(L.frame, [0, L.sceneFrames], [1.12, 1.24], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const textStart = Math.round(L.sceneFrames * 0.34);
  const textIn = interpolate(L.frame, [textStart, textStart + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const textY = interpolate(L.frame, [textStart, textStart + 12], [60, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor, color: "#fff", fontFamily: FONT_STACK, overflow: "hidden", opacity: L.opacity }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <VisualFill asset={visualAsset} fallback={scene.visual} primaryColor={primaryColor} fontSize={84} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 32%, rgba(0,0,0,0) 46%, rgba(0,0,0,0.84) 100%)" }} />
      <div style={{ left: L.padding, position: "absolute", right: L.padding, top: L.padding, zIndex: 2 }}>
        <BrandHeader brandName={brandName} logoPath={logoPath} eyebrow={scene.eyebrow} primaryColor={primaryColor} brandSize={L.brandSize} eyebrowSize={L.eyebrowSize} />
      </div>
      <div style={{ bottom: L.padding + 20, left: L.padding, opacity: textIn, position: "absolute", right: L.padding, transform: `translateY(${textY}px)`, zIndex: 2 }}>
        <h1 style={{ fontSize: L.headlineSize + 8, lineHeight: 1.0, margin: 0, textShadow: "0 6px 30px rgba(0,0,0,0.5)" }}>{scene.headline}</h1>
        {scene.proof ? <p style={{ color: primaryColor, fontSize: L.proofSize, fontWeight: 800, margin: "16px 0 0" }}>{scene.proof}</p> : null}
      </div>
    </AbsoluteFill>
  );
};

// split-before-after: kinetic split; dim "before" half vs colored "after" half.
const SplitBlock: React.FC<SceneProps> = ({ backgroundColor, brandName, heroImagePath, logoPath, platform, primaryColor, scene }) => {
  const L = useSceneLayout(platform, scene);
  const visualAsset = visualAssetFor(scene, heroImagePath);
  const reveal = interpolate(L.frame, [6, Math.max(14, Math.round(L.sceneFrames * 0.5))], [0.5, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const beforeLabel = "Before";
  const afterLabel = "After";
  const panelBase: React.CSSProperties = { alignItems: "center", display: "flex", flex: 1, justifyContent: "center", overflow: "hidden", position: "relative" };
  return (
    <AbsoluteFill style={{ backgroundColor, color: "#fff", fontFamily: FONT_STACK, overflow: "hidden", opacity: L.opacity }}>
      <div style={{ display: "flex", flexDirection: L.isLandscape ? "row" : "column", height: "100%", width: "100%" }}>
        <div style={{ ...panelBase, filter: "grayscale(1) brightness(0.55)" }}>
          <VisualFill asset={visualAsset} fallback={scene.visual} primaryColor="#888" fontSize={56} />
          <span style={{ background: "rgba(0,0,0,0.55)", borderRadius: 6, fontSize: L.eyebrowSize, fontWeight: 800, left: 24, letterSpacing: 1, padding: "8px 14px", position: "absolute", textTransform: "uppercase", top: 108 }}>{beforeLabel}</span>
        </div>
        <div style={{ ...panelBase, transform: `scale(${reveal})` }}>
          <div aria-hidden="true" style={{ background: primaryColor, inset: 0, opacity: 0.16, position: "absolute" }} />
          <VisualFill asset={visualAsset} fallback={scene.visual} primaryColor={primaryColor} fontSize={56} />
          <span style={{ background: primaryColor, borderRadius: 6, bottom: 76, color: "#111", fontSize: L.eyebrowSize, fontWeight: 900, letterSpacing: 1, padding: "8px 14px", position: "absolute", right: 24, textTransform: "uppercase" }}>{afterLabel}</span>
        </div>
      </div>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <h1 style={{ background: "rgba(0,0,0,0.5)", borderRadius: 10, fontSize: L.headlineSize, lineHeight: 1.0, margin: 0, maxWidth: "82%", padding: "18px 26px", textAlign: "center" }}>{scene.headline}</h1>
      </AbsoluteFill>
      <div style={{ left: L.padding, position: "absolute", right: L.padding, top: Math.round(L.padding * 0.5), zIndex: 3 }}>
        <BrandHeader brandName={brandName} logoPath={logoPath} eyebrow={scene.eyebrow} primaryColor={primaryColor} brandSize={L.brandSize} eyebrowSize={L.eyebrowSize} />
      </div>
    </AbsoluteFill>
  );
};

// device-frame: content shown inside a phone frame; feed/app-native feel.
const DeviceFrameBlock: React.FC<SceneProps> = ({ backgroundColor, brandName, heroImagePath, logoPath, platform, primaryColor, scene }) => {
  const L = useSceneLayout(platform, scene);
  const visualAsset = visualAssetFor(scene, heroImagePath);
  const float = interpolate(L.frame % 90, [0, 45, 90], [0, -14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rise = interpolate(L.frame, [0, 16], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const deviceH = L.isLandscape ? Math.min(560, L.height - 200) : Math.min(L.height * 0.62, 1080);
  const deviceW = deviceH * 0.48;
  return (
    <AbsoluteFill style={{ alignItems: "center", backgroundColor, color: "#fff", display: "flex", flexDirection: L.isLandscape ? "row" : "column", fontFamily: FONT_STACK, gap: L.isLandscape ? 64 : 36, justifyContent: "center", overflow: "hidden", opacity: L.opacity, padding: L.padding }}>
      <div aria-hidden="true" style={{ background: `radial-gradient(circle at 50% 40%, ${primaryColor}33, transparent 60%)`, inset: 0, position: "absolute", zIndex: 0 }} />
      <div style={{ background: "#0b0b0b", borderRadius: 44, boxShadow: `0 40px 120px rgba(0,0,0,0.5), 0 0 0 10px ${primaryColor}22`, height: deviceH, padding: 14, position: "relative", transform: `translateY(${float + rise}px)`, width: deviceW, zIndex: 1 }}>
        <div aria-hidden="true" style={{ background: "#0b0b0b", borderBottomLeftRadius: 12, borderBottomRightRadius: 12, height: 26, left: "50%", position: "absolute", top: 14, transform: "translateX(-50%)", width: deviceW * 0.42, zIndex: 2 }} />
        <div style={{ background: "#151515", borderRadius: 32, height: "100%", overflow: "hidden", width: "100%" }}>
          <VisualFill asset={visualAsset} fallback={scene.visual} primaryColor={primaryColor} fontSize={40} />
        </div>
      </div>
      <div style={{ maxWidth: L.isLandscape ? "42%" : "90%", position: "relative", textAlign: L.isLandscape ? "left" : "center", zIndex: 1 }}>
        <h1 style={{ fontSize: L.headlineSize, lineHeight: 1.02, margin: 0 }}>{scene.headline}</h1>
        {scene.body ? <p style={{ fontSize: L.bodySize, lineHeight: 1.18, margin: "20px 0 0", opacity: 0.92 }}>{scene.body}</p> : null}
      </div>
      <div style={{ left: L.padding, position: "absolute", right: L.padding, top: Math.round(L.padding * 0.5), zIndex: 2 }}>
        <BrandHeader brandName={brandName} logoPath={logoPath} eyebrow={scene.eyebrow} primaryColor={primaryColor} brandSize={L.brandSize} eyebrowSize={L.eyebrowSize} />
      </div>
    </AbsoluteFill>
  );
};

// stat-slam: a source-backed number dominates the frame.
const StatSlamBlock: React.FC<SceneProps> = ({ backgroundColor, brandName, logoPath, platform, primaryColor, scene }) => {
  const L = useSceneLayout(platform, scene);
  const headlineIn = interpolate(L.frame, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", backgroundColor, color: "#fff", display: "flex", flexDirection: "column", fontFamily: FONT_STACK, gap: 24, justifyContent: "center", overflow: "hidden", opacity: L.opacity, padding: L.padding }}>
      <div aria-hidden="true" style={{ background: `repeating-linear-gradient(135deg, transparent 0 60px, ${primaryColor}14 60px 78px)`, inset: 0, position: "absolute", zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        {scene.eyebrow ? <p style={{ color: primaryColor, fontSize: L.eyebrowSize, fontWeight: 800, letterSpacing: 2, margin: 0, textAlign: "center", textTransform: "uppercase" }}>{scene.eyebrow}</p> : null}
        {scene.metric ? (
          <AnimatedMetric isLandscape={L.isLandscape} isSquare={L.isSquare} metric={scene.metric} primaryColor={primaryColor} sceneFrames={L.sceneFrames} variant="poster" />
        ) : (
          <strong style={{ color: primaryColor, display: "block", fontSize: L.isLandscape ? 160 : 240, letterSpacing: -4, lineHeight: 0.82, textAlign: "center" }}>{scene.visual}</strong>
        )}
      </div>
      <h1 style={{ fontSize: L.headlineSize, lineHeight: 1.02, margin: 0, maxWidth: "84%", opacity: headlineIn, position: "relative", textAlign: "center", zIndex: 1 }}>{scene.headline}</h1>
      {scene.proof ? <p style={{ fontSize: L.proofSize, fontWeight: 700, margin: 0, opacity: 0.86, position: "relative", textAlign: "center", zIndex: 1 }}>{scene.proof}</p> : null}
      <div style={{ left: L.padding, position: "absolute", right: L.padding, top: Math.round(L.padding * 0.5), zIndex: 2 }}>
        <BrandHeader brandName={brandName} logoPath={logoPath} primaryColor={primaryColor} brandSize={L.brandSize} eyebrowSize={L.eyebrowSize} />
      </div>
    </AbsoluteFill>
  );
};

// cta-card: centered conversion poster with a pulsing CTA button.
const CtaCardBlock: React.FC<SceneProps> = ({ backgroundColor, brandName, cta, logoPath, platform, primaryColor, scene }) => {
  const L = useSceneLayout(platform, scene);
  const pop = interpolate(L.frame, [0, 16], [0.8, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulse = 1 + 0.04 * Math.sin((L.frame / L.fps) * Math.PI * 2 * 1.4);
  return (
    <AbsoluteFill style={{ alignItems: "center", backgroundColor, color: "#fff", display: "flex", flexDirection: "column", fontFamily: FONT_STACK, gap: 30, justifyContent: "center", overflow: "hidden", opacity: L.opacity, padding: L.padding, textAlign: "center" }}>
      <div aria-hidden="true" style={{ background: `radial-gradient(circle at 50% 50%, ${primaryColor}3a, transparent 62%)`, inset: 0, position: "absolute", zIndex: 0 }} />
      <div style={{ alignItems: "center", display: "flex", flexDirection: "column", gap: 18, position: "relative", transform: `scale(${pop})`, zIndex: 1 }}>
        {logoPath ? <Img src={assetSrc(logoPath)} style={{ borderRadius: 12, height: 72, objectFit: "contain", width: 72 }} /> : null}
        <h1 style={{ fontSize: L.headlineSize + 6, lineHeight: 1.0, margin: 0, maxWidth: "90%" }}>{scene.headline}</h1>
        {scene.body ? <p style={{ fontSize: L.bodySize, lineHeight: 1.2, margin: 0, opacity: 0.9 }}>{scene.body}</p> : null}
      </div>
      <div style={{ background: primaryColor, borderRadius: 999, boxShadow: `0 24px 70px ${primaryColor}66`, color: "#111", fontSize: L.brandSize + 2, fontWeight: 900, padding: "22px 52px", position: "relative", transform: `scale(${pulse})`, zIndex: 1 }}>{cta}</div>
      {scene.proof ? <p style={{ fontSize: L.proofSize, fontWeight: 700, margin: 0, opacity: 0.82, position: "relative", zIndex: 1 }}>{scene.proof}</p> : null}
      <strong style={{ bottom: L.padding, fontSize: L.brandSize, position: "absolute", zIndex: 1 }}>{brandName}</strong>
    </AbsoluteFill>
  );
};

// Route each scene to its block; "standard" is the safe fallback.
const Scene: React.FC<SceneProps> = (props) => {
  const block: SceneBlockKind = props.scene.block ?? "standard";
  switch (block) {
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
  const { fps, height, width } = useVideoConfig();
  const isLandscape = props.platform.includes("landscape") || width > height;
  const isSquare = props.platform.includes("square") || width === height;
  const footerInset = isLandscape ? 56 : isSquare ? 60 : 72;
  const footerFontSize = isLandscape ? 18 : isSquare ? 19 : 20;

  return (
    <AbsoluteFill style={{ backgroundColor: props.backgroundColor }}>
      <AudioLayer audio={props.audio} />

      {props.scenes.map((scene) => (
        <Sequence
          key={scene.id}
          from={Math.round(scene.startSecond * fps)}
          durationInFrames={Math.round(scene.durationSecond * fps)}
        >
          <Scene
            backgroundColor={props.backgroundColor}
            brandName={props.brandName}
            cta={props.cta}
            heroImagePath={props.heroImagePath}
            logoPath={props.logoPath}
            platform={props.platform}
            primaryColor={props.primaryColor}
            scene={scene}
          />
        </Sequence>
      ))}

      <div
        style={{
          bottom: 36,
          color: "rgba(255,255,255,0.72)",
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
