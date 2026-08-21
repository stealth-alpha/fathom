import { execFileSync } from "node:child_process";

const RECORD_SEP = "\x1e";
const FIELD_SEP = "\x1f";

export function isGitRepo(cwd = process.cwd()) {
  try {
    execFileSync("git", ["rev-parse", "--is-inside-work-tree"], {
      cwd,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function runGit(args, cwd) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

/**
 * Parse the `git log` output into structured commit objects.
 * Fields: hash, short, author, email, date (ISO), subject, body.
 */
export function parseLog(rawLog) {
  const commits = [];
  const records = rawLog.split(RECORD_SEP);
  for (const record of records) {
    if (!record.trim()) continue;
    const fields = record.split(FIELD_SEP);
    if (fields.length < 7) continue;
    const [hash, short, author, email, date, subject, ...bodyParts] = fields;
    const body = bodyParts.join(FIELD_SEP).trim();
    commits.push({
      hash: hash.trim(),
      short: short.trim(),
      author: author.trim(),
      email: email.trim(),
      date: date.trim(),
      subject: subject.trim(),
      body,
    });
  }
  return commits;
}

/**
 * Get commit history. `range` may be "a..b", a single ref, or null for all.
 * We exclude merges by default and cap the count.
 */
export function getCommits({
  cwd = process.cwd(),
  range = null,
  count = 2000,
  firstParent = false,
  includeMerges = false,
} = {}) {
  const args = ["log", "--date=iso-strict"];
  if (firstParent) args.push("--first-parent");
  if (!includeMerges && !range) args.push("--no-merges");
  args.push(
    "--pretty=format:%H" +
      FIELD_SEP +
      "%h" +
      FIELD_SEP +
      "%an" +
      FIELD_SEP +
      "%ae" +
      FIELD_SEP +
      "%aI" +
      FIELD_SEP +
      "%s" +
      FIELD_SEP +
      "%b" +
      RECORD_SEP
  );
  if (range) args.push(range);
  args.push("-n", String(count));
  const raw = runGit(args, cwd);
  return parseLog(raw);
}

export function getCurrentBranch(cwd = process.cwd()) {
  try {
    return runGit(
      ["rev-parse", "--abbrev-ref", "HEAD"],
      cwd
    ).trim();
  } catch {
    return "HEAD";
  }
}

export function getProjectName(cwd = process.cwd()) {
  try {
    return pathBasename(cwd);
  } catch {
    return "project";
  }
}

import path from "node:path";
const pathBasename = (p) => path.basename(p);

export function getLatestTag(cwd = process.cwd()) {
  try {
    return runGit(
      ["describe", "--tags", "--abbrev=0", "--always"],
      cwd
    ).trim();
  } catch {
    return null;
  }
}

export function getVersion(cwd = process.cwd()) {
  const tag = getLatestTag(cwd);
  return tag && /^v?\d+\.\d+\.\d+/.test(tag) ? tag.replace(/^v/, "") : null;
}

export function getRemoteUrl(cwd = process.cwd()) {
  try {
    return runGit(
      ["config", "--get", "remote.origin.url"],
      cwd
    ).trim();
  } catch {
    return null;
  }
}

export function getAuthors(cwd = process.cwd(), { limit = 20 } = {}) {
  try {
    const raw = runGit(
      [
        "shortlog",
        "-sne",
        "--all",
        "--no-merges",
        "-n",
      ],
      cwd
    );
    return raw
      .split("\n")
      .slice(0, limit)
      .map((line) => {
        const match = line.match(/^\s*\d+\s+(.*?)\s*<([^>]+)>$/);
        if (!match) return null;
        return { name: match[1], email: match[2] };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function getDiffStat({
  cwd = process.cwd(),
  range = null,
} = {}) {
  try {
    const base = range || "HEAD~1..HEAD";
    const raw = runGit(["diff", "--numstat", base], cwd);
    return raw
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [added, deleted, file] = line.split("\t");
        return {
          file,
          added: Number(added) || 0,
          deleted: Number(deleted) || 0,
        };
      });
  } catch {
    return [];
  }
}
