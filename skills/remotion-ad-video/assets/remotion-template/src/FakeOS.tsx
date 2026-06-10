import React from "react";
import { Img } from "remotion";

/**
 * FakeOS — system-UI lookalikes, the highest-converting hook family.
 *
 * System UI is the highest-priority visual pattern in a viewer's muscle
 * memory: a push notification grabs attention faster than any motion-graphics
 * opener, and the "wait, this is an ad?" pattern interrupt when it expands
 * into the spot is the hook. These are deterministic DOM lookalikes — the one
 * category where a code renderer out-fakes filmed UGC.
 *
 * <FakeNotification> is the presentational banner; the `ui-takeover` scene
 * block in AdVideo.tsx drives the choreography (drop in → hover → press →
 * expand into the hero via FlipMove).
 */

// Sized for a 1080px-wide composition at ~2.75px/pt (393pt logical width):
// height ≈ 84pt, corner ≈ 17pt, type ≈ 15pt — modern iOS banner proportions.
export const NOTIFICATION_HEIGHT = 232;

type FakeNotificationProps = {
  appName: string;
  title: string;
  body?: string;
  iconSrc?: string;
  width: number;
  // pressed state darkens the banner slightly, like a real touch-down
  pressed?: boolean;
};

export const FakeNotification: React.FC<FakeNotificationProps> = ({
  appName,
  title,
  body,
  iconSrc,
  width,
  pressed = false,
}) => (
  <div
    style={{
      alignItems: "center",
      // translucent material over heavy blur — the frosted glass is what sells
      // "system UI"; a flat opaque card reads as a mockup
      backdropFilter: "blur(60px) saturate(1.8)",
      WebkitBackdropFilter: "blur(60px) saturate(1.8)",
      background: pressed ? "rgba(28,28,30,0.78)" : "rgba(44,44,46,0.6)",
      borderRadius: 48,
      boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
      color: "#fff",
      display: "flex",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, Inter, ui-sans-serif, system-ui, "Segoe UI", sans-serif',
      gap: 22,
      height: NOTIFICATION_HEIGHT,
      padding: "0 30px",
      width,
    }}
  >
    {iconSrc ? (
      <Img
        src={iconSrc}
        style={{ borderRadius: 26, flexShrink: 0, height: 104, objectFit: "cover", width: 104 }}
      />
    ) : (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(135deg, #4a4a4f, #2c2c2e)",
          borderRadius: 26,
          display: "flex",
          flexShrink: 0,
          fontSize: 50,
          fontWeight: 800,
          height: 104,
          justifyContent: "center",
          width: 104,
        }}
      >
        {appName.slice(0, 1).toUpperCase()}
      </div>
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ alignItems: "baseline", display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 28, fontWeight: 600, opacity: 0.6 }}>{appName}</span>
        <span style={{ fontSize: 26, opacity: 0.5 }}>now</span>
      </div>
      <div
        style={{
          fontSize: 40,
          fontWeight: 700,
          lineHeight: 1.2,
          marginTop: 6,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </div>
      {body ? (
        <div
          style={{
            fontSize: 34,
            lineHeight: 1.25,
            marginTop: 2,
            opacity: 0.8,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {body}
        </div>
      ) : null}
    </div>
  </div>
);
