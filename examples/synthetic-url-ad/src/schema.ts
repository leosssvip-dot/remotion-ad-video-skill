import { z } from "zod";

export const SceneSchema = z.object({
  id: z.string(),
  startSecond: z.number().min(0),
  durationSecond: z.number().positive(),
  eyebrow: z.string().optional(),
  headline: z.string(),
  body: z.string().optional(),
  visual: z.string(),
  proof: z.string().optional()
});

export const AdVideoSchema = z.object({
  brandName: z.string(),
  productName: z.string(),
  tagline: z.string(),
  platform: z.enum(["vertical-9x16", "square-1x1", "landscape-16x9"]),
  durationSeconds: z.number().positive(),
  primaryColor: z.string(),
  backgroundColor: z.string(),
  cta: z.string(),
  offer: z.string().optional(),
  disclaimer: z.string().optional(),
  scenes: z.array(SceneSchema).min(1)
});

export type AdVideoProps = z.infer<typeof AdVideoSchema>;
