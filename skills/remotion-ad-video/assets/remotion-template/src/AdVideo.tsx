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

const assetSrc = (src: string) =>
  /^(https?:|data:)/i.test(src) ? src : staticFile(src);

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
    width: "100%"
  };
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
        opacity,
        padding,
        transform: `translateY(${y}px)`
      }}
    >
      <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 24 }}>
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
          <h1 style={{ fontSize: headlineSize, lineHeight: isLandscape ? 0.98 : 1.02, margin: 0 }}>
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
        </div>
      </div>
      <div aria-hidden="true" style={{ height: 48 }} />
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
