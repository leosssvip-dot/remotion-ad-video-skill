import { z } from "zod";

export const SceneMetricSchema = z.object({
  label: z.string().optional(),
  from: z.number().optional(),
  to: z.number(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  decimals: z.number().int().min(0).max(2).optional()
});

export const SceneSchema = z.object({
  id: z.string(),
  startSecond: z.number().min(0),
  durationSecond: z.number().positive(),
  eyebrow: z.string().optional(),
  headline: z.string(),
  body: z.string().optional(),
  visual: z.string(),
  proof: z.string().optional(),
  metric: SceneMetricSchema.optional(),
  imagePath: z.string().optional(),
  imageUrl: z.string().url().optional()
});

export const AudioTrackSchema = z.object({
  id: z.string(),
  src: z.string(),
  startSecond: z.number().min(0).optional(),
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
  logoPath: z.string().optional(),
  heroImagePath: z.string().optional(),
  cta: z.string(),
  offer: z.string().optional(),
  disclaimer: z.string().optional(),
  audio: AudioSpecSchema.optional(),
  scenes: z.array(SceneSchema).min(1)
});

export type AdVideoProps = z.infer<typeof AdVideoSchema>;
