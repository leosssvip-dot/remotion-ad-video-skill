#!/usr/bin/env node
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, relative, resolve } from "node:path";

const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);

const usage = () => {
  console.error(
    "Usage: node build_asset_manifest.mjs <asset-dir> [--brand Brand] [--source URL] [--out manifest.json]"
  );
  process.exit(1);
};

const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  usage();
}

const assetDir = resolve(args[0]);
let brand = basename(assetDir);
let sourceUrl = "";
let outPath = "";

for (let index = 1; index < args.length; index += 1) {
  const arg = args[index];
  const next = args[index + 1];
  if (arg === "--brand" && next) {
    brand = next;
    index += 1;
  } else if (arg === "--source" && next) {
    sourceUrl = next;
    index += 1;
  } else if (arg === "--out" && next) {
    outPath = resolve(next);
    index += 1;
  } else {
    usage();
  }
}

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(path);
    }
    return [path];
  });

const pngDimensions = (buffer) => {
  const isPng =
    buffer.length > 24 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;
  if (!isPng) {
    return null;
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
};

const jpegDimensions = (buffer) => {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    const size = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        width: buffer.readUInt16BE(offset + 7),
        height: buffer.readUInt16BE(offset + 5)
      };
    }
    offset += 2 + size;
  }
  return null;
};

const webpDimensions = (buffer) => {
  if (buffer.length < 30 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
    return null;
  }
  const chunk = buffer.toString("ascii", 12, 16);
  if (chunk === "VP8X" && buffer.length >= 30) {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3)
    };
  }
  if (chunk === "VP8 " && buffer.length >= 30) {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff
    };
  }
  if (chunk === "VP8L" && buffer.length >= 25) {
    const bits = buffer.readUInt32LE(21);
    return {
      width: 1 + (bits & 0x3fff),
      height: 1 + ((bits >> 14) & 0x3fff)
    };
  }
  return null;
};

const svgDimensions = (text) => {
  const width = text.match(/\bwidth=["']?([0-9.]+)/i)?.[1];
  const height = text.match(/\bheight=["']?([0-9.]+)/i)?.[1];
  if (width && height) {
    return { width: Number(width), height: Number(height) };
  }
  const viewBox = text.match(/\bviewBox=["']?[-0-9.]+\s+[-0-9.]+\s+([0-9.]+)\s+([0-9.]+)/i);
  if (viewBox) {
    return { width: Number(viewBox[1]), height: Number(viewBox[2]) };
  }
  return null;
};

const dimensionsFor = (file) => {
  const ext = extname(file).toLowerCase();
  const buffer = readFileSync(file);
  if (ext === ".png") {
    return pngDimensions(buffer);
  }
  if (ext === ".jpg" || ext === ".jpeg") {
    return jpegDimensions(buffer);
  }
  if (ext === ".webp") {
    return webpDimensions(buffer);
  }
  if (ext === ".svg") {
    return svgDimensions(buffer.toString("utf8"));
  }
  return null;
};

const classify = (file) => {
  const name = basename(file).toLowerCase();
  if (/favicon|touch|icon|logo/.test(name)) {
    return "logo_or_icon";
  }
  if (/screen|screenshot/.test(name)) {
    return "screenshot";
  }
  if (/feature|hero|og|banner|cover/.test(name)) {
    return "hero_or_feature";
  }
  return "supporting_visual";
};

const suggestedUse = (type) => {
  if (type === "logo_or_icon") {
    return ["header", "hook", "cta"];
  }
  if (type === "screenshot") {
    return ["phone_frame", "demo", "proof"];
  }
  if (type === "hero_or_feature") {
    return ["background", "mid_video_payoff", "cta_context"];
  }
  return ["background", "texture", "supporting_cut"];
};

let files = [];
try {
  files = walk(assetDir).filter((file) => imageExtensions.has(extname(file).toLowerCase()));
} catch (error) {
  console.error(`Could not read asset dir: ${assetDir}`);
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const assets = files
  .map((file) => {
    const relativePath = relative(assetDir, file);
    const type = classify(file);
    const dimensions = dimensionsFor(file);
    const sizeBytes = statSync(file).size;
    const warnings = [];
    if (!dimensions) {
      warnings.push("dimensions_unknown");
    } else if (dimensions.width < 128 || dimensions.height < 128) {
      warnings.push("low_resolution");
    }
    return {
      file: relativePath,
      type,
      dimensions,
      sizeBytes,
      rightsStatus: "needs_verification",
      sourceUrl: sourceUrl || null,
      suggestedUse: suggestedUse(type),
      warnings
    };
  })
  .sort((a, b) => a.file.localeCompare(b.file));

const manifest = {
  brand,
  sourceUrl: sourceUrl || null,
  assetRoot: assetDir,
  generatedAt: new Date().toISOString(),
  rightsDefault: "needs_verification",
  assets
};

const output = `${JSON.stringify(manifest, null, 2)}\n`;
if (outPath) {
  writeFileSync(outPath, output, "utf8");
} else {
  process.stdout.write(output);
}
