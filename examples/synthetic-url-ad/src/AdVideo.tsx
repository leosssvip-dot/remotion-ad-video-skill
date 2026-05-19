import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig
} from "remotion";
import type { AdVideoProps } from "./schema";

const LampVisual: React.FC<{ color: string; sceneId: string }> = ({ color, sceneId }) => {
  const frame = useCurrentFrame();
  const pulse = interpolate(frame % 60, [0, 30, 60], [0.72, 1, 0.72]);
  const scatter = sceneId === "mess" ? 1 : 0;

  return (
    <div style={{ height: 760, position: "relative", width: 760 }}>
      <div
        style={{
          background: `linear-gradient(180deg, ${color}, rgba(255,255,255,0.05))`,
          clipPath: "polygon(42% 0, 58% 0, 90% 100%, 10% 100%)",
          height: 620,
          left: 70,
          opacity: pulse,
          position: "absolute",
          top: 120,
          width: 620
        }}
      />
      <div
        style={{
          background: "#f8fafc",
          border: "8px solid #111827",
          borderRadius: 999,
          boxShadow: `0 0 80px ${color}`,
          height: 132,
          left: 314,
          position: "absolute",
          top: 60,
          width: 132
        }}
      />
      {[0, 1, 2, 3, 4].map((item) => (
        <div
          key={item}
          style={{
            background: item % 2 ? "#111827" : color,
            borderRadius: 8,
            bottom: 70 + item * 42,
            height: 28,
            left: 160 + item * 88 + scatter * (item % 2 ? 90 : -70),
            opacity: 0.92,
            position: "absolute",
            transform: `rotate(${scatter ? item * 11 - 18 : 0}deg)`,
            width: item % 2 ? 150 : 96
          }}
        />
      ))}
    </div>
  );
};

const Scene: React.FC<{
  props: AdVideoProps;
  scene: AdVideoProps["scenes"][number];
}> = ({ props, scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = Math.max(1, Math.round(scene.durationSecond * fps));
  const enterY = interpolate(frame, [0, 18], [54, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const opacity = interpolate(frame, [0, 10, duration - 12, duration], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  return (
    <AbsoluteFill
      style={{
        background: props.backgroundColor,
        color: "#f8fafc",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        opacity,
        overflow: "hidden",
        padding: 72,
        transform: `translateY(${enterY}px)`
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong style={{ fontSize: 34 }}>{props.brandName}</strong>
        <span style={{ color: props.primaryColor, fontSize: 28, fontWeight: 800 }}>
          {scene.eyebrow}
        </span>
      </div>

      <div
        style={{
          alignItems: "center",
          display: "grid",
          gridTemplateRows: "820px auto",
          height: "100%",
          paddingBottom: 120
        }}
      >
        <div style={{ alignItems: "center", display: "flex", justifyContent: "center" }}>
          <LampVisual color={props.primaryColor} sceneId={scene.id} />
        </div>
        <div>
          <p
            style={{
              color: props.primaryColor,
              fontSize: 30,
              fontWeight: 800,
              margin: "0 0 20px"
            }}
          >
            {scene.visual}
          </p>
          <h1 style={{ fontSize: 88, lineHeight: 1.02, margin: 0 }}>{scene.headline}</h1>
          {scene.body ? (
            <p style={{ color: "#cbd5e1", fontSize: 38, lineHeight: 1.18, margin: "28px 0 0" }}>
              {scene.body}
            </p>
          ) : null}
          {scene.proof ? (
            <p style={{ color: props.primaryColor, fontSize: 32, fontWeight: 900 }}>
              {scene.proof}
            </p>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const AdVideo: React.FC<AdVideoProps> = (props) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: props.backgroundColor }}>
      {props.scenes.map((scene) => (
        <Sequence
          key={scene.id}
          from={Math.round(scene.startSecond * fps)}
          durationInFrames={Math.round(scene.durationSecond * fps)}
        >
          <Scene props={props} scene={scene} />
        </Sequence>
      ))}

      <div
        style={{
          bottom: 48,
          color: "#94a3b8",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          fontSize: 22,
          left: 72,
          position: "absolute",
          right: 72
        }}
      >
        {props.cta} · {props.disclaimer}
      </div>
    </AbsoluteFill>
  );
};
