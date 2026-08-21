import test from "node:test";
import assert from "node:assert/strict";
import { parseCommit, buildChangelog } from "../src/changelog.js";
import { formatChangelogMarkdown, formatChangelogJson } from "../src/changelog-format.js";
import { makeGitRepo, removeDir } from "../test-support/helpers.js";

test("parseCommit classifies conventional commits", () => {
  const commit = {
    hash: "abc123",
    short: "abc123",
    author: "Jane Doe",
    email: "jane@x.dev",
    date: "2026-08-01T00:00:00Z",
    subject: "feat(api): add pagination",
    body: "Closes #42",
  };
  const parsed = parseCommit(commit);
  assert.equal(parsed.type, "feat");
  assert.equal(parsed.scope, "api");
  assert.equal(parsed.groupKey, "feat");
  assert.equal(parsed.group, "Features");
  assert.equal(parsed.description, "add pagination");
  assert.deepEqual(parsed.refs, ["42"]);
  assert.equal(parsed.breaking, false);
});

test("parseCommit detects breaking via ! and BREAKING CHANGE", () => {
  const bang = parseCommit({
    subject: "feat!: rewrite engine",
    body: "",
    hash: "a", short: "a", author: "A", email: "a@a", date: "2026-01-01",
  });
  assert.equal(bang.breaking, true);
  assert.equal(bang.groupKey, "breaking");

  const body = parseCommit({
    subject: "feat: change behavior",
    body: "BREAKING CHANGE: old API removed",
    hash: "b", short: "b", author: "A", email: "a@a", date: "2026-01-01",
  });
  assert.equal(body.breaking, true);
  assert.equal(body.breakingDetail, "old API removed");
});

test("parseCommit falls back for non-conventional commits", () => {
  const parsed = parseCommit({
    subject: "Initial commit",
    body: "",
    hash: "c", short: "c", author: "A", email: "a@a", date: "2026-01-01",
  });
  assert.equal(parsed.groupKey, "chore");
  assert.equal(parsed.group, "Miscellaneous");
  assert.equal(parsed.description, "Initial commit");
});

test("buildChangelog groups a real repo history", () => {
  const dir = makeGitRepo([
    { message: "Initial commit" },
    { message: "feat(auth): add login flow" },
    { message: "fix(api): handle null user" },
    { message: "feat!: rewrite pricing engine", tag: "v1.2.0" },
  ]);
  try {
    const model = buildChangelog({ cwd: dir });
    assert.equal(model.version, "1.2.0");
    assert.ok(model.sections.some((s) => s.group === "Features"));
    assert.ok(model.sections.some((s) => s.group === "Bug Fixes"));
    assert.ok(model.sections.some((s) => s.group === "Breaking Changes"));
    assert.ok(model.sections.some((s) => s.group === "Miscellaneous"));
    assert.equal(model.stats.features, 1);
    assert.equal(model.stats.fixes, 1);
    assert.equal(model.stats.breaking, 1);
  } finally {
    removeDir(dir);
  }
});

test("changelog formats produce expected output", () => {
  const dir = makeGitRepo([
    { message: "feat: initial feature", tag: "v1.0.0" },
  ]);
  try {
    const model = buildChangelog({ cwd: dir });
    const md = formatChangelogMarkdown(model, { date: "2026-08-21" });
    assert.match(md, /## \[1\.0\.0\] - 2026-08-21/);
    assert.match(md, /### Features/);
    assert.match(md, /initial feature/);
    const json = JSON.parse(formatChangelogJson(model));
    assert.equal(json.version, "1.0.0");
    assert.ok(Array.isArray(json.sections));
  } finally {
    removeDir(dir);
  }
});
