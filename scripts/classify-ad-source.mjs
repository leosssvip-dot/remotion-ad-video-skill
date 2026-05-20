#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const sourceTypes = [
  "ecommerce_product",
  "mobile_game",
  "social_content_app",
  "saas_api",
  "service_local",
  "mobile_app",
  "unknown",
];

const usage = () => {
  console.error(`Usage:
  node scripts/classify-ad-source.mjs <url> [--title "..."] [--description "..."]
  node scripts/classify-ad-source.mjs <url> [--input-json source.json] [--brief-out ad-brief.json] [--json classification.json]

Options:
  --input-json <path>    Optional harvested/source summary with title, name, description, or text.
  --title <text>         Optional title from the page or app listing.
  --description <text>   Optional description/body text from the source.
  --format <preset>      vertical, square, or landscape. Defaults to vertical.
  --creative-route <text> Selected or user-supplied creative route to write into the brief.
  --audio <mode>         silent-safe, sfx-only, music-sfx, or voiceover. Defaults to sfx-only.
  --interaction-language <locale>
                         Language used when asking the user preflight questions. Defaults to en.
  --source-language <locale|auto>
                         Language detected from source content. Defaults to auto.
  --output-language <locale|source>
                         Language for video script, captions, and on-screen copy. Defaults to source.
  --preflight-mode <mode> required, defaults, or answered. Defaults to required.
  --brief-out <path>     Write a draft ad-brief.json artifact.
  --json <path>          Write classifier output JSON.`);
  process.exit(1);
};

const parseArgs = (argv) => {
  const options = {};
  const positional = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    const [rawName, inlineValue] = arg.split("=", 2);
    const name = rawName.slice(2);
    if (inlineValue !== undefined) {
      options[name] = inlineValue;
    } else {
      options[name] = argv[index + 1];
      index += 1;
    }
  }
  return { sourceUrl: positional[0], options };
};

const readJson = (path) => {
  if (!path) {
    return {};
  }
  const absolute = resolve(path);
  if (!existsSync(absolute)) {
    throw new Error(`Input JSON not found: ${path}`);
  }
  return JSON.parse(readFileSync(absolute, "utf8"));
};

const writeJson = (path, value) => {
  const absolute = resolve(path);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`);
};

const cleanText = (value) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const compact = (values) =>
  values
    .map(cleanText)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const includesAny = (text, words) => words.some((word) => text.includes(word));

const addScore = (state, type, points, reason) => {
  state.scores[type] += points;
  state.reasons.push(`${type}: ${reason}`);
};

const formatPreset = (raw) => {
  const value = cleanText(raw || "vertical").toLowerCase();
  if (["square", "1:1", "square-1x1"].includes(value)) {
    return { preset: "square-1x1", width: 1080, height: 1080, renderScale: 0.5, draftWidth: 540, draftHeight: 540 };
  }
  if (["landscape", "16:9", "landscape-16x9", "youtube"].includes(value)) {
    return { preset: "landscape-16x9", width: 1920, height: 1080, renderScale: 0.5, draftWidth: 960, draftHeight: 540 };
  }
  return { preset: "vertical-9x16", width: 1080, height: 1920, renderScale: 0.5, draftWidth: 540, draftHeight: 960 };
};

const preflightModeFor = (raw) => {
  const value = cleanText(raw || "required").toLowerCase();
  if (["required", "defaults", "answered"].includes(value)) {
    return value;
  }
  throw new Error(`Unsupported --preflight-mode: ${raw}`);
};

const creativeRouteFor = (raw, fallback) => {
  const value = cleanText(raw);
  return value || fallback;
};

const normalizeLanguage = (raw, fallback = "en") => {
  const value = cleanText(raw || fallback);
  const lower = value.toLowerCase();
  const aliases = {
    chinese: "zh-CN",
    cn: "zh-CN",
    mandarin: "zh-CN",
    "zh-cn": "zh-CN",
    zh: "zh-CN",
    english: "en",
    "en-us": "en",
    "en-gb": "en",
    japanese: "ja",
    jp: "ja",
    korean: "ko",
    kr: "ko",
  };
  return aliases[lower] ?? value;
};

const detectLanguage = (values) => {
  const text = values.map(cleanText).filter(Boolean).join(" ");
  if (/[\u3040-\u30ff]/.test(text)) {
    return "ja";
  }
  if (/[\uac00-\ud7af]/.test(text)) {
    return "ko";
  }
  if (/[\u4e00-\u9fff]/.test(text)) {
    return "zh-CN";
  }
  return "en";
};

const isChineseLanguage = (language) =>
  normalizeLanguage(language).toLowerCase().startsWith("zh");

const sourceTypeLabel = (type, language) => {
  if (!isChineseLanguage(language)) {
    return type;
  }
  const labels = {
    ecommerce_product: "电商商品",
    mobile_game: "移动游戏",
    social_content_app: "社交/内容应用",
    saas_api: "SaaS/API 产品",
    service_local: "本地服务",
    mobile_app: "移动应用",
    unknown: "未知类型",
  };
  return labels[type] ?? type;
};

const localizedRouteLabel = (route, language) => {
  if (!isChineseLanguage(language)) {
    return route;
  }
  const labels = {
    "product close-up": "产品特写",
    "try-on/lifestyle": "试用/生活方式",
    "offer push": "优惠促单",
    "high-energy gameplay": "高能玩法",
    "fail-rescue": "失败救场",
    "level-up reward": "升级奖励",
    "feed-native swipe": "信息流滑动",
    "creator POV": "创作者视角",
    "comment drama": "评论冲突",
    "old-way vs new-way": "旧方式对比新方式",
    "workflow collapse": "流程压缩",
    "terminal-to-result": "命令到结果",
    "problem-solution": "问题-解决",
    "before/after": "前后对比",
    "booking urgency": "预约紧迫感",
    "app demo": "应用演示",
    "notification moment": "通知场景",
    "product demo": "产品演示",
    comparison: "对比",
  };
  return labels[route] ?? route;
};

const localizedDescription = (kind, index, language) => {
  if (!isChineseLanguage(language)) {
    if (kind === "format") {
      return [
        "Recommended for TikTok, Reels, Shorts, and mobile ads.",
        "Use for feed placements where square assets are preferred.",
        "Use for YouTube, website, and widescreen placements.",
      ][index];
    }
    return index === 0 ? "Recommended default for this link type." : "Alternative creative direction.";
  }
  if (kind === "format") {
    return [
      "推荐用于 TikTok、Reels、Shorts 和移动广告。",
      "适合偏方形素材的信息流广告位。",
      "适合 YouTube、官网和宽屏投放。",
    ][index];
  }
  return index === 0 ? "该链接类型的推荐默认方向。" : "可选创意方向。";
};

const goalFor = (type) => {
  const map = {
    ecommerce_product: { goal: "purchase", cta: "Shop now" },
    mobile_game: { goal: "install", cta: "Play now" },
    social_content_app: { goal: "install", cta: "Try it now" },
    saas_api: { goal: "trial", cta: "Start building" },
    service_local: { goal: "lead", cta: "Book now" },
    mobile_app: { goal: "install", cta: "Get the app" },
    unknown: { goal: "learn_more", cta: "Learn more" },
  };
  return map[type] ?? map.unknown;
};

const localizedCta = (cta, language) => {
  if (!isChineseLanguage(language)) {
    return cta;
  }
  const labels = {
    "Shop now": "立即购买",
    "Play now": "立即游玩",
    "Try it now": "立即试用",
    "Start building": "开始构建",
    "Book now": "立即预约",
    "Get the app": "获取应用",
    "Learn more": "了解更多",
  };
  return labels[cta] ?? cta;
};

const routesFor = (type) => {
  const routes = {
    ecommerce_product: [
      "product close-up",
      "try-on/lifestyle",
      "offer push",
      "UGC-style proof",
      "premium editorial",
      "before/after styling",
    ],
    mobile_game: [
      "high-energy gameplay",
      "fail-rescue",
      "level-up reward",
      "boss/challenge",
      "speedrun",
      "satisfying cascade",
    ],
    social_content_app: [
      "feed-native swipe",
      "creator POV",
      "comment drama",
      "live/shop moment",
      "trend remix",
    ],
    saas_api: [
      "old-way vs new-way",
      "workflow collapse",
      "terminal-to-result",
      "dashboard proof",
      "founder-style demo",
    ],
    service_local: [
      "problem-solution",
      "before/after",
      "booking urgency",
      "local proof",
      "offer push",
    ],
    mobile_app: [
      "app demo",
      "problem-solution",
      "notification moment",
      "before/after",
      "social proof",
    ],
    unknown: [
      "product demo",
      "problem-solution",
      "comparison",
      "offer push",
      "premium brand",
    ],
  };
  return routes[type] ?? routes.unknown;
};

const choiceQuestionsFor = (type, goal, cta, routes, interactionLanguage) => {
  const routeOptions = routes.slice(0, 3).map((route, index) => ({
    label: localizedRouteLabel(route, interactionLanguage),
    value: route,
    description: localizedDescription("route", index, interactionLanguage),
  }));
  const chinese = isChineseLanguage(interactionLanguage);

  return [
    {
      id: "format",
      question: chinese ? "选择输出尺寸。" : "Choose the output size.",
      options: [
        { label: chinese ? "竖屏 9:16" : "Vertical 9:16", value: "vertical-9x16", description: localizedDescription("format", 0, interactionLanguage) },
        { label: chinese ? "方形 1:1" : "Square 1:1", value: "square-1x1", description: localizedDescription("format", 1, interactionLanguage) },
        { label: chinese ? "横屏 16:9" : "Landscape 16:9", value: "landscape-16x9", description: localizedDescription("format", 2, interactionLanguage) },
      ],
    },
    {
      id: "creativeRoute",
      question: chinese
        ? `选择这个${sourceTypeLabel(type, interactionLanguage)}广告的主要创意路线。`
        : `Choose the main creative route for this ${type} ad.`,
      options: routeOptions,
    },
  ];
};

const formatChoiceQuestion = (question, interactionLanguage) =>
  `${question.id}: ${question.question} ${isChineseLanguage(interactionLanguage) ? "选项" : "Options"}: ${question.options
    .map((option) => `${option.label}=${option.value}`)
    .join(", ")}.`;

const textFallbackQuestionsFor = (choiceQuestions, interactionLanguage) =>
  choiceQuestions.map((question) => formatChoiceQuestion(question, interactionLanguage));

const openQuestionsFor = (goal, cta, interactionLanguage) =>
  isChineseLanguage(interactionLanguage)
    ? [
      "受众和 hook：目标用户是谁？前 2 秒应该打欲望、痛点、好奇、优惠、身份感、FOMO，还是挑战感？",
      `目标和 CTA：我推断 goal=${goal}，CTA="${cta}"。请确认或提供你想要的转化动作。`,
      "证明和素材：哪些证明可以展示？页面采集到的素材是否可以作为草稿参考？",
    ]
    : [
      `Audience and hook: who should this target, and should the first 2 seconds hit desire, pain, curiosity, offer, status, FOMO, or challenge?`,
      `Goal and CTA: I infer goal=${goal} and CTA="${cta}". Confirm or provide the preferred conversion action.`,
      "Proof/assets: what proof may be shown, and can page-harvested assets be used as references?",
    ];

const classify = ({ sourceUrl, title, description, input = {}, options = {} }) => {
  let parsed;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    parsed = null;
  }

  const host = (parsed?.hostname ?? "").toLowerCase();
  const path = (parsed?.pathname ?? "").toLowerCase();
  const params = parsed?.searchParams ?? new URLSearchParams();
  const appId = (params.get("id") ?? "").toLowerCase();
  const inputText = compact([
    title,
    input.title,
    input.name,
    input.productName,
    description,
    input.description,
    input.text,
    input.summary,
    sourceUrl,
    host,
    path,
    appId,
  ]);
  const detectedSourceLanguage = detectLanguage([title, input.title, input.name, input.productName, description, input.description, input.text, input.summary]);
  const sourceLanguageOption = cleanText(options["source-language"] || "auto").toLowerCase();
  const sourceLanguage = sourceLanguageOption === "auto"
    ? detectedSourceLanguage
    : normalizeLanguage(options["source-language"], detectedSourceLanguage);
  const interactionLanguage = normalizeLanguage(options["interaction-language"], "en");
  const outputLanguageOption = normalizeLanguage(options["output-language"], "source");
  const outputLanguage = outputLanguageOption === "source"
    ? sourceLanguage
    : normalizeLanguage(options["output-language"], sourceLanguage);

  const state = {
    scores: Object.fromEntries(sourceTypes.map((type) => [type, 0])),
    reasons: [],
  };

  const ecommerceDomains = ["shein.", "amazon.", "etsy.", "shopify.", "temu.", "aliexpress.", "walmart.", "target.", "bestbuy.", "ebay."];
  const ecommercePathWords = ["/product", "/products", "/dp/", "/item", "/p-", "-p-", "sku", "mallcode", "product_items_component"];
  const gameWords = ["game", "games", "gameplay", "roblox", "candy", "crush", "saga", "puzzle", "match", "level", "quest", "arcade", "battle", "tycoon", "idle", "simulator"];
  const socialWords = ["tiktok", "musically", "instagram", "creator", "reels", "shorts", "feed", "followers", "live", "ugc", "community"];
  const saasWords = ["api", "sdk", "developer", "workflow", "automation", "dashboard", "integration", "endpoint", "no-code", "webhook"];
  const serviceWords = ["restaurant", "salon", "clinic", "booking", "appointment", "lawyer", "dentist", "repair", "cleaning", "local"];
  const mobileWords = ["app", "download", "install", "ios", "android", "mobile"];

  if (host === "play.google.com" && path.includes("/store/apps/details")) {
    addScore(state, "mobile_app", 4, "Google Play listing");
  }
  if (host.includes("apps.apple.com")) {
    addScore(state, "mobile_app", 4, "App Store listing");
  }
  if (includesAny(host, ecommerceDomains) || includesAny(path, ecommercePathWords) || includesAny(inputText, ["add to cart", "size", "shipping", "price", "sale"])) {
    addScore(state, "ecommerce_product", 5, "shopping/product URL signals");
  }
  if (includesAny(inputText, gameWords)) {
    addScore(state, "mobile_game", host.includes("play.google.com") ? 5 : 3, "gameplay/app keywords");
  }
  if (includesAny(inputText, socialWords)) {
    addScore(state, "social_content_app", host.includes("play.google.com") ? 5 : 3, "social/content keywords");
  }
  if (host.includes("api") || includesAny(inputText, saasWords)) {
    addScore(state, "saas_api", host.includes("api") ? 5 : 3, "API/SaaS keywords");
  }
  if (includesAny(inputText, serviceWords)) {
    addScore(state, "service_local", 3, "local service keywords");
  }
  if (includesAny(inputText, mobileWords)) {
    addScore(state, "mobile_app", 2, "mobile app keywords");
  }
  if (state.scores.mobile_app > 0 && state.scores.mobile_game > 0) {
    addScore(state, "mobile_game", 2, "specific app category beats generic mobile app");
  }
  if (state.scores.mobile_app > 0 && state.scores.social_content_app > 0) {
    addScore(state, "social_content_app", 2, "specific app category beats generic mobile app");
  }

  const ranked = Object.entries(state.scores)
    .filter(([type]) => type !== "unknown")
    .sort((left, right) => right[1] - left[1]);
  const [topType, topScore] = ranked[0] ?? ["unknown", 0];
  const sourceType = topScore >= 3 ? topType : "unknown";
  const confidence = sourceType === "unknown" ? 0.25 : Math.min(0.95, 0.35 + topScore * 0.1);
  const { goal, cta: defaultCta } = goalFor(sourceType);
  const cta = localizedCta(defaultCta, outputLanguage);
  const creativeRoutes = routesFor(sourceType);
  const choiceQuestions = choiceQuestionsFor(sourceType, goal, cta, creativeRoutes, interactionLanguage);
  const openQuestions = openQuestionsFor(goal, cta, interactionLanguage);

  return {
    schemaVersion: "1.0",
    sourceUrl,
    sourceType,
    confidence: Number(confidence.toFixed(2)),
    reasons: state.reasons,
    productName: cleanText(title || input.title || input.name || input.productName || host || "Unknown product"),
    interactionLanguage,
    sourceLanguage,
    outputLanguage,
    goal,
    cta,
    creativeRoutes,
    preflightQuestions: textFallbackQuestionsFor(choiceQuestions, interactionLanguage),
    interactionPlan: {
      preferredMode: "structured_choices",
      fallbackMode: "text",
      language: interactionLanguage,
      requiredChoiceQuestionIds: choiceQuestions.map((question) => question.id),
      choiceQuestions,
      openQuestions,
    },
  };
};

const makeBrief = ({ classification, options }) => {
  const format = formatPreset(options.format);
  const audioMode = cleanText(options.audio || "sfx-only");
  const preflightMode = preflightModeFor(options["preflight-mode"]);
  const requiresPreflight = preflightMode === "required";
  const defaultRoute = classification.creativeRoutes[0] ?? "product demo";
  const primaryRoute = creativeRouteFor(options["creative-route"] ?? options.creativeRoute, defaultRoute);
  const routeIsDefault = primaryRoute === defaultRoute;
  const assetNotes = {
    ecommerce_product: "Run ecommerce harvesting for product main image before storyboard. If blocked, stop and request user images.",
    mobile_game: "Use store screenshots or page-harvested visuals as reference; build kinetic gameplay-style motion instead of static slides.",
    social_content_app: "Use store screenshots or page-harvested visuals as reference; build feed-native motion and creator/feed moments.",
    saas_api: "Harvest logo, OG image, screenshots, and visible UI; avoid exposing tokens, keys, or private payloads.",
    service_local: "Harvest logo, location imagery, service photos, and proof only if rights are acceptable.",
    mobile_app: "Use app-store screenshots and icon where available; simulate real app interaction.",
    unknown: "Harvest public assets, then ask user for missing product images and creative direction.",
  };

  return {
    schemaVersion: "1.0",
    sourceUrl: classification.sourceUrl,
    generatedAt: new Date().toISOString(),
    mode: requiresPreflight ? "requires_input" : preflightMode,
    status: requiresPreflight ? "blocked" : preflightMode === "answered" ? "answered" : "draft",
    sourceType: classification.sourceType,
    classificationConfidence: classification.confidence,
    classificationReasons: classification.reasons,
    productName: classification.productName,
    interactionLanguage: classification.interactionLanguage,
    sourceLanguage: classification.sourceLanguage,
    outputLanguage: classification.outputLanguage,
    languagePlan: {
      preflightQuestions: classification.interactionLanguage,
      videoScriptAndCaptions: classification.outputLanguage,
      note: "Ask user-facing preflight questions in interactionLanguage. Generate video script, captions, and on-screen copy in outputLanguage unless the user explicitly overrides it.",
    },
    goal: classification.goal,
    cta: classification.cta,
    audience: "inferred from source; needs confirmation",
    hookFocus: classification.sourceType === "mobile_game" ? "gameplay challenge" : "curiosity",
    creativeRoute: primaryRoute,
    proofPlan: {
      allowed: [],
      blocked: ["unverified numeric claims", "private/customer data", "regulated claims without approved copy"],
      notes: "Only render observed or user-approved claims.",
    },
    assetPlan: {
      status: "weak",
      rightsStatus: "needs_verification",
      required: classification.sourceType === "ecommerce_product"
        ? ["product main image", "brand/logo", "product detail or lifestyle image"]
        : ["brand/logo", "source visual reference"],
      notes: assetNotes[classification.sourceType] ?? assetNotes.unknown,
    },
    format,
    durationSeconds: 15,
    audioMode,
    interactionPlan: {
      preferredMode: "structured_choices",
      fallbackMode: "text",
      language: classification.interactionLanguage,
      instructions: isChineseLanguage(classification.interactionLanguage)
        ? "先只询问 choiceQuestions。若 agent 支持可选择 UI，就用可选择 UI；否则用同样选项的文本 fallback。Audio 默认 sfx-only，除非用户要求 silent-safe、音乐或旁白，否则不要作为必答预检问题。除非用户要求更深入 brief，否则不要在这些选择前询问 openQuestions。"
        : "Ask only choiceQuestions first. If the agent supports selectable UI, use it; if not, render those same choices as text fallback. Audio defaults to sfx-only and should not be a required preflight question unless the user asks for silent-safe, music, or voiceover. Do not ask openQuestions until after these choices unless the user asks for deeper brief work.",
      requiredChoiceQuestionIds: classification.interactionPlan.requiredChoiceQuestionIds,
      choiceQuestions: classification.interactionPlan.choiceQuestions,
      openQuestions: classification.interactionPlan.openQuestions,
    },
    unansweredQuestions: requiresPreflight ? classification.preflightQuestions : [],
    assumptions: [
      `Category inferred as ${classification.sourceType} with confidence ${classification.confidence}.`,
      `Interaction language is ${classification.interactionLanguage}; output language is ${classification.outputLanguage}.`,
      routeIsDefault ? `Default creative route is ${primaryRoute}.` : `Creative route selected from preflight answer is ${primaryRoute}.`,
      `Default format is ${format.preset} with draft scale ${format.renderScale}.`,
      requiresPreflight ? "Preflight answers are required before storyboard or render." : `Preflight mode is ${preflightMode}.`,
    ],
    blockers: requiresPreflight ? ["preflight_answers_required"] : [],
  };
};

const { sourceUrl, options } = parseArgs(process.argv.slice(2));
if (!sourceUrl) {
  usage();
}

const input = readJson(options["input-json"]);
const classification = classify({
  sourceUrl,
  title: options.title,
  description: options.description,
  input,
  options,
});

if (options.json) {
  writeJson(options.json, classification);
}
if (options["brief-out"]) {
  writeJson(options["brief-out"], makeBrief({ classification, options }));
}

console.log(JSON.stringify(classification, null, 2));
