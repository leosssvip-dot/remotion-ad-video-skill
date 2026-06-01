#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputArg = process.argv[2] || "dist/open-source-snapshot";
const outputDir = resolve(root, outputArg);
const lockDir = `${outputDir}.lock`;

const allowlist = [
  ".gitignore",
  "AGENTS.md",
  "LICENSE",
  "README.md",
  "README.zh-CN.md",
  "docs/DEVELOPMENT_PLAN.md",
  "examples/synthetic-url-ad",
  "package.json",
  "scripts/classify-ad-source.mjs",
  "scripts/create-open-source-snapshot.mjs",
  "scripts/fast-ad-lab.mjs",
  "scripts/harvest-ecommerce-assets.mjs",
  "scripts/validate-creative.mjs",
  "scripts/validate-skill.mjs",
  "skills/remotion-ad-video",
];

const deniedSegments = new Set([
  ".cache",
  ".git",
  ".remotion",
  "node_modules",
  "out",
]);

const deniedFiles = new Set([
  ".DS_Store",
]);

const denyPatterns = [
  /\.env($|\.)/,
  /\.(mp4|mov|webm|png|jpe?g|webp|gif|wav|mp3|m4a)$/i,
];

const shouldCopy = (source) => {
  const rel = relative(root, source);
  const parts = rel.split("/");
  if (parts.some((part) => deniedSegments.has(part))) {
    return false;
  }
  if (deniedFiles.has(parts.at(-1))) {
    return false;
  }
  return !denyPatterns.some((pattern) => pattern.test(rel));
};

const copySafe = (relativePath) => {
  const source = join(root, relativePath);
  if (!existsSync(source)) {
    return;
  }
  const target = join(outputDir, relativePath);
  const stats = statSync(source);
  if (stats.isDirectory()) {
    cpSync(source, target, {
      recursive: true,
      filter: shouldCopy,
    });
  } else if (shouldCopy(source)) {
    mkdirSync(dirname(target), { recursive: true });
    cpSync(source, target);
  }
};

if (existsSync(lockDir)) {
  console.error(`Snapshot lock exists: ${relative(root, lockDir)}`);
  console.error("Another snapshot may be running. Remove the lock only if no snapshot process is active.");
  process.exit(1);
}

mkdirSync(dirname(outputDir), { recursive: true });
mkdirSync(lockDir, { recursive: false });
process.on("exit", () => {
  rmSync(lockDir, { force: true, recursive: true });
});

rmSync(outputDir, { force: true, recursive: true });
mkdirSync(outputDir, { recursive: true });

for (const relativePath of allowlist) {
  copySafe(relativePath);
}

const manifest = {
  generatedAt: new Date().toISOString(),
  sourceRoot: ".",
  outputDir: relative(root, outputDir),
  included: allowlist,
  excludedByPolicy: [
    ".remotion/",
    "docs/PROGRESS.md",
    "docs/tasks/",
    "examples except reviewed synthetic fixtures",
    "node_modules/",
    "out/",
    "public harvested/generated media",
    "env files",
    "audio/video/image render outputs",
  ],
};

writeFileSync(join(outputDir, "OPEN_SOURCE_SNAPSHOT.json"), `${JSON.stringify(manifest, null, 2)}\n`);

const files = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else {
      files.push(relative(outputDir, fullPath));
    }
  }
};
walk(outputDir);

console.log(`Created sanitized open-source snapshot at ${relative(root, outputDir)}`);
console.log(`Files: ${files.length}`);
