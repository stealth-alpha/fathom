import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import { buildDocsSite } from "../src/docs.js";
import { makeTempDir, write, removeDir } from "../test-support/helpers.js";

test("buildDocsSite generates a full static site", () => {
  const dir = makeTempDir("fathom-docs-");
  try {
    write(path.join(dir, "README.md"), "# My Project\n\nHello world.\n\n## Features\n\n- a\n- b\n");
    write(path.join(dir, "docs", "guide.md"), "# Guide\n\nStep one.\n");
    write(path.join(dir, "src", "index.js"), "export function hello() {}\nexport class Greeter {}\n");
    write(path.join(dir, "package.json"), JSON.stringify({ name: "my-project" }));

    const out = path.join(dir, "out");
    const result = buildDocsSite({
      cwd: dir,
      config: { name: "my-project", docs: { theme: "dark" }, source: ["."] },
      outDir: out,
      extras: {},
    });

    assert.ok(fs.existsSync(path.join(out, "index.html")));
    assert.ok(fs.existsSync(path.join(out, "api.html")));
    assert.ok(fs.existsSync(path.join(out, "files.html")));
    assert.ok(fs.existsSync(path.join(out, "docs-guide.html")));
    assert.ok(fs.existsSync(path.join(out, "assets", "style.css")));
    assert.ok(fs.existsSync(path.join(out, "assets", "app.js")));

    const index = fs.readFileSync(path.join(out, "index.html"), "utf8");
    assert.match(index, /My Project/);
    assert.match(index, /Hello world/);

    const api = fs.readFileSync(path.join(out, "api.html"), "utf8");
    assert.match(api, /hello/);
    assert.match(api, /Greeter/);
    assert.ok(result.pages.includes("api"));
  } finally {
    removeDir(dir);
  }
});
