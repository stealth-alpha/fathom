import path from "node:path";
import { randomUUID } from "node:crypto";
import { readIfExists, readJson, writeFile } from "./util.js";
import { formatSpdx, formatLicensesMarkdown } from "./sbom-format.js";
import { VERSION } from "./version.js";

/**
 * Supply-chain inventory: discover dependency manifests, enrich each component
 * with a version and (best-effort) license, and run a basic licensing policy.
 */

const SPDX_IDS = [
  "MIT",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "GPL-2.0",
  "GPL-2.0-only",
  "GPL-3.0",
  "GPL-3.0-only",
  "LGPL-2.1",
  "LGPL-3.0",
  "AGPL-3.0",
  "AGPL-3.0-only",
  "MPL-2.0",
  "EPL-2.0",
  "Unlicense",
  "CC0-1.0",
  "0BSD",
  "Zlib",
  "MIT-0",
  "Python-2.0",
  "PSF-2.0",
  "BSD-3-Clause-Attribution",
  "EUPL-1.2",
  "WTFPL",
  "BSL-1.0",
  "Artistic-2.0",
];

function normalizeLicense(input) {
  if (!input) return "UNKNOWN";
  const text = String(input).trim();
  const clean = text.replace(/\s+/g, " ").trim();
  const upper = clean.toUpperCase();
  for (const id of SPDX_IDS) {
    if (upper.includes(id.toUpperCase())) return id;
  }
  // Single string like "MIT" or object shorthand.
  if (/^[\w.-]+$/.test(clean)) return clean;
  return clean;
}

function purlFor(name, version, type) {
  const npm = type === "npm";
  const escapedName = name.startsWith("@")
    ? `${name.slice(1).replace("@", "/")}`
    : name;
  // Package URL: pkg:npm/name@version (scope kept as-is).
  const slug = npm ? name : name.replace(/[^A-Za-z0-9._-]/g, "-");
  return `pkg:${type}/${slug}@${version || ""}`;
}

function readNodeVersion(cwd, name) {
  const pkgPath = path.join(cwd, "node_modules", ...name.split("/"), "package.json");
  const pkg = readJson(pkgPath);
  if (!pkg) return { version: null, license: null };
  let license = pkg.license || pkg.licenses;
  if (Array.isArray(license)) license = license.map((l) => l.type || l).join(" OR ");
  return { version: pkg.version || null, license: normalizeLicense(license) };
}

function parsePackageJson(cwd) {
  const file = path.join(cwd, "package.json");
  const pkg = readJson(file);
  if (!pkg) return [];
  const deps = {
    ...(pkg.dependencies || {}),
    ...(pkg.optionalDependencies || {}),
  };
  const devDeps = pkg.devDependencies || {};
  const out = [];
  for (const [name, range] of Object.entries(deps)) {
    const resolved = readNodeVersion(cwd, name);
    out.push({
      name,
      version: resolved.version || range,
      requested: range,
      license: resolved.license || "UNKNOWN",
      type: "npm",
      scope: "runtime",
    });
  }
  for (const [name, range] of Object.entries(devDeps)) {
    const resolved = readNodeVersion(cwd, name);
    out.push({
      name,
      version: resolved.version || range,
      requested: range,
      license: resolved.license || "UNKNOWN",
      type: "npm",
      scope: "development",
    });
  }
  return out;
}

function parsePipFile(cwd, file) {
  const raw = readIfExists(file);
  if (!raw) return [];
  const out = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    // requirements.txt style: name==1.0, name>=1.0, extras, -r includes
    if (trimmed.startsWith("-")) continue;
    const match = trimmed.match(
      /^([A-Za-z0-9_.-]+)(?:\[[^\]]+\])?(?:\s*(===|==|~=|>=|<=|>|<)\s*([^\s#]+))?/
    );
    if (!match) continue;
    const name = match[1].replace(/_/g, "-");
    out.push({
      name,
      version: match[3] || null,
      requested: match[3] || "any",
      license: "UNKNOWN",
      type: "pypi",
      scope: "runtime",
    });
  }
  return out;
}

function parseGoMod(cwd) {
  const raw = readIfExists(path.join(cwd, "go.mod"));
  if (!raw) return [];
  const out = [];
  for (const line of raw.split(/\r?\n/)) {
    const m = line.trim().match(/^\s*require(?:\s+\(|.*?\s)?/);
    if (m && line.trim().endsWith("(")) continue;
    const dep = line.trim().match(/^([^\s]+)\s+(v[^\s]+)/);
    if (dep && !line.trim().startsWith("go ")) {
      out.push({
        name: dep[1],
        version: dep[2],
        requested: dep[2],
        license: "UNKNOWN",
        type: "golang",
        scope: "runtime",
      });
    }
  }
  return out;
}

function parseCargo(cwd) {
  const lock = readIfExists(path.join(cwd, "Cargo.lock"));
  if (lock) {
    const out = [];
    const sections = lock.match(/\[\[package\]\]([\s\S]*?)(?=\[\[package\]\]|$)/g) || [];
    for (const section of sections) {
      const name = section.match(/^name\s*=\s*"([^"]+)"/m);
      const version = section.match(/^version\s*=\s*"([^"]+)"/m);
      if (name && version) {
        out.push({
          name: name[1],
          version: version[1],
          requested: version[1],
          license: "UNKNOWN",
          type: "cargo",
          scope: "runtime",
        });
      }
    }
    return out;
  }
  const raw = readIfExists(path.join(cwd, "Cargo.toml"));
  if (!raw) return [];
  const out = [];
  // Simplified: look for `name = "version"` lines.
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_-]+)\s*=\s*"([^"]+)"/);
    if (m && !m[1].startsWith(".")) {
      out.push({
        name: m[1],
        version: m[2],
        requested: m[2],
        license: "UNKNOWN",
        type: "cargo",
        scope: "runtime",
      });
    }
  }
  return out;
}

function parseComposer(cwd) {
  const pkg = readJson(path.join(cwd, "composer.json"));
  if (!pkg) return [];
  const out = [];
  const deps = { ...(pkg.require || {}), ...(pkg["require-dev"] || {}) };
  for (const [name, range] of Object.entries(deps)) {
    if (name === "php") continue;
    out.push({
      name,
      version: range,
      requested: range,
      license: "UNKNOWN",
      type: "composer",
      scope: "runtime",
    });
  }
  return out;
}

function parseGemfile(cwd) {
  const lock = readIfExists(path.join(cwd, "Gemfile.lock"));
  if (!lock) return [];
  const out = [];
  const specs = lock.split("DEPENDENCIES")[0] || "";
  const section = specs.split("GEM")[1] || specs;
  for (const line of section.split(/\r?\n/)) {
    const m = line.match(/^\s{4,}([A-Za-z0-9_.-]+)\s+\(([^)]+)\)/);
    if (m) {
      out.push({
        name: m[1],
        version: m[2],
        requested: m[2],
        license: "UNKNOWN",
        type: "gem",
        scope: "runtime",
      });
    }
  }
  return out;
}

function parsePubspec(cwd) {
  const raw = readIfExists(path.join(cwd, "pubspec.yaml"));
  if (!raw) return [];
  const out = [];
  let section = null;
  for (const line of raw.split(/\r?\n/)) {
    if (/^(dependencies|dev_dependencies):\s*$/.test(line)) {
      section = line.split(":")[0];
      continue;
    }
    const m = line.match(/^  ([a-z0-9_-]+):\s*(.*)$/);
    if (m && section) {
      const version = m[2].replace(/[\^>=<~]/g, "").split(" ")[0] || null;
      out.push({
        name: m[1],
        version,
        requested: m[2],
        license: "UNKNOWN",
        type: "pub",
        scope: section === "dev_dependencies" ? "development" : "runtime",
      });
    }
  }
  return out;
}

function dedupe(list) {
  const map = new Map();
  for (const item of list) {
    const key = `${item.type}:${item.name}`;
    // Prefer a versioned/runtime entry over a dev/unknown one.
    const existing = map.get(key);
    if (
      !existing ||
      (existing.version === null && item.version) ||
      (existing.scope === "development" && item.scope === "runtime")
    ) {
      map.set(key, item);
    }
  }
  return [...map.values()];
}

/**
 * Build an SBOM inventory for the project rooted at `cwd`.
 */
export function buildSbom(cwd = process.cwd(), config = {}) {
  const components = [
    ...parsePackageJson(cwd),
    ...parsePipFile(cwd, path.join(cwd, "requirements.txt")),
    ...parsePipFile(cwd, path.join(cwd, "requirements.in")),
    ...parseGoMod(cwd),
    ...parseCargo(cwd),
    ...parseComposer(cwd),
    ...parseGemfile(cwd),
    ...parsePubspec(cwd),
  ];

  const unique = dedupe(components).map((comp) => ({
    ...comp,
    purl: purlFor(comp.name, comp.version, comp.type),
  }));
  unique.sort((a, b) => a.name.localeCompare(b.name));

  const policy = config?.sbom?.policy || config?.policy || {};
  const block = (policy.blockLicenses || []).map((l) => l.toUpperCase());
  const warnList = (policy.warnLicenses || []).map((l) => l.toUpperCase());
  const violations = [];
  for (const comp of unique) {
    const lic = (comp.license || "UNKNOWN").toUpperCase();
    if (block.some((b) => lic.includes(b))) {
      violations.push({
        severity: "block",
        component: comp.name,
        version: comp.version,
        license: comp.license,
        message: `Copyleft license "${comp.license}" is blocked by policy`,
      });
    } else if (warnList.some((w) => lic.includes(w))) {
      violations.push({
        severity: "warn",
        component: comp.name,
        version: comp.version,
        license: comp.license,
        message: `License "${comp.license}" is flagged by policy`,
      });
    }
  }

  const licenses = [...new Set(unique.map((c) => c.license || "UNKNOWN"))];

  return {
    bomFormat: "CycloneDX",
    specVersion: "1.5",
    version: 1,
    serialNumber: `urn:uuid:${uuidV4()}`,
    metadata: {
      tools: [{ vendor: "fathom", name: "fathom-cli", version: VERSION }],
      component: {
        type: "application",
        name: config.name || path.basename(cwd),
        bomRef: path.basename(cwd),
      },
    },
    components: unique.map((c) => ({
      type: "library",
      name: c.name,
      version: c.version || undefined,
      purl: c.purl,
      scope: c.scope === "development" ? "excluded" : "required",
      licenses: [
        {
          license:
            c.license && c.license !== "UNKNOWN"
              ? { id: c.license }
              : { name: "UNKNOWN" },
        },
      ],
    })),
    summary: {
      components: unique.length,
      licenses,
      violations,
    },
  };
}

function uuidV4() {
  return randomUUID();
}

export function writeSbomFiles(cwd, config, outDir = null) {
  const sbom = buildSbom(cwd, config);
  const output = outDir || path.join(cwd, config.build?.output || "fathom-dist");
  const files = [];
  const formats = config.sbom?.formats || ["cyclonedx", "md"];
  for (const format of formats) {
    if (format === "cyclonedx" || format === "json") {
      const file = path.join(output, "sbom.json");
      writeFile(file, JSON.stringify(sbom, null, 2));
      files.push(file);
    } else if (format === "spdx") {
      const file = path.join(output, "sbom.spdx");
      writeFile(file, formatSpdx(sbom));
      files.push(file);
    } else if (format === "md") {
      const file = path.join(output, "LICENSES.md");
      writeFile(file, formatLicensesMarkdown(sbom, config));
      files.push(file);
    }
  }
  return { sbom, files };
}
