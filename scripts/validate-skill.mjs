import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const skillDir = join(root, "skills", "remotion-ad-video");
const requiredFiles = [
  "SKILL.md",
  "agents/openai.yaml",
  "references/ad-brief-contract.md",
  "references/ad-intake.md",
  "references/ad-aesthetic-qa.md",
  "references/audio-caption-system.md",
  "references/asset-harvest.md",
  "references/creative-direction.md",
  "references/game-ad-patterns.md",
  "references/fast-test-workflow.md",
  "references/industry-angle-library.md",
  "references/platform-presets.md",
  "references/preflight-questionnaire.md",
  "references/social-feed-ad-patterns.md",
  "references/storyboard-contract.md",
  "references/variant-system.md",
  "references/render-qa-checklist.md",
  "scripts/build_asset_manifest.mjs",
  "assets/remotion-template/README.md",
  "assets/remotion-template/package.json",
  "assets/remotion-template/src/Root.tsx",
  "assets/remotion-template/src/AdVideo.tsx",
  "assets/remotion-template/src/schema.ts",
  "assets/remotion-template/src/default-props.json",
];
const requiredRootFiles = [
  "LICENSE",
  "README.zh-CN.md",
  "package.json",
  "scripts/classify-ad-source.mjs",
  "scripts/create-open-source-snapshot.mjs",
  "scripts/fast-ad-lab.mjs",
  "scripts/harvest-ecommerce-assets.mjs",
  "examples/synthetic-url-ad/ad-brief.json",
  "examples/synthetic-url-ad/src/AdVideo.tsx"
];

const fail = (message) => {
  console.error(`FAIL ${message}`);
  process.exitCode = 1;
};

const read = (relativePath) =>
  readFileSync(join(skillDir, relativePath), "utf8");
const readRoot = (relativePath) =>
  readFileSync(join(root, relativePath), "utf8");

for (const file of requiredFiles) {
  try {
    const target = join(skillDir, file);
    if (!statSync(target).isFile()) {
      fail(`missing file: ${file}`);
    }
  } catch {
    fail(`missing file: ${file}`);
  }
}
for (const file of requiredRootFiles) {
  try {
    const target = join(root, file);
    if (!statSync(target).isFile()) {
      fail(`missing file: ${file}`);
    }
  } catch {
    fail(`missing file: ${file}`);
  }
}

if (process.exitCode) {
  process.exit();
}

const skillMd = read("SKILL.md");
if (!skillMd.startsWith("---\nname: remotion-ad-video\n")) {
  fail("SKILL.md frontmatter name must be remotion-ad-video");
}
if (!/description: Use when /m.test(skillMd)) {
  fail("SKILL.md description must start with Use when");
}
for (const phrase of [
  "Intake",
  "Strategy",
  "Storyboard",
  "Template",
  "Render QA",
  "asset",
  "thumb-stopping",
  "gameplay",
  "15s",
  "variant",
  "Advertising-aesthetic QA",
  "fast-test-workflow",
  "preflight-questionnaire",
  "platform-presets",
  "rights",
  "Remotion license",
  "ad-brief-contract",
  "ad-brief.json",
  "classify-ad-source.mjs",
]) {
  if (!skillMd.includes(phrase)) {
    fail(`SKILL.md missing core phrase: ${phrase}`);
  }
}

const openaiYaml = read("agents/openai.yaml");
if (!openaiYaml.includes("default_prompt:")) {
  fail("openai.yaml missing default_prompt");
}
if (!openaiYaml.includes("$remotion-ad-video")) {
  fail("openai.yaml default prompt must mention $remotion-ad-video");
}
const shortDescriptionMatch = openaiYaml.match(/short_description: "([^"]+)"/);
if (!shortDescriptionMatch) {
  fail("openai.yaml missing quoted short_description");
} else {
  const length = shortDescriptionMatch[1].length;
  if (length < 25 || length > 64) {
    fail(`short_description length ${length} must be 25-64 chars`);
  }
}

const packageJson = JSON.parse(read("assets/remotion-template/package.json"));
for (const dependency of ["@remotion/cli", "remotion", "react", "react-dom", "zod"]) {
  if (!packageJson.dependencies?.[dependency] && !packageJson.devDependencies?.[dependency]) {
    fail(`template package.json missing dependency: ${dependency}`);
  }
}

const rootPackageJson = JSON.parse(readRoot("package.json"));
if (rootPackageJson.name !== "remotion-ad-video-skill") {
  fail("root package.json name must be remotion-ad-video-skill");
}
for (const scriptName of ["check", "validate", "snapshot", "smoke:classifier"]) {
  if (!rootPackageJson.scripts?.[scriptName]) {
    fail(`root package.json missing script: ${scriptName}`);
  }
}

const rootReadme = readRoot("README.md");
for (const phrase of [
  "remotion-ad-video-skill",
  "README.zh-CN.md",
  "No video-generation AI required",
  "agent-agnostic",
  "Agent Compatibility",
  "URL to Remotion ad video",
  "Use the remotion-ad-video skill",
  "Synthetic URL Demo",
  "Maintainer Checks",
  "Maintainer Release Checklist",
  "npm run validate",
  "npm run snapshot"
]) {
  if (!rootReadme.includes(phrase)) {
    fail(`README.md missing phrase: ${phrase}`);
  }
}

const chineseReadme = readRoot("README.zh-CN.md");
for (const phrase of [
  "remotion-ad-video-skill",
  "不需要接入视频生成 AI",
  "通用的 agent skill",
  "URL -> 来源分类 -> ad-brief.json",
  "调用 remotion-ad-video skill",
  "合成 URL Demo",
  "维护者校验和发布",
  "维护者发布清单",
  "npm run validate",
  "npm run snapshot"
]) {
  if (!chineseReadme.includes(phrase)) {
    fail(`README.zh-CN.md missing phrase: ${phrase}`);
  }
}

const license = readRoot("LICENSE");
if (!license.includes("MIT License")) {
  fail("LICENSE must include MIT License");
}

const syntheticBrief = JSON.parse(readRoot("examples/synthetic-url-ad/ad-brief.json"));
if (syntheticBrief.sourceUrl !== "https://example.com/products/focus-lamp") {
  fail("synthetic demo brief must use the fake example.com URL");
}
if (syntheticBrief.assetPlan?.rightsStatus !== "synthetic_demo") {
  fail("synthetic demo must mark rightsStatus as synthetic_demo");
}

const templateProps = JSON.parse(read("assets/remotion-template/src/default-props.json"));
if (templateProps.durationSeconds !== 15) {
  fail("template default durationSeconds must be 15");
}

const gamePatterns = read("references/game-ad-patterns.md");
for (const phrase of ["Default duration is 15s", "Shot cuts are allowed", "mini slide deck", "kinetic shot"]) {
  if (!gamePatterns.includes(phrase)) {
    fail(`game-ad-patterns.md missing phrase: ${phrase}`);
  }
}

const variantSystem = read("references/variant-system.md");
for (const phrase of ["Default Variant Set", "Hook Shock", "Scoring", "claimSafety"]) {
  if (!variantSystem.includes(phrase)) {
    fail(`variant-system.md missing phrase: ${phrase}`);
  }
}

const aestheticQa = read("references/ad-aesthetic-qa.md");
for (const phrase of ["firstTwoSeconds", "adNotSlides", "categoryNative", "Revision Moves"]) {
  if (!aestheticQa.includes(phrase)) {
    fail(`ad-aesthetic-qa.md missing phrase: ${phrase}`);
  }
}

const assetHarvest = read("references/asset-harvest.md");
if (!assetHarvest.includes("build_asset_manifest.mjs")) {
  fail("asset-harvest.md must mention build_asset_manifest.mjs");
}
for (const phrase of [
  "harvest-ecommerce-assets.mjs",
  "Product main image",
  "Search engines are last-resort",
  "blocked: true",
  "Do not make a fake product ad"
]) {
  if (!assetHarvest.includes(phrase)) {
    fail(`asset-harvest.md missing phrase: ${phrase}`);
  }
}

const preflight = read("references/preflight-questionnaire.md");
for (const phrase of [
  "link-adapted questions",
  "Preflight defaults",
  "4-6 questions",
  "Creative route",
  "If harvesting is blocked",
  "vertical, square, or landscape",
  "synced SFX"
]) {
  if (!preflight.includes(phrase)) {
    fail(`preflight-questionnaire.md missing phrase: ${phrase}`);
  }
}

const briefContract = read("references/ad-brief-contract.md");
for (const phrase of [
  "ad-brief.json",
  "Required Fields",
  "sourceType",
  "ecommerce_product",
  "mobile_game",
  "assetPlan.status",
  "user_required",
  "blockers",
  "Storyboard Traceability"
]) {
  if (!briefContract.includes(phrase)) {
    fail(`ad-brief-contract.md missing phrase: ${phrase}`);
  }
}

const platformPresets = read("references/platform-presets.md");
for (const phrase of ["vertical-9x16", "square-1x1", "landscape-16x9", "1080 x 1920", "Draft Output Sizes", "540 x 960"]) {
  if (!platformPresets.includes(phrase)) {
    fail(`platform-presets.md missing phrase: ${phrase}`);
  }
}

const audioSystem = read("references/audio-caption-system.md");
for (const phrase of ["Sync Discipline", "cue sheet", "visible event", "Implementation Contract", "audio.enabled", "rightsStatus", "volumedetect"]) {
  if (!audioSystem.includes(phrase)) {
    fail(`audio-caption-system.md missing phrase: ${phrase}`);
  }
}

const fastWorkflow = read("references/fast-test-workflow.md");
for (const phrase of [
  "fast-ad-lab.mjs",
  "Blocking vs Non-Blocking",
  "Do not rerender full-size MP4",
  "Do not render full-size MP4 before low-resolution stills and draft video pass",
  "preview",
  "half-size draft MP4",
  "Time Budget"
]) {
  if (!fastWorkflow.includes(phrase)) {
    fail(`fast-test-workflow.md missing phrase: ${phrase}`);
  }
}

const manifestScript = read("scripts/build_asset_manifest.mjs");
for (const phrase of ["rightsStatus", "needs_verification", "suggestedUse", "dimensionsFor"]) {
  if (!manifestScript.includes(phrase)) {
    fail(`build_asset_manifest.mjs missing phrase: ${phrase}`);
  }
}

const fastLabScript = readRoot("scripts/fast-ad-lab.mjs");
for (const phrase of [
  "prepare",
  "stage",
  "stills",
  "preview",
  "render",
  "final",
  "--scale",
  "--crf",
  "0.5",
  "renderFrames",
  "selectComposition",
  "Bundling Remotion once"
]) {
  if (!fastLabScript.includes(phrase)) {
    fail(`fast-ad-lab.mjs missing phrase: ${phrase}`);
  }
}

const classifierScript = readRoot("scripts/classify-ad-source.mjs");
for (const phrase of [
  "sourceType",
  "ecommerce_product",
  "mobile_game",
  "social_content_app",
  "saas_api",
  "brief-out",
  "preflightQuestions",
  "assetPlan",
]) {
  if (!classifierScript.includes(phrase)) {
    fail(`classify-ad-source.mjs missing phrase: ${phrase}`);
  }
}

const ecommerceHarvestScript = readRoot("scripts/harvest-ecommerce-assets.mjs");
for (const phrase of ["blocked", "Main image: not harvested", "expected-title", "product-token-match", "Search engines"]) {
  if (!ecommerceHarvestScript.includes(phrase)) {
    fail(`harvest-ecommerce-assets.mjs missing phrase: ${phrase}`);
  }
}

const sourceFiles = readdirSync(join(skillDir, "assets/remotion-template/src"))
  .filter((file) => file.endsWith(".tsx") || file.endsWith(".ts"))
  .map((file) => read(`assets/remotion-template/src/${file}`))
  .join("\n");
for (const phrase of [
  "Composition",
  "Sequence",
  "AbsoluteFill",
  "Audio",
  "z.object",
  "vertical-9x16",
  "square-1x1",
  "landscape-16x9",
  "rightsStatus",
  "platform",
  "cta",
]) {
  if (!sourceFiles.includes(phrase)) {
    fail(`template source missing phrase: ${phrase}`);
  }
}

if (!process.exitCode) {
  console.log("PASS remotion-ad-video skill structure validated");
}
