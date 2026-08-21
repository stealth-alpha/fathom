import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { buildDocsSite } from "../src/docs.js";
import { buildChangelog } from "../src/changelog.js";
import { buildSbom } from "../src/sbom.js";
import { isGitRepo } from "../src/git.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "dist-docs");

const config = {
  name: "Fathom",
  changelog: { groups: undefined },
  docs: {
    title: "Fathom Docs",
    theme: "dark",
    primary: "#6366f1",
    source: ["."],
  },
  sbom: {
    formats: ["cyclonedx", "md"],
    policy: { blockLicenses: ["GPL-3.0", "AGPL-3.0"], warnLicenses: [] },
  },
  build: { output: "fathom-dist" },
};

const extras = {};
if (isGitRepo(root)) {
  extras.changelog = buildChangelog({ cwd: root, name: config.name });
}
extras.sbom = buildSbom(root, config);

const result = buildDocsSite({ cwd: root, config, outDir, extras });
console.log(`Built Fathom docs site → ${outDir}`);
console.log(
  `${result.pages.length} pages · ${result.files} files · ${result.symbols} symbols`
);
