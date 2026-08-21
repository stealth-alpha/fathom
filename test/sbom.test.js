import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildSbom } from "../src/sbom.js";
import { formatSpdx, formatLicensesMarkdown } from "../src/sbom-format.js";
import { makeTempDir, write, removeDir } from "../test-support/helpers.js";

function makeProject() {
  const dir = makeTempDir("fathom-sbom-");
  write(
    path.join(dir, "package.json"),
    JSON.stringify({
      name: "test-app",
      version: "1.0.0",
      dependencies: { lodash: "^4.17.21", "gpl-helper": "^1.0.0" },
      devDependencies: { vitest: "^2.0.0" },
    })
  );
  write(
    path.join(dir, "node_modules", "lodash", "package.json"),
    JSON.stringify({ name: "lodash", version: "4.17.21", license: "MIT" })
  );
  write(
    path.join(dir, "node_modules", "gpl-helper", "package.json"),
    JSON.stringify({ name: "gpl-helper", version: "1.2.0", license: "GPL-3.0" })
  );
  write(
    path.join(dir, "node_modules", "vitest", "package.json"),
    JSON.stringify({ name: "vitest", version: "2.1.8", license: "MIT" })
  );
  return dir;
}

test("buildSbom produces a CycloneDX document", () => {
  const dir = makeProject();
  try {
    const bom = buildSbom(dir, { name: "test-app", sbom: { policy: {} } });
    assert.equal(bom.bomFormat, "CycloneDX");
    assert.equal(bom.specVersion, "1.5");
    assert.ok(Array.isArray(bom.components));
    assert.equal(bom.components.length, 3);
    const lodash = bom.components.find((c) => c.name === "lodash");
    assert.equal(lodash.version, "4.17.21");
    assert.equal(lodash.purl, "pkg:npm/lodash@4.17.21");
    assert.equal(lodash.scope, "required");
    assert.equal(lodash.licenses[0].license.id, "MIT");
    const vitest = bom.components.find((c) => c.name === "vitest");
    assert.equal(vitest.scope, "excluded");
  } finally {
    removeDir(dir);
  }
});

test("buildSbom flags blocked licenses according to policy", () => {
  const dir = makeProject();
  try {
    const bom = buildSbom(dir, {
      name: "test-app",
      sbom: {
        policy: { blockLicenses: ["GPL-3.0"], warnLicenses: [] },
      },
    });
    const violations = bom.summary.violations.filter((v) => v.component === "gpl-helper");
    assert.equal(violations.length, 1);
    assert.equal(violations[0].severity, "block");
  } finally {
    removeDir(dir);
  }
});

test("spdx and markdown formats render", () => {
  const dir = makeProject();
  try {
    const bom = buildSbom(dir, { name: "test-app", sbom: { policy: {} } });
    const spdx = formatSpdx(bom);
    assert.match(spdx, /SPDXVersion: SPDX-2.3/);
    assert.match(spdx, /PackageName: lodash/);
    const md = formatLicensesMarkdown(bom, {});
    assert.match(md, /# Dependency & License Report/);
    assert.match(md, /lodash/);
  } finally {
    removeDir(dir);
  }
});
