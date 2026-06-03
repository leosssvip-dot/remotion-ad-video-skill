import React from "react";
import { useCurrentFrame } from "remotion";
import { type EaseName, type StaggerFrom, staggerDelay, tween } from "./motion";

/**
 * KineticText — Remotion port of GSAP SplitText.
 *
 * Splits a string into characters, words, or lines and reveals the units with a
 * staggered eased entrance. This is the single most "ad-like" text move: a
 * headline whose words snap in from the centre, a CTA whose characters pop, a
 * benefit list whose lines cascade. Use it instead of fading a whole text block.
 *
 * Accessibility: the visible spans are aria-hidden and the real string is
 * exposed once via aria-label, so the text is announced normally.
 *
 * Example:
 *   <KineticText as="h1" text={scene.headline} split="words" from="center"
 *     startFrame={4} perItem={2} duration={14} y={40} ease="power3Out"
 *     style={{ fontSize: 84, margin: 0 }} />
 */

type SplitMode = "chars" | "words" | "lines";

type KineticTextProps = {
  text: string;
  split?: SplitMode; // default "words"
  startFrame?: number; // frame the reveal begins (local to the enclosing Sequence)
  perItem?: number; // stagger between units, in frames (default 2)
  duration?: number; // per-unit reveal length, in frames (default 12)
  from?: StaggerFrom; // stagger origin (default "start")
  y?: number; // vertical enter offset in px (default 28)
  rotate?: number; // enter rotation in deg (default 0)
  ease?: EaseName; // default "power3Out"
  as?: keyof React.JSX.IntrinsicElements; // wrapper tag (default "span")
  style?: React.CSSProperties;
  className?: string;
};

// Split into words while keeping the trailing space attached, so rejoining the
// row reproduces the original spacing.
const toWords = (line: string): string[] => line.match(/\S+\s*|\s+/g) ?? [];

export const KineticText: React.FC<KineticTextProps> = ({
  text,
  split = "words",
  startFrame = 0,
  perItem = 2,
  duration = 12,
  from = "start",
  y = 28,
  rotate = 0,
  ease = "power3Out",
  as = "span",
  style,
  className,
}) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  const Tag = as as React.ElementType;

  const lines = text.split("\n");

  // Count animatable units up front so the stagger normalises across the whole
  // string (a char wave keeps moving across word boundaries).
  const total =
    split === "lines"
      ? lines.length
      : split === "words"
        ? lines.reduce((sum, line) => sum + toWords(line).filter((w) => w.trim()).length, 0)
        : lines.reduce((sum, line) => sum + Array.from(line).filter((c) => c.trim()).length, 0);

  let unit = -1; // running index of animatable units

  const reveal = (key: string, content: React.ReactNode, animate: boolean, block: boolean) => {
    if (!animate) {
      // spaces / structural nodes — render but don't animate or consume a slot
      return (
        <span key={key} style={{ whiteSpace: "pre" }} aria-hidden>
          {content}
        </span>
      );
    }
    unit += 1;
    const delay = staggerDelay(unit, total, { each: perItem, from });
    const p = tween(local, { start: delay, duration, from: 0, to: 1, ease });
    return (
      <span
        key={key}
        aria-hidden
        style={{
          display: block ? "block" : "inline-block",
          whiteSpace: "pre",
          opacity: p,
          transform: `translateY(${(1 - p) * y}px) rotate(${(1 - p) * rotate}deg)`,
          willChange: "transform, opacity",
        }}
      >
        {content}
      </span>
    );
  };

  const renderLine = (line: string, li: number): React.ReactNode => {
    if (split === "lines") {
      return reveal(`l${li}`, line === "" ? " " : line, line.trim() !== "", true);
    }
    if (split === "words") {
      return toWords(line).map((w, wi) =>
        reveal(`l${li}w${wi}`, w, w.trim() !== "", false),
      );
    }
    // chars: keep words as inline-block wrappers so wrapping happens at spaces,
    // not mid-word; animate each non-space char inside.
    return toWords(line).map((token, wi) => {
      if (token.trim() === "") {
        return (
          <span key={`l${li}s${wi}`} style={{ whiteSpace: "pre" }} aria-hidden>
            {token}
          </span>
        );
      }
      return (
        <span key={`l${li}w${wi}`} style={{ display: "inline-block", whiteSpace: "pre" }} aria-hidden>
          {Array.from(token).map((ch, ci) =>
            ch.trim() === ""
              ? reveal(`l${li}w${wi}c${ci}`, ch, false, false)
              : reveal(`l${li}w${wi}c${ci}`, ch, true, false),
          )}
        </span>
      );
    });
  };

  return (
    <Tag className={className} aria-label={text} style={style}>
      {lines.map((line, li) => (
        <React.Fragment key={`line${li}`}>
          {renderLine(line, li)}
          {split !== "lines" && li < lines.length - 1 ? <br /> : null}
        </React.Fragment>
      ))}
    </Tag>
  );
};
