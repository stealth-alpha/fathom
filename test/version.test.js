import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

import { VERSION } from "../src/version.js";

const PKG = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url), "utf8")
);
const BIN = fileURLToPath(new URL("../bin/fathom.js", import.meta.url));

function run(args) {
  return execFileSync("node", ["--no-warnings", BIN, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

test("version: src/version.js matches package.json", () => {
  assert.equal(VERSION, PKG.version);
});

test("version: CLI 'version' command reports the package.json version", () => {
  const out = run(["version"]);
  assert.ok(
    out.includes(PKG.version),
    `expected CLI to include ${PKG.version}, got: ${out.trim()}`
  );
});

test("version: --version flag reports the package.json version", () => {
  const out = run(["--version"]);
  assert.ok(out.includes(PKG.version));
});
