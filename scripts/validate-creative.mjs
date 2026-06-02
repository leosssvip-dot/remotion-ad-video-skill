#!/usr/bin/env node
// Creative concept gate.
//
// Turns the Strategy step's concept work into a checkable artifact, the same way
// validate-skill.mjs gates audio/template structure. Run it against a generated
// concepts.json BEFORE storyboard or code so creativity is enforced, not just
// advised. Without a gate, the agent reskins the stock template and every ad
// looks the same.
//
// Usage:
//   node scripts/validate-creative.mjs <path/to/concepts.json> [--min N] [--min-total N]

import { realpathSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const DEFAULT_ARC = ["hook", "pain", "demo", "proof", "cta"];

export const SCORE_DIMENSIONS = [
  "attention",
  "nativeFit",
  "productProof",
  "conversion",
  "productionFeasibility",
  "claimSafety",
  "distinctiveness"
];

// Tired ad-copy openers that signal template-filler instead of an idea.
export const CLICHE_PATTERNS = [
  /\bmeet your\b/i,
  /\bmeet the\b/i,
  /\bintroducing\b/i,
  /\bthe future of\b/i,
  /\bsay goodbye to\b/i,
  /\bgame[\s-]?changer\b/i,
  /\bnext[\s-]?level\b/i,
  /\brevolutionary\b/i,
  /\bunleash\b/i,
  /\belevate your\b/i,
  /\btake it to the next level\b/i,
  /\bworld[\s-]?class\b/i
];

// CJK scripts (Chinese/Japanese/Korean) are written without spaces, so the
// Latin space-delimited word count collapses a natural line like "买之前先搜小红书"
// to a single "word" and fails the 3-8 gate. Measure CJK hooklines by character
// instead: count each CJK character as one unit plus any space-delimited Latin
// runs (e.g. "AI", "Pro", "2x"), and apply a CJK-appropriate range. Latin
// hooklines keep the original space-delimited behavior.
const CJK_CHAR = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/u;
const CJK_CHAR_GLOBAL = new RegExp(CJK_CHAR.source, "gu");

export const HOOK_LINE_LIMITS = {
  latin: { min: 3, max: 8, unit: "words" },
  cjk: { min: 4, max: 14, unit: "characters" }
};

export function hookLineLength(value) {
  const text = String(value).trim();
  const cjkMatches = text.match(CJK_CHAR_GLOBAL) ?? [];
  if (cjkMatches.length === 0) {
    return { mode: "latin", units: text.split(/\s+/).filter(Boolean).length };
  }
  // Strip the CJK characters (each already counted) and treat any remaining
  // runs as Latin units, so mixed-script hooks like "AI 助手 Pro" still measure
  // sanely instead of being scored as one giant token.
  const latinTokens = text.replace(CJK_CHAR_GLOBAL, " ").split(/\s+/).filter(Boolean);
  return { mode: "cjk", units: cjkMatches.length + latinTokens.length };
}

const arcEqual = (a, b) =>
  Array.isArray(a) &&
  Array.isArray(b) &&
  a.length === b.length &&
  a.every((value, index) => String(value) === String(b[index]));

export function validateConcepts(data, opts = {}) {
  const errors = [];
  const warnings = [];
  const minConcepts = opts.minConcepts ?? 3;
  const maxConcepts = opts.maxConcepts ?? 6;
  const minTotal = opts.minTotal ?? 24;

  if (!data || typeof data !== "object") {
    return { errors: ["concepts artifact must be a JSON object"], warnings };
  }
  const defaultArc = Array.isArray(data.defaultArc) ? data.defaultArc : DEFAULT_ARC;
  if (!data.schemaVersion) {
    errors.push("missing schemaVersion");
  }

  const concepts = data.concepts;
  if (!Array.isArray(concepts)) {
    return { errors: [...errors, "concepts must be an array"], warnings };
  }
  if (concepts.length < minConcepts) {
    errors.push(`need at least ${minConcepts} scored concepts before building (found ${concepts.length})`);
  }
  if (concepts.length > maxConcepts) {
    warnings.push(`more than ${maxConcepts} concepts; score and trim before building`);
  }

  const ids = new Set();
  const hookCounts = new Map();
  const declaredStructures = [];

  for (const [index, concept] of concepts.entries()) {
    const where = concept?.id ? `concept "${concept.id}"` : `concept #${index + 1}`;
    if (!concept || typeof concept !== "object") {
      errors.push(`${where} must be an object`);
      continue;
    }
    if (!concept.id) {
      errors.push(`${where} missing id`);
    } else if (ids.has(concept.id)) {
      errors.push(`duplicate concept id "${concept.id}"`);
    } else {
      ids.add(concept.id);
    }

    for (const field of ["angle", "insight", "hookLine", "firstFrame", "motionIdea", "proof", "cta"]) {
      if (!concept[field] || !String(concept[field]).trim()) {
        errors.push(`${where} missing ${field}`);
      }
    }

    if (concept.hookLine) {
      const { mode, units } = hookLineLength(concept.hookLine);
      const { min, max, unit } = HOOK_LINE_LIMITS[mode];
      if (units < min || units > max) {
        errors.push(`${where} hookLine must be ${min}-${max} ${unit} (found ${units})`);
      }
      const key = String(concept.hookLine).trim().toLowerCase();
      hookCounts.set(key, (hookCounts.get(key) ?? 0) + 1);
    }

    for (const text of [concept.hookLine, concept.angle, concept.label].filter(Boolean)) {
      for (const pattern of CLICHE_PATTERNS) {
        if (pattern.test(text)) {
          errors.push(`${where} uses banned cliche copy: "${text}"`);
          break;
        }
      }
    }

    if (!Array.isArray(concept.structure) || concept.structure.length < 3) {
      errors.push(`${where} must declare a structure of at least 3 scene blocks`);
    } else {
      declaredStructures.push(concept.structure);
    }

    if (!concept.scores || typeof concept.scores !== "object") {
      errors.push(`${where} missing scores`);
    } else {
      for (const dimension of SCORE_DIMENSIONS) {
        const value = concept.scores[dimension];
        if (!Number.isInteger(value) || value < 1 || value > 5) {
          errors.push(`${where} score.${dimension} must be an integer 1-5`);
        }
      }
    }
  }

  for (const [hook, count] of hookCounts) {
    if (count > 1) {
      errors.push(`hookLine "${hook}" is reused by ${count} concepts; concepts must diverge`);
    }
  }

  // Structural diversity: real alternatives must not collapse to one arc.
  const distinctStructures = new Set(declaredStructures.map((structure) => JSON.stringify(structure)));
  if (declaredStructures.length >= 2 && distinctStructures.size < 2) {
    errors.push("all concepts share one structure; vary the arc so concepts are genuine alternatives");
  }

  // Chosen concept + ship gate.
  if (!data.chosenId) {
    errors.push("missing chosenId");
    return { errors, warnings };
  }
  const chosen = concepts.find((concept) => concept?.id === data.chosenId);
  if (!chosen) {
    errors.push(`chosenId "${data.chosenId}" does not match any concept`);
    return { errors, warnings };
  }
  if (!data.selectionNote || !String(data.selectionNote).trim()) {
    warnings.push("no selectionNote explaining why the chosen concept won");
  }

  const scores = chosen.scores ?? {};
  for (const dimension of ["attention", "distinctiveness", "claimSafety"]) {
    const value = scores[dimension];
    if (Number.isInteger(value) && value < 3) {
      errors.push(`chosen concept "${chosen.id}" scores ${dimension}=${value} (<3); pick or revise a stronger concept`);
    }
  }
  const total = SCORE_DIMENSIONS.reduce(
    (sum, dimension) => sum + (Number.isInteger(scores[dimension]) ? scores[dimension] : 0),
    0
  );
  if (total < minTotal) {
    warnings.push(`chosen concept total ${total}/${SCORE_DIMENSIONS.length * 5} is below ${minTotal}; consider a stronger angle`);
  }

  // Anti-template-collapse: the shipped ad must not silently default to the
  // stock arc unless the author explicitly justifies it.
  if (Array.isArray(chosen.structure) && arcEqual(chosen.structure, defaultArc) && !chosen.forceDefaultReason) {
    errors.push(`chosen concept "${chosen.id}" reuses the default arc [${defaultArc.join(", ")}]; pick a distinct structure or set forceDefaultReason`);
  }

  return { errors, warnings };
}

const invokedDirectly = (() => {
  try {
    return import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;
  } catch {
    return false;
  }
})();

if (invokedDirectly) {
  const args = process.argv.slice(2);
  const path = args.find((arg) => !arg.startsWith("--"));
  if (!path) {
    console.error("usage: node scripts/validate-creative.mjs <concepts.json> [--min N] [--min-total N]");
    process.exit(2);
  }
  const opts = {};
  const minIndex = args.indexOf("--min");
  if (minIndex >= 0) {
    opts.minConcepts = Number(args[minIndex + 1]);
  }
  const minTotalIndex = args.indexOf("--min-total");
  if (minTotalIndex >= 0) {
    opts.minTotal = Number(args[minTotalIndex + 1]);
  }

  let data;
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    console.error(`FAIL cannot read concepts artifact ${path}: ${error.message}`);
    process.exit(1);
  }

  const { errors, warnings } = validateConcepts(data, opts);
  for (const warning of warnings) {
    console.warn(`WARN ${warning}`);
  }
  for (const error of errors) {
    console.error(`FAIL ${error}`);
  }
  if (errors.length) {
    console.error(`FAIL creative concept gate: ${errors.length} issue(s) in ${path}`);
    process.exit(1);
  }
  console.log(`PASS creative concept gate: ${data.concepts.length} concepts, chosen "${data.chosenId}"`);
}
