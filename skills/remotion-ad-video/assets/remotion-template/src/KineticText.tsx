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
 * `enter` picks the per-unit move (recommended ease in parentheses):
 * - "rise"    translate + fade — the readable default (power3Out)
 * - "clip"    units cut out of an invisible mask, no fade — editorial knife
 *             feel (power4Out)
 * - "pop"     scale 0.4→1 — badges, CTAs, playful beats (backOutHard)
 * - "flip3d"  rotateX hinge from the top edge — app/tech reveals (backOutSoft)
 * - "blur"    12px focus-in — dreamy/premium openers (power3Out)
 * - "slam"    scale 2.6→1 crash-in — impact words; pair with a shake/flash
 *             (power3In)
 *
 * `accentWords` paints matching words (case/punctuation-insensitive) in
 * `accentColor` — make the operative word the loud one.
 *
 * Accessibility: the visible spans are aria-hidden and the real string is
 * exposed once via aria-label, so the text is announced normally.
 *
 * Example:
 *   <KineticText as="h1" text={scene.headline} split="words" from="center"
 *     startFrame={4} perItem={2} duration={14} y={40} ease="power3Out"
 *     enter="clip" accentWords={["faster"]} accentColor={primaryColor}
 *     style={{ fontSize: 84, margin: 0 }} />
 */

type SplitMode = "chars" | "words" | "lines";
type EnterMode = "rise" | "clip" | "pop" | "flip3d" | "blur" | "slam";

type KineticTextProps = {
  text: string;
  split?: SplitMode; // default "words"
  enter?: EnterMode; // default "rise"
  startFrame?: number; // frame the reveal begins (local to the enclosing Sequence)
  perItem?: number; // stagger between units, in frames (default 2)
  duration?: number; // per-unit reveal length, in frames (default 12)
  from?: StaggerFrom; // stagger origin (default "start")
  y?: number; // vertical enter offset in px (default 28)
  rotate?: number; // enter rotation in deg (default 0)
  ease?: EaseName; // default "power3Out"
  accentWords?: string[]; // words to paint in accentColor (words/chars splits)
  accentColor?: string;
  as?: keyof React.JSX.IntrinsicElements; // wrapper tag (default "span")
  style?: React.CSSProperties;
  className?: string;
};

const normalizeWord = (word: string): string =>
  word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

// Split into words while keeping the trailing space attached, so rejoining the
// row reproduces the original spacing.
const toWords = (line: string): string[] => line.match(/\S+\s*|\s+/g) ?? [];

export const KineticText: React.FC<KineticTextProps> = ({
  text,
  split = "words",
  enter = "rise",
  startFrame = 0,
  perItem = 2,
  duration = 12,
  from = "start",
  y = 28,
  rotate = 0,
  ease = "power3Out",
  accentWords,
  accentColor,
  as = "span",
  style,
  className,
}) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  const Tag = as as React.ElementType;
  const accentSet = accentWords ? new Set(accentWords.map(normalizeWord)) : undefined;

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

  const reveal = (key: string, content: React.ReactNode, animate: boolean, block: boolean, accent = false) => {
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
    const color = accent && accentColor ? accentColor : undefined;
    const base: React.CSSProperties = {
      display: block ? "block" : "inline-block",
      whiteSpace: "pre",
      color,
      willChange: "transform, opacity",
    };

    if (enter === "clip") {
      // mask reveal: the unit is cut out of an invisible box — no fade at all.
      // The mask gets em-level bleed (padding cancelled by negative margins) so
      // tight line-heights don't clip ascenders/descenders once the unit is at
      // rest; the entry offset must clear the enlarged mask, hence 145%.
      return (
        <span
          key={key}
          aria-hidden
          style={{
            ...base,
            margin: "-0.3em -0.06em",
            overflow: "hidden",
            padding: "0.3em 0.06em",
            verticalAlign: "top",
          }}
        >
          <span style={{ display: "inline-block", transform: `translateY(${(1 - p) * 145}%)` }}>{content}</span>
        </span>
      );
    }

    let opacity = p;
    let transform = "";
    let filter: string | undefined;
    switch (enter) {
      case "pop":
        opacity = Math.min(1, p * 2);
        transform = `scale(${0.4 + 0.6 * p}) translateY(${(1 - p) * y * 0.3}px)`;
        break;
      case "flip3d":
        opacity = Math.min(1, p * 4);
        transform = `rotateX(${(1 - p) * -90}deg)`;
        break;
      case "blur":
        filter = p < 0.99 ? `blur(${(1 - p) * 12}px)` : undefined;
        transform = `translateY(${(1 - p) * y * 0.3}px)`;
        break;
      case "slam":
        // dead zone then steep ramp: the word appears near-solid instead of
        // hovering as a giant translucent ghost for the first accelerating frames
        opacity = p < 0.05 ? 0 : Math.min(1, (p - 0.05) * 8);
        transform = `scale(${1 + (1 - p) * 1.6})`;
        break;
      default:
        // rise
        transform = `translateY(${(1 - p) * y}px) rotate(${(1 - p) * rotate}deg)`;
    }

    return (
      <span
        key={key}
        aria-hidden
        style={{
          ...base,
          opacity,
          transform,
          transformOrigin: enter === "flip3d" ? "50% 0%" : undefined,
          filter,
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
        reveal(`l${li}w${wi}`, w, w.trim() !== "", false, accentSet?.has(normalizeWord(w)) ?? false),
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
      const accent = accentSet?.has(normalizeWord(token)) ?? false;
      return (
        <span
          key={`l${li}w${wi}`}
          style={{
            display: "inline-block",
            whiteSpace: "pre",
            // keep per-char rotateX in the ancestor's perspective space
            perspective: enter === "flip3d" ? 800 : undefined,
          }}
          aria-hidden
        >
          {Array.from(token).map((ch, ci) =>
            ch.trim() === ""
              ? reveal(`l${li}w${wi}c${ci}`, ch, false, false)
              : reveal(`l${li}w${wi}c${ci}`, ch, true, false, accent),
          )}
        </span>
      );
    });
  };

  return (
    <Tag
      className={className}
      aria-label={text}
      style={enter === "flip3d" ? { perspective: 800, ...style } : style}
    >
      {lines.map((line, li) => (
        <React.Fragment key={`line${li}`}>
          {renderLine(line, li)}
          {split !== "lines" && li < lines.length - 1 ? <br /> : null}
        </React.Fragment>
      ))}
    </Tag>
  );
};
