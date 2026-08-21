import path from "node:path";
import fs from "node:fs";
import { readJson } from "./util.js";

const CONFIG_NAME = "fathom.config.json";

export const DEFAULT_CONFIG = {
  name: null,
  version: null,
  changelog: {
    file: "CHANGELOG.md",
    format: "md",
    unreleased: true,
    groups: {
      feat: "Features",
      fix: "Bug Fixes",
      docs: "Documentation",
      style: "Styling",
      refactor: "Refactoring",
      perf: "Performance",
      test: "Tests",
      build: "Build System",
      ci: "Continuous Integration",
      chore: "Miscellaneous",
      revert: "Reverts",
      breaking: "Breaking Changes",
    },
  },
  sbom: {
    formats: ["cyclonedx", "md"],
    policy: {
      blockLicenses: ["GPL-3.0", "AGPL-3.0"],
      warnLicenses: ["GPL-2.0", "MPL-2.0", "EUPL-1.2"],
    },
  },
  docs: {
    title: null,
    theme: "dark",
    primary: "#6366f1",
    source: ["."],
    exclude: [],
    include: null,
  },
  build: {
    output: "fathom-dist",
  },
};

function deepMerge(base, overrides) {
  if (!overrides || typeof overrides !== "object") return base;
  for (const key of Object.keys(overrides)) {
    if (overrides[key] === undefined) continue;
    const bv = base[key];
    const ov = overrides[key];
    if (
      bv &&
      typeof bv === "object" &&
      !Array.isArray(bv) &&
      ov &&
      typeof ov === "object" &&
      !Array.isArray(ov)
    ) {
      base[key] = deepMerge({ ...bv }, ov);
    } else {
      base[key] = ov;
    }
  }
  return base;
}

/**
 * Load and normalise the Fathom config for a project root. Returns a fully
 * merged config object or null if the project has no config (init).
 */
export function loadConfig(cwd = process.cwd()) {
  const file = path.join(cwd, CONFIG_NAME);
  const raw = readJson(file);
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const config = deepMerge(JSON.parse(JSON.stringify(DEFAULT_CONFIG)), raw);
  return { ...config, __configPath: file };
}

export function configExists(cwd = process.cwd()) {
  return fs.existsSync(path.join(cwd, CONFIG_NAME));
}

export function configFileName() {
  return CONFIG_NAME;
}

/** Small validation to keep configs predictable. */
export function validateConfig(config) {
  const errors = [];
  const allowedThemes = ["dark", "light"];
  if (config.docs && !allowedThemes.includes(config.docs.theme)) {
    errors.push(`docs.theme must be one of: ${allowedThemes.join(", ")}`);
  }
  if (
    config.docs &&
    config.docs.primary &&
    !/^#[0-9a-fA-F]{6}$/.test(config.docs.primary)
  ) {
    errors.push("docs.primary must be a hex color like #6366f1");
  }
  return errors;
}
