import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

export function makeTempDir(prefix = "fathom-test-") {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

export function makeGitRepo(commits) {
  const dir = makeTempDir("fathom-git-");
  const git = (args) =>
    execFileSync("git", args, { cwd: dir, stdio: "ignore" });
  git(["init", "-q"]);
  git(["config", "user.name", "Test User"]);
  git(["config", "user.email", "test@example.com"]);
  write(path.join(dir, "README.md"), "# Test\n");
  git(["add", "-A"]);
  git(["commit", "-q", "-m", commits[0].message]);
  if (commits[0].tag) git(["tag", commits[0].tag]);
  for (const commit of commits.slice(1)) {
    if (commit.files) {
      for (const [file, content] of Object.entries(commit.files)) {
        write(path.join(dir, file), content);
      }
      git(["add", "-A"]);
    }
    git(["commit", "-q", "--allow-empty", "-m", commit.message]);
    if (commit.tag) git(["tag", commit.tag]);
  }
  return dir;
}

export function removeDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}
