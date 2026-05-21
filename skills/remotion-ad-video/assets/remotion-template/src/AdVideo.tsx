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
type SceneMetric = NonNullable<AdVideoProps["scenes"][number]["metric"]>;

const assetSrc = (src: string) =>
  /^(https?:|data:)/i.test(src) ? src : staticFile(src);

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
        const renderedAudio = (
          <Audio
            src={assetSrc(track.src)}
            volume={track.volume ?? 0.85}
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
