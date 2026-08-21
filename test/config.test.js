import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { loadConfig, validateConfig, configFileName } from "../src/config.js";
import { makeTempDir, write, removeDir } from "../test-support/helpers.js";

test("loadConfig merges defaults with user config", () => {
  const dir = makeTempDir("fathom-cfg-");
  try {
    write(
      path.join(dir, "fathom.config.json"),
      JSON.stringify({ name: "my-app", docs: { theme: "light" } })
    );
    const config = loadConfig(dir);
    assert.equal(config.name, "my-app");
    assert.equal(config.docs.theme, "light");
    assert.equal(config.docs.primary, "#6366f1");
    assert.equal(config.build.output, "fathom-dist");
  } finally {
    removeDir(dir);
  }
});

test("validateConfig flags bad theme", () => {
  const errors = validateConfig({ docs: { theme: "neon", primary: "#6366f1" } });
  assert.ok(errors.some((e) => e.includes("theme")));
});

test("configFileName returns the right name", () => {
  assert.equal(configFileName(), "fathom.config.json");
});
