import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadArchivoBlack } from "@remotion/google-fonts/ArchivoBlack";
import { loadFont as loadBaloo2 } from "@remotion/google-fonts/Baloo2";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import type { z } from "zod";
import type { FontPresetSchema } from "./schema";

/**
 * Font presets — typography direction per ad, declared via `props.fontPreset`.
 *
 * A single display face is the largest "this was designed" signal an ad can
 * send; the body face stays a clean sans for mobile readability. The default
 * "clean-sans" uses the system Inter stack and needs no network; every other
 * preset loads its display face through @remotion/google-fonts when the first
 * scene renders (each render worker loads once; the browser HTTP cache is
 * shared, so usually only the first worker hits the network). Offline renders
 * MUST use clean-sans — a failed font fetch aborts the render, by design.
 */

export type FontPreset = z.infer<typeof FontPresetSchema>;

const SANS_STACK =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

type FontStacks = { display: string; body: string };

// Only the upright latin subset is loaded — the template uses each face as a
// single display style, and a bare loadFont() would pull every
// style×weight×subset variant (dozens of requests for nothing).
const PRESETS: Record<FontPreset, { load?: () => { fontFamily: string }; bodyStack?: string }> = {
  "clean-sans": {},
  // poster-grade ultra-bold geometric — hooks, slams, big claims
  "bold-geometric": { load: () => loadArchivoBlack("normal", { subsets: ["latin"] }) },
  // tall condensed impact face — sports/deal/urgency energy
  "condensed-impact": { load: () => loadAnton("normal", { subsets: ["latin"] }) },
  // high-contrast serif — premium, editorial, beauty/fashion
  "editorial-serif": { load: () => loadPlayfair("normal", { subsets: ["latin"] }) },
  // rounded friendly display — casual games, family, food
  "rounded-friendly": { load: () => loadBaloo2("normal", { subsets: ["latin"] }) },
  // techy grotesk — dev tools, SaaS, AI products
  "mono-tech": { load: () => loadSpaceGrotesk("normal", { subsets: ["latin"] }) },
};

const resolved = new Map<FontPreset, FontStacks>();

export const getFontStacks = (preset: FontPreset = "clean-sans"): FontStacks => {
  const cached = resolved.get(preset);
  if (cached) {
    return cached;
  }
  const def = PRESETS[preset];
  const display = def.load ? `"${def.load().fontFamily}", ${SANS_STACK}` : SANS_STACK;
  const stacks: FontStacks = { display, body: def.bodyStack ?? SANS_STACK };
  resolved.set(preset, stacks);
  return stacks;
};
