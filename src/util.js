import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Minimal, dependency-free console output with ANSI colors.
 */
export const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
};

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;

export function paint(inner, code) {
  return useColor ? `${colors[code] ?? ""}${inner}${colors.reset}` : inner;
}

export function dim(s) {
  return paint(s, "dim");
}
export function bold(s) {
  return paint(s, "bold");
}
export function green(s) {
  return paint(s, "green");
}
export function red(s) {
  return paint(s, "red");
}
export function cyan(s) {
  return paint(s, "cyan");
}
export function yellow(s) {
  return paint(s, "yellow");
}
export function magenta(s) {
  return paint(s, "magenta");
}

export function log(msg = "") {
  process.stdout.write(`${msg}\n`);
}

export function error(msg) {
  process.stderr.write(`${red("error")}: ${msg}\n`);
}

export function warn(msg) {
  process.stderr.write(`${yellow("warn")}: ${msg}\n`);
}

export function success(msg) {
  process.stdout.write(`${green("✓")} ${msg}\n`);
}

export function info(msg) {
  process.stdout.write(`${cyan("•")} ${msg}\n`);
}

/** Pretty-print a value (for logs). */
export function inspect(value) {
  return JSON.stringify(value, null, 2);
}

/**
 * Recursively collect files under `root`, skipping common junk dirs and the
 * optional exclusion set. Yields absolute paths.
 */
export function walkFiles(root, opts = {}) {
  const {
    exclude = [],
    include = null,
    maxDepth = 50,
  } = opts;
  const excludeSet = new Set(
    [
      ".git",
      "node_modules",
      ".hg",
      ".svn",
      ".cache",
      "__pycache__",
      ".venv",
      "venv",
      ".next",
      ".nuxt",
      "build",
      "dist",
      "fathom-dist",
      "coverage",
      ".tox",
      ".fathom",
      "vendor",
      "target",
      ".turbo",
      ".idea",
      ".vscode",
      ...exclude,
    ]
  );
  const results = [];

  function walk(absDir, depth) {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = fs.readdirSync(absDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith(".") && entry.name !== ".gitignore") {
        // Skip hidden dirs/files (except gitignores we might care about).
        continue;
      }
      const abs = path.join(absDir, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (excludeSet.has(entry.name)) continue;
        walk(abs, depth + 1);
      } else if (entry.isFile()) {
        if (include && !include.test(entry.name)) continue;
        results.push(abs);
      }
    }
  }

  walk(root, 0);
  return results;
}

export function readIfExists(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

export function writeFile(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

export function rimraf(target) {
  target = path.resolve(target);
  if (!target || target === "/" || target === process.cwd()) {
    throw new Error(`Refusing to remove unsafe path: ${target}`);
  }
  fs.rmSync(target, { recursive: true, force: true });
}

export function fileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function isUrl(value) {
  return /^https?:\/\//i.test(value);
}

export function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Read a JSON file, returning null on parse/read failure. */
export function readJson(file) {
  const raw = readIfExists(file);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return { __parseError: err.message, __raw: raw };
  }
}

/** Resolve a module root directory (used by dev tooling). */
export function moduleDir() {
  return __dirname;
}

export function isoNow() {
  return new Date().toISOString();
}

/** Capitalise a word. */
export function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
