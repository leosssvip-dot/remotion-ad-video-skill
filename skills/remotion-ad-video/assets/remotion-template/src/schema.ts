import { z } from "zod";

export const SceneMetricSchema = z.object({
  label: z.string().optional(),
  from: z.number().optional(),
  to: z.number(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  decimals: z.number().int().min(0).max(2).optional()
});

// Scene blocks select a distinct layout + motion treatment so the chosen
// concept's structure actually renders differently. "standard" is the fallback.
export const SceneBlockSchema = z.enum([
  "standard",
  "cold-open-payoff",
  "split-before-after",
  "device-frame",
  "stat-slam",
  "cta-card",
  "hero-morph",
  // fake push notification drops in, gets pressed, expands into the hero —
  // the system-UI hook. eyebrow = app name, headline = notification title,
  // body = notification line, visual/image = the expanded hero.
  "ui-takeover",
  // progress-bar psychology: rush → 99% squeeze → hold → 100% slam.
  // body = charging label, headline = the payoff line.
  "charge-reveal"
]);

// How a scene hands off to the next one. "cut" is the default — scene-level
// crossfades are the slide-deck failure mode; pick a directional move instead
// and avoid using the same kind on two consecutive boundaries.
export const TransitionKindSchema = z.enum([
  "cut",
  "fade",
  "whip-left",
  "whip-right",
  "whip-up",
  "zoom-punch",
  "luma-wipe"
]);

// A landing beat inside the scene: screen shake + impact flash on that frame.
// Sync an sfx-impact / sfx-sub-boom track to the same frame.
export const SceneImpactSchema = z.object({
  atFrame: z.number().int().min(0),
  strength: z.enum(["light", "heavy"]).optional()
});

// A particle payoff (reward / spectacle beat) the storyboard can fire in any
// scene without writing code.
export const SceneCelebrateSchema = z.object({
  preset: z.enum(["confetti", "coins", "sparks", "debris"]),
  startFrame: z.number().int().min(0).optional()
});

export const SceneSchema = z.object({
  id: z.string(),
  startSecond: z.number().min(0),
  durationSecond: z.number().positive(),
  block: SceneBlockSchema.optional(),
  transitionOut: TransitionKindSchema.optional(),
  impact: SceneImpactSchema.optional(),
  celebrate: SceneCelebrateSchema.optional(),
  // "inverted" floods the scene with the primary color and flips text dark —
  // free color rhythm. Use on one beat (stat-slam / cta-card), not everywhere.
  colorMode: z.enum(["default", "inverted"]).optional(),
  eyebrow: z.string().optional(),
  headline: z.string(),
  body: z.string().optional(),
  visual: z.string(),
  proof: z.string().optional(),
  metric: SceneMetricSchema.optional(),
  imagePath: z.string().optional(),
  imageUrl: z.string().url().optional()
});

// Typography direction. "clean-sans" is the no-network default (system Inter
// stack); every other preset loads a distinctive display face via
// @remotion/google-fonts at render time (requires network once per render).
export const FontPresetSchema = z.enum([
  "clean-sans",
  "bold-geometric",
  "condensed-impact",
  "editorial-serif",
  "rounded-friendly",
  "mono-tech"
]);

// Film-finish overlays. Both default ON; set false to opt out.
export const FinishSchema = z.object({
  grain: z.boolean().optional(),
  vignette: z.boolean().optional()
});

// Karaoke captions: the visual carrier for the voiceover (most feeds play
// muted). One entry per spoken sentence; words carry per-word timing. When
// `words` is omitted the words are distributed evenly across the window.
export const CaptionWordSchema = z.object({
  w: z.string(),
  atFrame: z.number().int().min(0),
  emphasis: z.boolean().optional()
});

export const CaptionSchema = z
  .object({
    text: z.string(),
    startFrame: z.number().int().min(0),
    endFrame: z.number().int().min(1),
    words: z.array(CaptionWordSchema).optional()
  })
  .refine((caption) => caption.endFrame > caption.startFrame, {
    message: "Caption endFrame must be greater than startFrame"
  });

export const AudioPresetSchema = z.enum([
  "music-pulse-120",
  "music-clean-100",
  "sfx-click",
  "sfx-tap",
  "sfx-pop",
  "sfx-swipe",
  "sfx-whoosh",
  "sfx-riser",
  "sfx-impact",
  "sfx-stinger",
  "sfx-success",
  "sfx-notification",
  "sfx-coin",
  "sfx-tactile-snap",
  "sfx-glitch",
  "sfx-camera-shutter",
  "sfx-light-switch",
  "sfx-sub-boom",
  "sfx-sparkle",
  "sfx-count-tick",
  "sfx-bass-drop",
  "sfx-pack-open",
  "sfx-combo-burst",
  "sfx-reveal-hit",
  "sfx-soft-chime"
]);

export const AudioSyncSchema = z.object({
  sceneId: z.string(),
  anchor: z.enum([
    "scene-start",
    "scene-cut",
    "headline-enter",
    "visual-lock",
    "metric-count",
    "cta-land",
    "transition-lead",
    "reward"
  ]),
  offsetFrames: z.number().int().min(-90).max(180).optional(),
  note: z.string().optional()
});

export const AudioTrackSchema = z.object({
  id: z.string(),
  src: z.string().optional(),
  preset: AudioPresetSchema.optional(),
  kind: z.enum(["musicBed", "sfx", "voiceover"]).optional(),
  category: z.enum([
    "ui",
    "transition",
    "impact",
    "product",
    "metric",
    "reward",
    "notification",
    "music",
    "voice"
  ]).optional(),
  event: z.string().optional(),
  sync: AudioSyncSchema.optional(),
  startFrame: z.number().int().min(0).optional(),
  startSecond: z.number().min(0).optional(),
  durationFrames: z.number().int().positive().optional(),
  durationSecond: z.number().positive().optional(),
  volume: z.number().min(0).max(1).optional(),
  loop: z.boolean().optional(),
  rightsStatus: z.enum([
    "user_supplied",
    "licensed",
    "generated",
    "public_reference",
    "needs_verification"
  ])
}).refine((track) => Boolean(track.src || track.preset), {
  message: "Audio tracks must provide either src or preset"
});

export const AudioSpecSchema = z.object({
  enabled: z.boolean(),
  mode: z.enum(["silent-safe", "sfx-only", "music-sfx", "voiceover"]),
  tracks: z.array(AudioTrackSchema)
});

export const AdVideoSchema = z.object({
  brandName: z.string(),
  productName: z.string(),
  tagline: z.string(),
  platform: z.enum([
    "vertical-9x16",
    "square-1x1",
    "landscape-16x9",
    "instagram-reel",
    "meta-square",
    "tiktok",
    "youtube-landscape",
    "youtube-shorts"
  ]),
  durationSeconds: z.number().positive(),
  primaryColor: z.string(),
  backgroundColor: z.string(),
  fontPreset: FontPresetSchema.optional(),
  finish: FinishSchema.optional(),
  logoPath: z.string().optional(),
  heroImagePath: z.string().optional(),
  cta: z.string(),
  offer: z.string().optional(),
  disclaimer: z.string().optional(),
  audio: AudioSpecSchema.optional(),
  captions: z.array(CaptionSchema).optional(),
  scenes: z.array(SceneSchema).min(1)
});

export type AdVideoProps = z.infer<typeof AdVideoSchema>;
