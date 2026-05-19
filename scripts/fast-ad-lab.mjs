#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const templateDir = join(root, "skills", "remotion-ad-video", "assets", "remotion-template");
const labDir = join(root, "examples", "ad-lab");

const usage = () => {
  console.error(`Usage:
  node scripts/fast-ad-lab.mjs prepare [--from examples/example-ad]
  node scripts/fast-ad-lab.mjs stage <example-dir>
  node scripts/fast-ad-lab.mjs stills <example-dir> [--frames 30,150,285,390] [--scale 0.5]
  node scripts/fast-ad-lab.mjs preview <example-dir> [--scale 0.35] [--crf 30]
  node scripts/fast-ad-lab.mjs render <example-dir> [--scale 0.5] [--crf 24]
  node scripts/fast-ad-lab.mjs final <example-dir> [--scale 1] [--crf 18]

The lab reuses one Remotion runtime under examples/ad-lab. Use stills, then preview,
then half-size render for review. Use final only for approved production output.`);
  process.exit(1);
};

const parseOption = (args, name, fallback) => {
  const index = args.indexOf(name);
  if (index === -1) {
    return fallback;
  }
  return args[index + 1] ?? fallback;
};

const run = (cmd, args, cwd) => {
  const result = spawnSync(cmd, args, { cwd, encoding: "utf8", stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const copyFiltered = (from, to) => {
  cpSync(from, to, {
    recursive: true,
    filter: (source) => {
      const name = source.split("/").pop();
      return name !== "node_modules" && name !== "out" && name !== ".cache";
    }
  });
};

const findReusableNodeModules = (preferredExample) => {
  const candidates = [
    preferredExample ? resolve(root, preferredExample) : null,
    join(root, "examples", "reachapi-ad"),
    join(root, "examples", "tiktok-ad"),
    join(root, "examples", "candy-crush-ad"),
    join(root, "examples", "openclaw-ad")
  ].filter(Boolean);

  return candidates
    .map((dir) => join(dir, "node_modules"))
    .find((dir) => existsSync(dir));
};

const prepareLab = (preferredExample) => {
  mkdirSync(labDir, { recursive: true });

  for (const file of ["package.json", "tsconfig.json", "README.md"]) {
    const target = join(labDir, file);
    if (!existsSync(target)) {
      cpSync(join(templateDir, file), target);
    }
  }

  const packagePath = join(labDir, "package.json");
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  packageJson.name = "remotion-ad-lab";
  packageJson.private = true;
  writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

  const nodeModules = join(labDir, "node_modules");
  if (!existsSync(nodeModules)) {
    const reusable = findReusableNodeModules(preferredExample);
    if (reusable) {
      symlinkSync(reusable, nodeModules, "dir");
      console.log(`Linked ${relative(root, nodeModules)} -> ${relative(root, reusable)}`);
    } else {
      console.log("No reusable node_modules found. Run `npm install` in examples/ad-lab once.");
    }
  }

  mkdirSync(join(labDir, "src"), { recursive: true });
  mkdirSync(join(labDir, "public"), { recursive: true });
  console.log(`Prepared ${relative(root, labDir)}`);
};

const importLabPackage = async (packageName) => {
  const requireFromLab = createRequire(join(labDir, "package.json"));
  return import(requireFromLab.resolve(packageName));
};

const stageExample = (exampleArg) => {
  if (!exampleArg) {
    usage();
  }
  const exampleDir = resolve(root, exampleArg);
  if (!existsSync(join(exampleDir, "src", "index.tsx"))) {
    console.error(`Missing Remotion source in ${exampleArg}`);
    process.exit(1);
  }

  prepareLab(exampleArg);
  rmSync(join(labDir, "src"), { force: true, recursive: true });
  rmSync(join(labDir, "public"), { force: true, recursive: true });
  copyFiltered(join(exampleDir, "src"), join(labDir, "src"));
  if (existsSync(join(exampleDir, "public"))) {
    copyFiltered(join(exampleDir, "public"), join(labDir, "public"));
  } else {
    mkdirSync(join(labDir, "public"), { recursive: true });
  }
  mkdirSync(join(exampleDir, "out", "draft"), { recursive: true });
  writeFileSync(
    join(labDir, ".ad-lab-source.json"),
    `${JSON.stringify({ sourceExample: exampleDir, stagedAt: new Date().toISOString() }, null, 2)}\n`
  );
  console.log(`Staged ${relative(root, exampleDir)} into ${relative(root, labDir)}`);
  return exampleDir;
};

const parseFrames = (value) => {
  const frames = value
    .split(",")
    .map((frame) => Number(frame.trim()))
    .filter((frame) => Number.isInteger(frame) && frame >= 0);
  return [...new Set(frames)];
};

const renderStills = async (exampleArg, args) => {
  const exampleDir = stageExample(exampleArg);
  const frames = parseFrames(parseOption(args, "--frames", "30,150,285,390"));
  const scale = parseOption(args, "--scale", "0.5");
  const scaleNumber = Number(scale);
  if (!frames.length) {
    console.error("No valid frames supplied. Use --frames 30,150,285,390.");
    process.exit(1);
  }
  if (!Number.isFinite(scaleNumber) || scaleNumber <= 0) {
    console.error(`Invalid --scale value: ${scale}`);
    process.exit(1);
  }

  let bundle;
  let renderFrames;
  let selectComposition;
  try {
    ({ bundle } = await importLabPackage("@remotion/bundler"));
    ({ renderFrames, selectComposition } = await importLabPackage("@remotion/renderer"));
  } catch (error) {
    console.error(`Unable to load Remotion renderer from examples/ad-lab: ${error.message}`);
    console.error("Run `npm install` in examples/ad-lab or stage an example with reusable node_modules first.");
    process.exit(1);
  }

  const inputProps = JSON.parse(readFileSync(join(labDir, "src", "default-props.json"), "utf8"));
  const entryPoint = join(labDir, "src", "index.tsx");
  let lastProgress = -1;
  console.log(`Bundling Remotion once for ${frames.length} still frame(s)...`);
  const serveUrl = await bundle({
    entryPoint,
    rootDir: labDir,
    publicDir: join(labDir, "public"),
    ignoreRegisterRootWarning: false,
    onProgress: (progress) => {
      const normalized = progress <= 1 ? progress * 100 : progress;
      const rounded = Math.min(100, Math.floor(normalized));
      if (rounded >= lastProgress + 25 || rounded === 100) {
        lastProgress = rounded;
        console.log(`Bundle progress: ${rounded}%`);
      }
    },
  });
  const composition = await selectComposition({
    serveUrl,
    id: "AdVideo",
    inputProps,
    logLevel: "warn",
  });

  for (const frame of frames) {
    const output = join(exampleDir, "out", "draft", `frame-${frame}-scale-${scale}.png`);
    let wroteFrame = false;
    await renderFrames({
      serveUrl,
      composition,
      inputProps,
      outputDir: null,
      imageFormat: "png",
      frameRange: frame,
      scale: scaleNumber,
      concurrency: "50%",
      logLevel: "warn",
      onStart: () => {
        console.log(`Rendering still frame ${frame} -> ${relative(root, output)}`);
      },
      onFrameUpdate: () => {},
      onFrameBuffer: (buffer) => {
        writeFileSync(output, buffer);
        wroteFrame = true;
      },
    });
    if (!wroteFrame) {
      console.error(`Failed to write still frame ${frame}`);
      process.exit(1);
    }
  }
};

const renderVideo = (exampleArg, args, mode) => {
  const exampleDir = stageExample(exampleArg);
  const scale = parseOption(args, "--scale", mode === "preview" ? "0.35" : mode === "final" ? "1" : "0.5");
  const crf = parseOption(args, "--crf", mode === "preview" ? "30" : mode === "final" ? "18" : "24");
  const outputName = parseOption(args, "--output", mode === "preview" ? "preview.mp4" : mode === "final" ? "ad-video-final.mp4" : "ad-video.mp4");
  const output = join(exampleDir, "out", outputName);
  const renderArgs = [
    "remotion",
    "render",
    "src/index.tsx",
    "AdVideo",
    output,
    "--props=src/default-props.json",
    `--crf=${crf}`
  ];
  if (scale !== "1") {
    renderArgs.push(`--scale=${scale}`);
  }
  run("npx", renderArgs, labDir);
};

const [command, exampleArg, ...rest] = process.argv.slice(2);

try {
  if (command === "prepare") {
    prepareLab(parseOption([exampleArg, ...rest].filter(Boolean), "--from", undefined));
  } else if (command === "stage") {
    stageExample(exampleArg);
  } else if (command === "stills") {
    await renderStills(exampleArg, rest);
  } else if (command === "preview") {
    renderVideo(exampleArg, rest, "preview");
  } else if (command === "render") {
    renderVideo(exampleArg, rest, "render");
  } else if (command === "final") {
    renderVideo(exampleArg, rest, "final");
  } else {
    usage();
  }
} catch (error) {
  console.error(error?.stack || error?.message || String(error));
  process.exit(1);
}
