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
  heroImagePath?: string;
  logoPath?: string;
  platform: AdVideoProps["platform"];
  primaryColor: string;
  scene: AdVideoProps["scenes"][number];
};

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
  "sfx-glitch": 0.24
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
        const from = Math.round((track.startSecond ?? 0) * fps);
        const durationInFrames = track.durationSecond
          ? Math.round(track.durationSecond * fps)
          : undefined;
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
}> = ({ isLandscape, isSquare, metric, primaryColor, sceneFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const from = metric.from ?? 0;
  const decimals = metric.decimals ?? (Number.isInteger(metric.to) && Number.isInteger(from) ? 0 : 1);
  const countFrames = Math.max(1, Math.min(sceneFrames - 1, Math.round(fps * 1.15)));
  const value = interpolate(frame, [0, countFrames], [from, metric.to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
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
      <strong style={{ fontSize: metricSize, lineHeight: 0.86 }}>
        {metric.prefix ?? ""}
        {formatMetricValue(value, decimals)}
        {metric.suffix ?? ""}
      </strong>
      {metric.label ? (
        <span style={{ fontSize: labelSize, fontWeight: 900, lineHeight: 1.1 }}>
          {metric.label}
        </span>
      ) : null}
    </div>
  );
};

const Scene: React.FC<SceneProps> = ({
  backgroundColor,
  brandName,
  heroImagePath,
  logoPath,
  platform,
  primaryColor,
  scene
}) => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  const isLandscape = platform.includes("landscape") || width > height;
  const isSquare = platform.includes("square") || width === height;
  const padding = isLandscape ? 56 : isSquare ? 60 : 72;
  const headlineSize = isLandscape ? 64 : isSquare ? 70 : 84;
  const bodySize = isLandscape ? 30 : isSquare ? 32 : 38;
  const proofSize = isLandscape ? 25 : isSquare ? 27 : 30;
  const brandSize = isLandscape ? 27 : isSquare ? 30 : 34;
  const eyebrowSize = isLandscape ? 22 : isSquare ? 24 : 28;
  const sceneFrames = Math.max(1, Math.round(scene.durationSecond * fps));
  const fadeOutStart = Math.max(10, sceneFrames - 16);
  const opacity = interpolate(frame, [0, 10, fadeOutStart, sceneFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const y = interpolate(frame, [0, 18], [36, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const visualScale = interpolate(frame, [0, 18, sceneFrames], [0.88, 1.02, 1.07], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const visualRotate = interpolate(frame, [0, 18], [isLandscape ? -2 : -3, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const headlineScale = interpolate(frame, [0, 14, sceneFrames], [1.08, 1, 1.02], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const contentLayout: React.CSSProperties = isLandscape
    ? {
        gridTemplateColumns: "0.95fr 1.05fr",
        gridTemplateRows: "1fr",
        minHeight: Math.max(520, height - padding * 3)
      }
    : {
        gridTemplateRows: "1fr auto",
        minHeight: isSquare ? 650 : 980
      };
  const visualFrameStyle: React.CSSProperties = {
    alignItems: "center",
    border: `3px solid ${primaryColor}`,
    borderRadius: 8,
    display: "flex",
    height: isLandscape ? Math.min(620, height - padding * 4) : "100%",
    justifyContent: "center",
    maxHeight: isSquare ? 470 : undefined,
    minHeight: isLandscape ? 420 : isSquare ? 390 : 560,
    overflow: "hidden",
    boxShadow: `0 28px 96px rgba(0,0,0,0.36), 0 0 0 12px ${primaryColor}22`,
    transform: `rotate(${visualRotate}deg) scale(${visualScale})`,
    width: "100%"
  };
  const accentShift = interpolate(frame, [0, sceneFrames], [-120, 120], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const visualAsset =
    scene.imagePath ?? scene.imageUrl ?? (scene.id === "hook" ? heroImagePath : undefined);

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        color: "#fff",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        justifyContent: "space-between",
        overflow: "hidden",
        opacity,
        padding,
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
      <div
        aria-hidden="true"
        style={{
          background: primaryColor,
          height: isLandscape ? 150 : 210,
          left: -80,
          opacity: 0.18,
          position: "absolute",
          right: -80,
          top: isLandscape ? 160 : 270,
          transform: "rotate(-8deg)",
          zIndex: 0
        }}
      />
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 24,
          justifyContent: "space-between",
          position: "relative",
          zIndex: 1
        }}
      >
        <div style={{ alignItems: "center", display: "flex", gap: 16, minWidth: 0 }}>
          {logoPath ? (
            <Img
              src={assetSrc(logoPath)}
              style={{
                borderRadius: 8,
                height: 46,
                objectFit: "contain",
                width: 46
              }}
            />
          ) : null}
          <strong style={{ fontSize: brandSize }}>{brandName}</strong>
        </div>
        {scene.eyebrow ? (
          <span style={{ color: primaryColor, fontSize: eyebrowSize, fontWeight: 700 }}>
            {scene.eyebrow}
          </span>
        ) : null}
      </div>

      <div
        style={{
          alignItems: "center",
          display: "grid",
          gap: isLandscape ? 52 : 48,
          position: "relative",
          zIndex: 1,
          ...contentLayout
        }}
      >
        <div style={visualFrameStyle}>
          {visualAsset ? (
            <Img
              src={assetSrc(visualAsset)}
              style={{ height: "100%", objectFit: "cover", width: "100%" }}
            />
          ) : (
            <span
              style={{
                color: primaryColor,
                fontSize: 44,
                fontWeight: 800,
                padding: 48,
                textAlign: "center"
              }}
            >
              {scene.visual}
            </span>
          )}
        </div>

        <div>
          <h1
            style={{
              fontSize: headlineSize,
              lineHeight: isLandscape ? 0.98 : 1.02,
              margin: 0,
              transform: `scale(${headlineScale})`,
              transformOrigin: "left center"
            }}
          >
            {scene.headline}
          </h1>
          {scene.body ? (
            <p style={{ fontSize: bodySize, lineHeight: 1.18, margin: "28px 0 0" }}>
              {scene.body}
            </p>
          ) : null}
          {scene.proof ? (
            <p
              style={{
                color: primaryColor,
                fontSize: proofSize,
                fontWeight: 800,
                margin: "24px 0 0"
              }}
            >
              {scene.proof}
            </p>
          ) : null}
          {scene.metric ? (
            <AnimatedMetric
              isLandscape={isLandscape}
              isSquare={isSquare}
              metric={scene.metric}
              primaryColor={primaryColor}
              sceneFrames={sceneFrames}
            />
          ) : null}
        </div>
      </div>
      <div aria-hidden="true" style={{ height: 48, position: "relative", zIndex: 1 }} />
    </AbsoluteFill>
  );
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
