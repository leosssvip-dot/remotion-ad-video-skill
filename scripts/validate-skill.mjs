import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
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

const runChecked = (label, command, args, options = {}) => {
  try {
    execFileSync(command, args, { stdio: "pipe", ...options });
    return true;
  } catch (error) {
    const output = [
      error.stdout?.toString?.(),
      error.stderr?.toString?.(),
      error.message,
    ].filter(Boolean).join("\n").trim();
    fail(`${label} failed${output ? `:\n${output}` : ""}`);
    return false;
  }
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
if (skillMd.includes("Ask 4-6 link-adapted creative questions")) {
  fail("SKILL.md must not contain old 4-6 preflight question wording");
}
if (skillMd.includes("- Audio mode: silent-safe")) {
  fail("SKILL.md must not list audio mode as a required user decision");
}
if (!skillMd.includes("Ask exactly two required preflight choices first")) {
  fail("SKILL.md must state the two-choice preflight rule");
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
  "https://github.com/remotion-dev/remotion",
  "https://github.com/user-attachments/assets/5dbe2ade-fe7f-419f-8349-d73045320cd2",
  "https://github.com/user-attachments/assets/8e3605dc-f776-4f62-b763-f618f6d7f8d8",
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
  "https://github.com/remotion-dev/remotion",
  "https://github.com/user-attachments/assets/5dbe2ade-fe7f-419f-8349-d73045320cd2",
  "https://github.com/user-attachments/assets/8e3605dc-f776-4f62-b763-f618f6d7f8d8",
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
if (syntheticBrief.audioMode !== "sfx-only") {
  fail("synthetic demo brief must use audioMode=sfx-only");
}

const adIntake = read("references/ad-intake.md");
if (adIntake.includes("- `audio_mode`: Silent-safe")) {
  fail("ad-intake.md must not list audio_mode as a required input");
}
if (!adIntake.includes("Recorded default") || !adIntake.includes("default `sfx-only`")) {
  fail("ad-intake.md must document audio_mode as a recorded default");
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
for (const phrase of ["firstTwoSeconds", "adNotSlides", "categoryNative", "layoutShock", "textDensity", "poster-scale", "Revision Moves"]) {
  if (!aestheticQa.includes(phrase)) {
    fail(`ad-aesthetic-qa.md missing phrase: ${phrase}`);
  }
}

const creativeDirection = read("references/creative-direction.md");
for (const phrase of ["Layout Shock", "poster-scale type", "maximum two text groups", "one dominant visual", "Thumb-Stopping Layouts"]) {
  if (!creativeDirection.includes(phrase)) {
    fail(`creative-direction.md missing phrase: ${phrase}`);
  }
}

const storyboardContract = read("references/storyboard-contract.md");
for (const phrase of ["layoutMode", "textBudget", "maximum two text groups", "one dominant visual"]) {
  if (!storyboardContract.includes(phrase)) {
    fail(`storyboard-contract.md missing phrase: ${phrase}`);
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
  "exactly two required choices",
  "creative route",
  "structured choice",
  "text fallback",
  "interactionLanguage",
  "sourceLanguage",
  "outputLanguage",
  "选项",
  "Do not ask the old 1-6 questionnaire",
  "If harvesting is blocked",
  "vertical, square, or landscape",
  "Audio defaults to synced SFX"
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
  "interactionLanguage",
  "sourceLanguage",
  "outputLanguage",
  "languagePlan",
  "interactionPlan",
  "choiceQuestions",
  "user_required",
  "blockers",
  "preflight_answers_required",
  "\"id\": \"creativeRoute\"",
  "creativeRoute: 选择这个电商商品广告的主要创意路线",
  "--creative-route",
  "--interaction-language",
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
for (const phrase of ["Sync Discipline", "cue sheet", "visible event", "Implementation Contract", "audio.enabled", "rightsStatus", "Audio is a default implementation detail", "Optional Audio Review"]) {
  if (!audioSystem.includes(phrase)) {
    fail(`audio-caption-system.md missing phrase: ${phrase}`);
  }
}

const templateDefaultProps = JSON.parse(read("assets/remotion-template/src/default-props.json"));
if (templateDefaultProps.audio?.mode !== "sfx-only") {
  fail("template default audio.mode must be sfx-only");
}
if (templateDefaultProps.audio?.enabled !== true) {
  fail("template default audio.enabled must be true");
}
if (!Array.isArray(templateDefaultProps.audio?.tracks) || templateDefaultProps.audio.tracks.length < 1) {
  fail("template default audio.tracks must include generated SFX");
}
for (const track of templateDefaultProps.audio.tracks) {
  if (track.rightsStatus !== "generated") {
    fail(`template default audio track ${track.id} must use generated rightsStatus`);
  }
}

const syntheticDefaultProps = JSON.parse(readRoot("examples/synthetic-url-ad/src/default-props.json"));
if (syntheticDefaultProps.audio?.mode !== "sfx-only") {
  fail("synthetic demo default props must use audio.mode=sfx-only");
}
if (syntheticDefaultProps.audio?.enabled !== true) {
  fail("synthetic demo default props must keep audio.enabled=true");
}
if (!Array.isArray(syntheticDefaultProps.audio?.tracks) || syntheticDefaultProps.audio.tracks.length < 1) {
  fail("synthetic demo default props must include generated SFX");
}
for (const track of syntheticDefaultProps.audio.tracks) {
  if (track.rightsStatus !== "generated") {
    fail(`synthetic demo audio track ${track.id} must use generated rightsStatus`);
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
  "interaction-language",
  "source-language",
  "output-language",
  "interactionLanguage",
  "sourceLanguage",
  "outputLanguage",
  "detectLanguage",
  "preflightQuestions",
  "interactionPlan",
  "choiceQuestions",
  "requiredChoiceQuestionIds",
  "textFallbackQuestionsFor",
  "creativeRouteFor",
  "creative-route",
  "assetPlan",
]) {
  if (!classifierScript.includes(phrase)) {
    fail(`classify-ad-source.mjs missing phrase: ${phrase}`);
  }
}

const classifierBriefPath = join(tmpdir(), `remotion-ad-validate-${Date.now()}.json`);
try {
  execFileSync(process.execPath, [
    join(root, "scripts", "classify-ad-source.mjs"),
    "https://play.google.com/store/apps/details?id=com.zhiliaoapp.musically",
    "--brief-out",
    classifierBriefPath,
  ], { stdio: "pipe" });
  const classifierBrief = JSON.parse(readFileSync(classifierBriefPath, "utf8"));
  const unanswered = classifierBrief.unansweredQuestions ?? [];
  if (classifierBrief.blockers?.[0] !== "preflight_answers_required") {
    fail("classifier brief must block on preflight_answers_required by default");
  }
  if (unanswered.length !== 2) {
    fail(`classifier brief unansweredQuestions length ${unanswered.length} must be 2`);
  }
  for (const id of ["format", "creativeRoute"]) {
    if (!unanswered.some((question) => question.startsWith(`${id}:`))) {
      fail(`classifier brief unansweredQuestions missing ${id}`);
    }
  }
  if (unanswered.some((question) => question.startsWith("audioMode:"))) {
    fail("classifier brief must not require audioMode by default");
  }
  if (unanswered.join("\n").includes("Proof and claims")) {
    fail("classifier brief must not put legacy proof question in unansweredQuestions");
  }
  if ((classifierBrief.interactionPlan?.choiceQuestions ?? []).length !== 2) {
    fail("classifier brief interactionPlan.choiceQuestions must contain 2 questions");
  }
  if ((classifierBrief.interactionPlan?.requiredChoiceQuestionIds ?? []).includes("audioMode")) {
    fail("classifier brief requiredChoiceQuestionIds must not contain audioMode by default");
  }
  if (classifierBrief.audioMode !== "sfx-only") {
    fail("classifier brief audioMode must still default to sfx-only");
  }
  if (!classifierBrief.interactionLanguage || !classifierBrief.sourceLanguage || !classifierBrief.outputLanguage) {
    fail("classifier brief must include interactionLanguage, sourceLanguage, and outputLanguage");
  }
} finally {
  rmSync(classifierBriefPath, { force: true });
}

const zhInteractionBriefPath = join(tmpdir(), `remotion-ad-zh-interaction-${Date.now()}.json`);
try {
  execFileSync(process.execPath, [
    join(root, "scripts", "classify-ad-source.mjs"),
    "https://play.google.com/store/apps/details?id=com.anthropic.claude",
    "--title",
    "Claude by Anthropic",
    "--description",
    "AI assistant for writing, coding, and reasoning.",
    "--interaction-language",
    "zh-CN",
    "--brief-out",
    zhInteractionBriefPath,
  ], { stdio: "pipe" });
  const zhBrief = JSON.parse(readFileSync(zhInteractionBriefPath, "utf8"));
  const unanswered = zhBrief.unansweredQuestions ?? [];
  if (zhBrief.interactionLanguage !== "zh-CN") {
    fail(`zh interaction brief interactionLanguage ${zhBrief.interactionLanguage} must be zh-CN`);
  }
  if (zhBrief.sourceLanguage !== "en" || zhBrief.outputLanguage !== "en") {
    fail(`zh interaction brief source/output ${zhBrief.sourceLanguage}/${zhBrief.outputLanguage} must stay en for English source`);
  }
  if (!unanswered.some((question) => question.includes("选择输出尺寸"))) {
    fail("zh interaction brief must ask format in Chinese");
  }
  if (!unanswered.some((question) => question.includes("应用演示=app demo"))) {
    fail("zh interaction brief must localize creative route labels while preserving values");
  }
  if (unanswered.join("\n").includes("Choose the output size")) {
    fail("zh interaction brief must not ask required preflight questions in English");
  }
  if (zhBrief.interactionPlan?.language !== "zh-CN") {
    fail("zh interaction brief interactionPlan.language must be zh-CN");
  }
} finally {
  rmSync(zhInteractionBriefPath, { force: true });
}

const zhSourceBriefPath = join(tmpdir(), `remotion-ad-zh-source-${Date.now()}.json`);
try {
  execFileSync(process.execPath, [
    join(root, "scripts", "classify-ad-source.mjs"),
    "https://play.google.com/store/apps/details?id=com.example.doubao",
    "--title",
    "豆包 - AI助手",
    "--description",
    "智能聊天、写作和办公效率工具。",
    "--interaction-language",
    "en",
    "--brief-out",
    zhSourceBriefPath,
  ], { stdio: "pipe" });
  const zhSourceBrief = JSON.parse(readFileSync(zhSourceBriefPath, "utf8"));
  if (zhSourceBrief.sourceLanguage !== "zh-CN") {
    fail(`Chinese source brief sourceLanguage ${zhSourceBrief.sourceLanguage} must be zh-CN`);
  }
  if (zhSourceBrief.outputLanguage !== "zh-CN") {
    fail(`Chinese source brief outputLanguage ${zhSourceBrief.outputLanguage} must default to zh-CN`);
  }
  if (zhSourceBrief.cta !== "获取应用") {
    fail(`Chinese source brief CTA ${zhSourceBrief.cta} must be localized for video output`);
  }
} finally {
  rmSync(zhSourceBriefPath, { force: true });
}

const answeredBriefPath = join(tmpdir(), `remotion-ad-answered-${Date.now()}.json`);
try {
  execFileSync(process.execPath, [
    join(root, "scripts", "classify-ad-source.mjs"),
    "https://play.google.com/store/apps/details?id=com.roblox.client",
    "--format",
    "square",
    "--creative-route",
    "fail-rescue",
    "--preflight-mode",
    "answered",
    "--brief-out",
    answeredBriefPath,
  ], { stdio: "pipe" });
  const answeredBrief = JSON.parse(readFileSync(answeredBriefPath, "utf8"));
  if (answeredBrief.status !== "answered") {
    fail(`answered classifier brief status ${answeredBrief.status} must be answered`);
  }
  if (answeredBrief.creativeRoute !== "fail-rescue") {
    fail(`answered classifier brief creativeRoute ${answeredBrief.creativeRoute} must use selected route`);
  }
  if (answeredBrief.format?.preset !== "square-1x1") {
    fail(`answered classifier brief format ${answeredBrief.format?.preset} must use selected format`);
  }
  if ((answeredBrief.unansweredQuestions ?? []).length !== 0) {
    fail("answered classifier brief must not keep unansweredQuestions");
  }
  if ((answeredBrief.blockers ?? []).length !== 0) {
    fail("answered classifier brief must not keep blockers");
  }
} finally {
  rmSync(answeredBriefPath, { force: true });
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
  "imagePath",
  "scene.imagePath",
  "props.logoPath",
  "props.heroImagePath",
  "assetSrc",
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

if (process.argv.includes("--template-runtime")) {
  const templateSmokeDir = mkdtempSync(join(tmpdir(), "remotion-ad-template-smoke-"));
  try {
    cpSync(join(skillDir, "assets", "remotion-template"), templateSmokeDir, { recursive: true });
    mkdirSync(join(templateSmokeDir, "public", "acme"), { recursive: true });
    writeFileSync(
      join(templateSmokeDir, "public", "acme", "logo.svg"),
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" rx="12" fill="#7CFF6B"/><text x="40" y="50" text-anchor="middle" font-family="Arial" font-size="28" font-weight="700" fill="#151515">A</text></svg>\n`
    );
    writeFileSync(
      join(templateSmokeDir, "public", "acme", "hero.svg"),
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080"><rect width="1080" height="1080" fill="#151515"/><circle cx="540" cy="540" r="280" fill="#7CFF6B"/><text x="540" y="575" text-anchor="middle" font-family="Arial" font-size="92" font-weight="700" fill="#151515">Local Asset</text></svg>\n`
    );
    const smokePropsPath = join(templateSmokeDir, "src", "default-props.json");
    const smokeProps = JSON.parse(readFileSync(smokePropsPath, "utf8"));
    smokeProps.logoPath = "acme/logo.svg";
    smokeProps.heroImagePath = "acme/hero.svg";
    smokeProps.scenes[0].imagePath = "acme/hero.svg";
    writeFileSync(smokePropsPath, `${JSON.stringify(smokeProps, null, 2)}\n`);

    const installed = runChecked(
      "template npm install",
      "npm",
      ["install", "--ignore-scripts", "--no-audit", "--no-fund"],
      { cwd: templateSmokeDir }
    );
    const typed = installed && runChecked("template typecheck", "npm", ["run", "typecheck"], { cwd: templateSmokeDir });
    if (typed) {
      runChecked("template still render", "npm", ["run", "still", "--", "--scale=0.25"], { cwd: templateSmokeDir });
    }
  } finally {
    rmSync(templateSmokeDir, { recursive: true, force: true });
  }
}

if (!process.exitCode) {
  console.log("PASS remotion-ad-video skill structure validated");
}
