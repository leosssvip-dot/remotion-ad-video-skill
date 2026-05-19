#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { spawn } from "node:child_process";

const DEFAULT_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const usage = () => {
  console.error(`Usage:
  node scripts/harvest-ecommerce-assets.mjs <product-url> --out-dir <public-brand-dir> [options]

Options:
  --brand <name>              Brand name for output metadata.
  --max-images <n>            Number of top product image candidates to download. Default: 4.
  --timeout-ms <n>            Browser load timeout. Default: 18000.
  --settle-ms <n>             Extra wait after load. Default: 3500.
  --http-only                 Skip browser rendering and only inspect HTML.
  --chrome-path <path>        Chrome/Chromium executable path.
  --expected-title <text>     Optional product title hint used for confidence scoring.
  --expected-sku <text>       Optional product SKU/id hint used for block detection.
  --json <path>               Output JSON path. Default: <out-dir>/ecommerce-harvest.json.

The browser path renders the page, extracts visible DOM images, image resources,
Open Graph images, JSON-LD, title, price, rating, SKU, and review hints, then
downloads the best product image candidates. Search engines are intentionally
not used; they are a last-resort manual fallback outside this script.`);
  process.exit(1);
};

const args = process.argv.slice(2);
const sourceUrl = args[0];
if (!sourceUrl || sourceUrl.startsWith("-")) {
  usage();
}

const getOption = (name, fallback) => {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1] ?? fallback;
};

const hasFlag = (name) => args.includes(name);

const outDirArg = getOption("--out-dir");
if (!outDirArg) {
  usage();
}

const outDir = resolve(outDirArg);
const brand = getOption("--brand", new URL(sourceUrl).hostname.replace(/^www\./, ""));
const maxImages = Number(getOption("--max-images", "4"));
const timeoutMs = Number(getOption("--timeout-ms", "18000"));
const settleMs = Number(getOption("--settle-ms", "3500"));
const httpOnly = hasFlag("--http-only");
const outputJson = resolve(getOption("--json", join(outDir, "ecommerce-harvest.json")));
const expectedTitle = getOption("--expected-title", "");
const expectedSku = getOption("--expected-sku", "");
const chromePath =
  getOption("--chrome-path") ||
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

mkdirSync(outDir, { recursive: true });

const normalizeUrl = (value, baseUrl = sourceUrl) => {
  if (!value || /^data:/i.test(value) || /^blob:/i.test(value)) {
    return "";
  }
  const cleaned = String(value)
    .replace(/&amp;/g, "&")
    .replace(/\\u002F/g, "/")
    .trim();
  try {
    return new URL(cleaned, baseUrl).href;
  } catch {
    return "";
  }
};

const parseSrcset = (srcset) =>
  String(srcset || "")
    .split(",")
    .map((part) => part.trim().split(/\s+/)[0])
    .map((url) => normalizeUrl(url))
    .filter(Boolean);

const imageLike = (url) =>
  /\.(?:avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i.test(url) ||
  /(?:image|img|ltwebstatic|shein|media|cdn).*?(?:jpe?g|png|webp|avif)/i.test(url);

const badAssetName = (candidate) => {
  const haystack = `${candidate.url} ${candidate.alt || ""} ${candidate.parentText || ""} ${candidate.className || ""}`.toLowerCase();
  return /logo|favicon|sprite|icon|payment|paypal|visa|mastercard|maestro|klarna|coupon|promo belt|shipping|returns?|secure|trust|rating|star|avatar|profile|store atmosphere|google|apple|facebook|instagram|twitter|youtube|tiktok|pinterest|whatsapp|captcha|lazy|placeholder|bg-grey|empty|robot|prime|club|banner|flag|currency|stu-outdated|msg_nodata|no[-_ ]?data|faq_search_bg|opps|oops|points|outdated|risk|challenge|verify/.test(
    haystack
  );
};

const productTokens = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 4 && ![
      "women",
      "with",
      "this",
      "that",
      "from",
      "product",
      "products",
      "casual",
      "summer",
      "shop",
      "shopping",
      "online",
      "fashion",
      "shein",
      "store",
      "official",
      "quality",
      "price",
      "deals",
      "sale"
    ].includes(token))
    .slice(0, 18);

const inferSourceIntent = (url) => {
  const parsed = new URL(url);
  const pathname = decodeURIComponent(parsed.pathname);
  const basename = pathname.split("/").filter(Boolean).at(-1) || "";
  const sheinProductId = basename.match(/-p-(\d+)/i)?.[1] || "";
  const slug = basename
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/-p-\d+.*/i, "")
    .replace(/[-_]+/g, " ")
    .trim();
  const title = expectedTitle || slug;
  const sku = expectedSku || parsed.searchParams.get("sku") || parsed.searchParams.get("id") || sheinProductId || "";
  return {
    hostname: parsed.hostname.replace(/^www\./, ""),
    path: pathname,
    title,
    sku,
    productId: sheinProductId || sku,
    tokens: productTokens(`${title} ${sku}`)
  };
};

const sourceIntent = inferSourceIntent(sourceUrl);

const imageIdentityKey = (rawUrl) => {
  const withoutHash = String(rawUrl || "").split("#")[0];
  try {
    const parsed = new URL(withoutHash);
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(w|h|width|height|size|quality|format|crop|fit|x-oss-process)$/i.test(key)) {
        parsed.searchParams.delete(key);
      }
    }
    parsed.pathname = parsed.pathname.replace(/_thumbnail_\d+x(?:\d+)?(?=\.)/i, "_thumbnail");
    return parsed.href;
  } catch {
    return withoutHash.replace(/_thumbnail_\d+x(?:\d+)?(?=\.)/i, "_thumbnail");
  }
};

const uniqueByUrl = (candidates) => {
  const seen = new Set();
  return candidates.filter((candidate) => {
    const key = imageIdentityKey(candidate.url);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolveConnect, rejectConnect) => {
      const timer = setTimeout(() => rejectConnect(new Error("CDP websocket timeout")), 8000);
      this.ws.addEventListener("open", () => {
        clearTimeout(timer);
        resolveConnect();
      });
      this.ws.addEventListener("error", rejectConnect);
    });
    this.ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolveCommand, rejectCommand } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) {
          rejectCommand(new Error(message.error.message));
        } else {
          resolveCommand(message.result);
        }
        return;
      }
      if (message.method && this.listeners.has(message.method)) {
        for (const listener of this.listeners.get(message.method)) {
          listener(message.params);
        }
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolveCommand, rejectCommand) => {
      const timer = setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          rejectCommand(new Error(`CDP timeout: ${method}`));
        }
      }, 12000);
      this.pending.set(id, {
        resolveCommand: (value) => {
          clearTimeout(timer);
          resolveCommand(value);
        },
        rejectCommand: (error) => {
          clearTimeout(timer);
          rejectCommand(error);
        }
      });
    });
  }

  once(method, timeout = 15000) {
    return new Promise((resolveEvent) => {
      const timer = setTimeout(() => resolveEvent(null), timeout);
      const listener = (params) => {
        clearTimeout(timer);
        const listeners = this.listeners.get(method) || [];
        this.listeners.set(
          method,
          listeners.filter((item) => item !== listener)
        );
        resolveEvent(params);
      };
      this.listeners.set(method, [...(this.listeners.get(method) || []), listener]);
    });
  }

  close() {
    this.ws?.close();
  }
}

const waitForChrome = async (port) => {
  const endpoint = `http://127.0.0.1:${port}/json/version`;
  const started = Date.now();
  while (Date.now() - started < 10000) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Chrome is still starting.
    }
    await delay(250);
  }
  throw new Error("Chrome did not expose a DevTools endpoint in time");
};

const createTarget = async (port) => {
  const blank = "about:blank";
  const endpoint = `http://127.0.0.1:${port}/json/new?${encodeURIComponent(blank)}`;
  let response = await fetch(endpoint, { method: "PUT" });
  if (!response.ok) {
    response = await fetch(endpoint);
  }
  if (!response.ok) {
    const tabs = await fetch(`http://127.0.0.1:${port}/json/list`).then((res) => res.json());
    const page = tabs.find((tab) => tab.type === "page" && tab.webSocketDebuggerUrl);
    if (!page) {
      throw new Error("Could not create or find a CDP page target");
    }
    return page;
  }
  return response.json();
};

const scrapeExpression = `(() => {
  const text = (node) => (node?.innerText || node?.textContent || "").replace(/\\s+/g, " ").trim();
  const meta = Array.from(document.querySelectorAll("meta")).map((node) => ({
    property: node.getAttribute("property") || "",
    name: node.getAttribute("name") || "",
    content: node.getAttribute("content") || ""
  }));
  const links = Array.from(document.querySelectorAll("link")).map((node) => ({
    rel: node.getAttribute("rel") || "",
    href: node.href || node.getAttribute("href") || "",
    type: node.getAttribute("type") || ""
  }));
  const jsonLd = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    .map((node) => node.textContent || "")
    .filter(Boolean);
  const headings = Array.from(document.querySelectorAll("h1,h2")).slice(0, 20).map((node) => text(node));
  const images = Array.from(document.images).map((img, index) => {
    const rect = img.getBoundingClientRect();
    const style = getComputedStyle(img);
    const parent = img.closest("button,a,li,figure,[aria-label],div");
    return {
      index,
      url: img.currentSrc || img.src || "",
      src: img.src || "",
      srcset: img.getAttribute("srcset") || "",
      alt: img.alt || "",
      title: img.title || "",
      id: img.id || "",
      className: String(img.className || ""),
      naturalWidth: img.naturalWidth || 0,
      naturalHeight: img.naturalHeight || 0,
      clientWidth: img.clientWidth || 0,
      clientHeight: img.clientHeight || 0,
      visible: rect.width > 24 && rect.height > 24 && style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity || 1) > 0.05,
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      parentText: text(parent).slice(0, 500),
      aria: parent?.getAttribute("aria-label") || "",
      closestLink: img.closest("a")?.href || ""
    };
  });
  const sources = Array.from(document.querySelectorAll("source[srcset]")).map((source, index) => ({
    index,
    srcset: source.getAttribute("srcset") || "",
    media: source.getAttribute("media") || "",
    type: source.getAttribute("type") || ""
  }));
  const resources = performance.getEntriesByType("resource")
    .filter((entry) => /\\.(?:avif|gif|jpe?g|png|webp)(?:[?#]|$)/i.test(entry.name) || /image|img|ltwebstatic|shein|cdn/i.test(entry.name))
    .map((entry) => ({ url: entry.name, initiatorType: entry.initiatorType || "", transferSize: entry.transferSize || 0, duration: entry.duration || 0 }))
    .slice(0, 400);
  return {
    pageUrl: location.href,
    title: document.title,
    bodyText: text(document.body).slice(0, 12000),
    viewport: { width: innerWidth, height: innerHeight },
    meta,
    links,
    jsonLd,
    headings,
    images,
    sources,
    resources
  };
})()`;

const scrapeWithBrowser = async () => {
  const port = 9300 + Math.floor(Math.random() * 700);
  const userDataDir = resolve(`/tmp/ecommerce-harvest-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const chrome = spawn(chromePath, [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    "--disable-gpu",
    "--disable-blink-features=AutomationControlled",
    "--no-first-run",
    "--no-default-browser-check",
    "--window-size=1440,1600",
    "about:blank"
  ], {
    stdio: ["ignore", "ignore", "pipe"]
  });

  let stderr = "";
  chrome.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await waitForChrome(port);
    const target = await createTarget(port);
    const cdp = new CdpClient(target.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Network.enable");
    await cdp.send("Network.setUserAgentOverride", { userAgent: DEFAULT_UA });
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
      source: "Object.defineProperty(navigator, 'webdriver', {get: () => undefined});"
    });
    const loaded = cdp.once("Page.loadEventFired", timeoutMs);
    await cdp.send("Page.navigate", { url: sourceUrl, referrer: "https://www.google.com/" });
    await loaded;
    await delay(settleMs);
    await cdp.send("Runtime.evaluate", {
      expression: "window.scrollTo(0, Math.min(900, document.body.scrollHeight));",
      awaitPromise: false,
      returnByValue: true
    });
    await delay(600);
    await cdp.send("Runtime.evaluate", {
      expression: "window.scrollTo(0, 0);",
      awaitPromise: false,
      returnByValue: true
    });
    await delay(800);
    const result = await cdp.send("Runtime.evaluate", {
      expression: scrapeExpression,
      awaitPromise: true,
      returnByValue: true
    });
    cdp.close();
    return { ok: true, data: result.result.value };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      stderr: stderr.slice(-2000)
    };
  } finally {
    chrome.kill("SIGTERM");
  }
};

const scrapeWithHttp = async () => {
  const response = await fetch(sourceUrl, {
    headers: {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
      "user-agent": DEFAULT_UA
    }
  });
  const html = await response.text();
  const meta = [...html.matchAll(/<meta\s+[^>]*>/gi)].map((match) => {
    const tag = match[0];
    const attr = (name) => tag.match(new RegExp(`${name}=["']([^"']+)["']`, "i"))?.[1] || "";
    return { property: attr("property"), name: attr("name"), content: attr("content") };
  });
  const links = [...html.matchAll(/<link\s+[^>]*>/gi)].map((match) => {
    const tag = match[0];
    const attr = (name) => tag.match(new RegExp(`${name}=["']([^"']+)["']`, "i"))?.[1] || "";
    return { rel: attr("rel"), href: normalizeUrl(attr("href")), type: attr("type") };
  });
  const imageUrls = [...html.matchAll(/(?:https?:)?\/\/[^"' <>\s)]+\.(?:avif|gif|jpe?g|png|webp)(?:\?[^"' <>\s)]*)?/gi)]
    .map((match) => normalizeUrl(match[0]))
    .filter(Boolean);
  return {
    pageUrl: response.url,
    title: html.match(/<title[^>]*>(.*?)<\/title>/is)?.[1]?.replace(/\s+/g, " ").trim() || "",
    bodyText: html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 12000),
    viewport: { width: 0, height: 0 },
    meta,
    links,
    jsonLd: [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]),
    headings: [...html.matchAll(/<h1[^>]*>(.*?)<\/h1>/gis)].map((match) => match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()),
    images: imageUrls.map((url, index) => ({ index, url, alt: "", title: "", naturalWidth: 0, naturalHeight: 0, clientWidth: 0, clientHeight: 0, visible: false, rect: { x: 0, y: 0, width: 0, height: 0 }, parentText: "", className: "", id: "" })),
    sources: [],
    resources: imageUrls.map((url) => ({ url, initiatorType: "html", transferSize: 0, duration: 0 }))
  };
};

const extractFacts = (data) => {
  const metaBy = (key) =>
    data.meta?.find((item) => [item.property, item.name].some((value) => String(value).toLowerCase() === key))?.content || "";
  const jsonObjects = [];
  for (const raw of data.jsonLd || []) {
    try {
      const parsed = JSON.parse(raw);
      jsonObjects.push(...(Array.isArray(parsed) ? parsed : [parsed]));
    } catch {
      // Ignore invalid JSON-LD.
    }
  }
  const productJson = jsonObjects.find((item) => {
    const type = Array.isArray(item?.["@type"]) ? item["@type"].join(" ") : item?.["@type"];
    return /product/i.test(String(type || ""));
  });
  const text = data.bodyText || "";
  const visiblePriceMatch =
    text.match(/PRICE AND AVAILABILITY\s*(\$\s?\d+(?:\.\d{2})?)/i) ||
    text.match(/(?:^|\s)(\$\s?\d+(?:\.\d{2})?)\s*(?:Retail Price:|-\d+%)/i);
  const priceMatch = visiblePriceMatch || text.match(/(?:\$|USD\s*)\s?\d+(?:\.\d{2})?/i);
  const retailMatch = text.match(/Retail Price:\s*(\$\s?\d+(?:\.\d{2})?)/i);
  const skuMatch = text.match(/SKU:\s*([A-Za-z0-9_-]+)/i);
  const ratingMatch = text.match(/Average Rating\s*([0-9.]+)|Rating\s*([0-9.]+)/i);
  const reviewsMatch = text.match(/\(([0-9][0-9,]*)\s*Reviews?\)/i);
  const title =
    productJson?.name ||
    data.headings?.find((heading) => heading && heading.length > 20) ||
    metaBy("og:title") ||
    data.title ||
    "";
  return {
    title,
    description: productJson?.description || metaBy("og:description") || metaBy("description") || "",
    sku: productJson?.sku || skuMatch?.[1] || "",
    price: visiblePriceMatch?.[1]?.replace(/\s+/g, "") || (productJson?.offers?.price ? `$${productJson.offers.price}` : priceMatch?.[0]?.replace(/\s+/g, "") || ""),
    retailPrice: retailMatch?.[1]?.replace(/\s+/g, "") || "",
    rating: productJson?.aggregateRating?.ratingValue || ratingMatch?.[1] || ratingMatch?.[2] || "",
    reviews: productJson?.aggregateRating?.reviewCount || reviewsMatch?.[1] || "",
    canonicalUrl: data.links?.find((link) => /canonical/i.test(link.rel))?.href || data.pageUrl || sourceUrl
  };
};

const detectBlockedPage = (data, facts, intent) => {
  const haystack = `${data.pageUrl || ""} ${data.title || ""} ${data.bodyText || ""}`.toLowerCase();
  const reasons = [];
  if (/\/(?:risk\/challenge|challenge|captcha|verify|blocked|access-denied)(?:[/?#]|$)/i.test(data.pageUrl || "")) {
    reasons.push("risk-or-challenge-url");
  }
  if (/(captcha|verify you are human|security check|access denied|unusual traffic|risk control|robot check|are you a robot|enable cookies|pardon the interruption)/i.test(haystack)) {
    reasons.push("anti-bot-copy");
  }
  if (intent.productId && /shein/i.test(intent.hostname) && !haystack.includes(String(intent.productId).toLowerCase())) {
    reasons.push("expected-product-id-missing");
  }
  const tokenMatches = intent.tokens.filter((token) => haystack.includes(token)).length;
  if (intent.tokens.length >= 6 && tokenMatches < 2) {
    reasons.push("product-title-tokens-missing");
  }
  const titleLooksGeneric = /^(shein|just a moment|attention required|access denied|security check|captcha)/i.test(String(facts.title || "").trim());
  if (titleLooksGeneric && !facts.sku && !facts.price) {
    reasons.push("generic-or-challenge-title");
  }
  return {
    blocked: reasons.some((reason) =>
      ["risk-or-challenge-url", "anti-bot-copy", "expected-product-id-missing", "generic-or-challenge-title"].includes(reason)
    ),
    reasons,
    productTokenMatches: tokenMatches
  };
};

const hasStrongProductSignal = (candidate) =>
  candidate.reasons.some((reason) =>
    /^(metadata-image|main-product-label|alternate-product-view|product-token-match|source-product-id-match|large-visible-rect|large-natural-size|near-product-gallery)/.test(
      reason
    )
  );

const shouldDownloadCandidate = (candidate) => {
  if (candidate.pageBlocked) {
    return false;
  }
  if (candidate.reasons.includes("excluded-common-asset")) {
    return false;
  }
  if (!hasStrongProductSignal(candidate)) {
    return false;
  }
  const minimumScore = candidate.sourceType === "http" ? 90 : 85;
  return candidate.score >= minimumScore;
};

const candidatesFromData = (data, sourceType) => {
  const facts = extractFacts(data);
  const blockReport = detectBlockedPage(data, facts, sourceIntent);
  const tokens = [...new Set([...productTokens(`${facts.title} ${facts.description}`), ...sourceIntent.tokens])];
  const candidates = [];
  const add = (partial) => {
    const url = normalizeUrl(partial.url);
    if (!url || !imageLike(url)) {
      return;
    }
    candidates.push({
      ...partial,
      url,
      sourceType,
      pageBlocked: blockReport.blocked,
      pageBlockReasons: blockReport.reasons
    });
  };

  for (const meta of data.meta || []) {
    const key = `${meta.property || ""} ${meta.name || ""}`.toLowerCase();
    if (/og:image|twitter:image|image/.test(key)) {
      add({ url: meta.content, source: "meta", alt: facts.title, visible: false });
    }
  }
  for (const link of data.links || []) {
    if (/image_src|apple-touch-icon|icon/i.test(link.rel || "")) {
      add({ url: link.href, source: "link", alt: link.rel, visible: false });
    }
  }
  for (const image of data.images || []) {
    add({ ...image, source: sourceType === "http" ? "html-image" : "dom-image", visible: sourceType === "http" ? false : image.visible });
    for (const url of parseSrcset(image.srcset)) {
      add({ ...image, url, source: "dom-srcset" });
    }
  }
  for (const source of data.sources || []) {
    for (const url of parseSrcset(source.srcset)) {
      add({ url, source: "picture-source", alt: source.media || source.type || "", visible: false });
    }
  }
  for (const resource of data.resources || []) {
    add({ url: resource.url, source: `resource:${resource.initiatorType || "unknown"}`, alt: "", visible: false, transferSize: resource.transferSize || 0 });
  }

  const scored = candidates.map((candidate) => {
    const rectArea = (candidate.rect?.width || candidate.clientWidth || 0) * (candidate.rect?.height || candidate.clientHeight || 0);
    const naturalArea = (candidate.naturalWidth || 0) * (candidate.naturalHeight || 0);
    const haystack = `${candidate.alt || ""} ${candidate.title || ""} ${candidate.parentText || ""} ${candidate.aria || ""} ${candidate.className || ""}`.toLowerCase();
    const urlHaystack = decodeURIComponent(candidate.url).toLowerCase();
    let score = 0;
    const reasons = [];
    if (candidate.source === "dom-image") {
      score += 35;
      reasons.push("dom-image");
    }
    if (candidate.visible) {
      score += 85;
      reasons.push("visible");
    }
    if (/og:image|twitter:image|meta/.test(candidate.source || "")) {
      score += 70;
      reasons.push("metadata-image");
    }
    if (/view\s*1|main|primary|large image|product images?|goods|detail|zoom/i.test(haystack)) {
      score += 110;
      reasons.push("main-product-label");
    }
    if (/view\s*[2-6]/i.test(haystack)) {
      score += 45;
      reasons.push("alternate-product-view");
    }
    const tokenMatches = tokens.filter((token) => haystack.includes(token) || urlHaystack.includes(token)).length;
    if (tokenMatches > 0) {
      score += Math.min(90, tokenMatches * 12);
      reasons.push(`product-token-match:${tokenMatches}`);
    }
    if (sourceIntent.productId && urlHaystack.includes(String(sourceIntent.productId).toLowerCase())) {
      score += 80;
      reasons.push("source-product-id-match");
    }
    if (rectArea > 150000) {
      score += Math.min(120, rectArea / 9000);
      reasons.push("large-visible-rect");
    }
    if (naturalArea > 250000) {
      score += Math.min(90, naturalArea / 20000);
      reasons.push("large-natural-size");
    }
    if ((candidate.rect?.x || 0) < (data.viewport?.width || 1440) * 0.68 && (candidate.rect?.y || 0) < 900 && candidate.visible) {
      score += 35;
      reasons.push("near-product-gallery");
    }
    if (/images\d|_pi|_spmp|product|goods|shein|ltwebstatic/i.test(candidate.url)) {
      score += 25;
      reasons.push("commerce-image-host");
    }
    if (candidate.transferSize > 100000) {
      score += 15;
      reasons.push("large-resource-transfer");
    }
    if (badAssetName(candidate)) {
      score -= 220;
      reasons.push("excluded-common-asset");
    }
    if (candidate.pageBlocked) {
      score -= 180;
      reasons.push("blocked-page-source");
    }
    if (naturalArea > 0 && naturalArea < 20000) {
      score -= 80;
      reasons.push("too-small");
    }
    if (/\.svg(?:[?#]|$)/i.test(candidate.url)) {
      score -= 70;
      reasons.push("svg-less-likely-product-photo");
    }
    return {
      ...candidate,
      score: Math.round(score),
      reasons
    };
  });

  return { facts, blockReport, candidates: uniqueByUrl(scored.sort((a, b) => b.score - a.score)) };
};

const extFromContentType = (contentType) => {
  if (/webp/i.test(contentType)) return ".webp";
  if (/png/i.test(contentType)) return ".png";
  if (/avif/i.test(contentType)) return ".avif";
  if (/gif/i.test(contentType)) return ".gif";
  if (/jpe?g/i.test(contentType)) return ".jpg";
  return "";
};

const extFromBytes = (bytes) => {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return ".jpg";
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return ".png";
  if (bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return ".webp";
  if (bytes.subarray(0, 3).toString("ascii") === "GIF") return ".gif";
  if (bytes.subarray(4, 8).toString("ascii") === "ftyp" && bytes.subarray(8, 12).toString("ascii").includes("avif")) return ".avif";
  return "";
};

const downloadCandidate = async (candidate, index) => {
  const response = await fetch(candidate.url, {
    headers: {
      "user-agent": DEFAULT_UA,
      "referer": sourceUrl,
      "accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
    }
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const contentType = response.headers.get("content-type") || "";
  if (!/^image\//i.test(contentType)) {
    throw new Error(`not an image: ${contentType}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 2048) {
    throw new Error("image response too small");
  }
  const extension =
    extFromBytes(bytes) ||
    extFromContentType(contentType) ||
    extname(new URL(candidate.url).pathname).toLowerCase() ||
    ".jpg";
  const hash = createHash("sha1").update(candidate.url).digest("hex").slice(0, 8);
  const prefix = index === 0 ? "product-main" : `product-view-${index + 1}`;
  const filename = `${prefix}-${hash}${extension}`;
  const filePath = join(outDir, filename);
  writeFileSync(filePath, bytes);
  return {
    file: filename,
    path: filePath,
    sizeBytes: bytes.length,
    contentType
  };
};

const main = async () => {
  const browserResult = httpOnly ? { ok: false, skipped: true } : await scrapeWithBrowser();
  const httpData = await scrapeWithHttp();
  const browserData = browserResult.ok ? browserResult.data : null;
  const browserExtract = browserData
    ? candidatesFromData(browserData, "browser")
    : { facts: {}, blockReport: { blocked: false, reasons: [] }, candidates: [] };
  const httpExtract = candidatesFromData(httpData, "http");
  const usableHttpFacts = httpExtract.blockReport.blocked ? {} : httpExtract.facts;
  const usableBrowserFacts = browserExtract.blockReport.blocked ? {} : browserExtract.facts;
  const facts = {
    ...usableHttpFacts,
    ...Object.fromEntries(Object.entries(usableBrowserFacts).filter(([, value]) => value))
  };
  const candidates = uniqueByUrl([...browserExtract.candidates, ...httpExtract.candidates].sort((a, b) => b.score - a.score));

  const downloaded = [];
  const downloadErrors = [];
  const eligibleCandidates = candidates.filter(shouldDownloadCandidate);
  for (const candidate of eligibleCandidates.slice(0, Math.max(1, maxImages * 3))) {
    if (downloaded.length >= maxImages) {
      break;
    }
    try {
      const result = await downloadCandidate(candidate, downloaded.length);
      downloaded.push({ ...result, sourceUrl: candidate.url, score: candidate.score, reasons: candidate.reasons, alt: candidate.alt || "" });
    } catch (error) {
      downloadErrors.push({
        url: candidate.url,
        score: candidate.score,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  const report = {
    brand,
    sourceUrl,
    sourceIntent,
    harvestedAt: new Date().toISOString(),
    browser: {
      attempted: !httpOnly,
      ok: Boolean(browserResult.ok),
      error: browserResult.ok ? null : browserResult.error || null,
      blocked: Boolean(browserExtract.blockReport.blocked),
      blockReasons: browserExtract.blockReport.reasons
    },
    http: {
      ok: true,
      blocked: Boolean(httpExtract.blockReport.blocked),
      blockReasons: httpExtract.blockReport.reasons
    },
    harvestDecision: {
      eligibleCandidates: eligibleCandidates.length,
      mainImageHarvested: Boolean(downloaded[0]),
      skippedBlockedSources: Boolean(browserExtract.blockReport.blocked || httpExtract.blockReport.blocked),
      rule: "Download only product-confident images; never use search, platform chrome, empty states, risk pages, or generic brand assets as product photos."
    },
    facts,
    downloaded,
    topCandidates: candidates.slice(0, 20).map((candidate) => ({
      url: candidate.url,
      score: candidate.score,
      source: candidate.source,
      sourceType: candidate.sourceType,
      alt: candidate.alt || "",
      visible: Boolean(candidate.visible),
      pageBlocked: Boolean(candidate.pageBlocked),
      pageBlockReasons: candidate.pageBlockReasons || [],
      naturalWidth: candidate.naturalWidth || 0,
      naturalHeight: candidate.naturalHeight || 0,
      rect: candidate.rect || null,
      reasons: candidate.reasons
    })),
    downloadErrors: downloadErrors.slice(0, 12)
  };

  writeFileSync(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Wrote ${outputJson}`);
  console.log(`Downloaded ${downloaded.length} image(s) to ${outDir}`);
  if (downloaded[0]) {
    console.log(`Main image: ${downloaded[0].file}`);
    process.exit(0);
  } else {
    console.log("Main image: not harvested");
    process.exit(2);
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
