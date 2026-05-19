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
  primaryColor: string;
  scene: AdVideoProps["scenes"][number];
};

type AudioSpec = NonNullable<AdVideoProps["audio"]>;
type AudioTrack = AudioSpec["tracks"][number];

const audioSrc = (src: string) =>
  /^https?:\/\//i.test(src) ? src : staticFile(src);

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
            src={audioSrc(track.src)}
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
  primaryColor,
  scene
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
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

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        color: "#fff",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        justifyContent: "space-between",
        opacity,
        padding: 72,
        transform: `translateY(${y}px)`
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 24 }}>
        <strong style={{ fontSize: 34 }}>{brandName}</strong>
        {scene.eyebrow ? (
          <span style={{ color: primaryColor, fontSize: 28, fontWeight: 700 }}>
            {scene.eyebrow}
          </span>
        ) : null}
      </div>

      <div
        style={{
          alignItems: "center",
          display: "grid",
          gap: 48,
          gridTemplateRows: "1fr auto",
          minHeight: 980
        }}
      >
        <div
          style={{
            alignItems: "center",
            border: `3px solid ${primaryColor}`,
            borderRadius: 8,
            display: "flex",
            height: "100%",
            justifyContent: "center",
            overflow: "hidden",
            width: "100%"
          }}
        >
          {scene.imageUrl ? (
            <Img
              src={scene.imageUrl}
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
          <h1 style={{ fontSize: 84, lineHeight: 1.02, margin: 0 }}>
            {scene.headline}
          </h1>
          {scene.body ? (
            <p style={{ fontSize: 38, lineHeight: 1.18, margin: "28px 0 0" }}>
              {scene.body}
            </p>
          ) : null}
          {scene.proof ? (
            <p
              style={{
                color: primaryColor,
                fontSize: 30,
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
  const { fps } = useVideoConfig();

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
          fontSize: 20,
          left: 72,
          position: "absolute",
          right: 72
        }}
      >
        {props.offer ? `${props.offer} ` : ""}
        {props.disclaimer ?? ""}
      </div>
    </AbsoluteFill>
  );
};
