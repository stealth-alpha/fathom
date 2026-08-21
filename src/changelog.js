import { getCommits, getVersion, getProjectName } from "./git.js";

const CONVENTIONAL_TYPES = new Set([
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "perf",
  "test",
  "build",
  "ci",
  "chore",
  "revert",
]);

const TYPE_GROUPS = {
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
};

/**
 * Classify a commit into a structured entry.
 */
export function parseCommit(commit, groupMap = TYPE_GROUPS) {
  const { subject, body } = commit;
  const conventional = subject.match(
    /^(?<type>[a-zA-Z]+)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?:\s*(?<desc>.+)$/
  );

  const mergedBody = body || "";
  const breakingFromBody = /BREAKING[ -]CHANGE[:\s]+(.+)$/m.exec(mergedBody);
  const breaking = Boolean(
    (conventional?.groups?.breaking === "!") || breakingFromBody
  );
  const type = conventional?.groups?.type?.toLowerCase() || null;
  const scope = conventional?.groups?.scope || null;
  const description = conventional?.groups?.desc?.trim() || subject;

  const groupKey = breaking
    ? "breaking"
    : type && CONVENTIONAL_TYPES.has(type)
      ? type
      : "chore";
  const group = groupMap[groupKey] || "Miscellaneous";

  // Pull issue / PR references.
  const refs = [];
  const refRegex = /(?:#(\d+)|gh#(\d+)|([A-Za-z]+)-(\d+))/g;
  let m;
  const seen = new Set();
  const feed = `${subject}\n${mergedBody}`;
  while ((m = refRegex.exec(feed)) !== null) {
    const id = m[1] || m[2] || (m[3] && m[4] ? `${m[3]}-${m[4]}` : null);
    if (id && !seen.has(id)) {
      seen.add(id);
      refs.push(id);
    }
  }

  let breakingDetail = null;
  if (breaking) {
    breakingDetail = (breakingFromBody && breakingFromBody[1].trim()) || null;
  }

  return {
    hash: commit.hash,
    short: commit.short,
    author: commit.author,
    email: commit.email,
    date: commit.date,
    type,
    scope,
    breaking,
    breakingDetail,
    description,
    group,
    groupKey,
    refs,
    body: mergedBody,
  };
}

/**
 * Build the changelog data model from git history.
 */
export function buildChangelog({
  cwd = process.cwd(),
  range = null,
  groupMap = TYPE_GROUPS,
  unreleased = true,
  name = null,
} = {}) {
  const commits = getCommits({ cwd, range });
  const entries = commits.map((c) => parseCommit(c, groupMap));

  // Group by release. If unreleased and no range, the head section is "Unreleased".
  const version = getVersion(cwd) || "Unreleased";
  const projectName = name || getProjectName(cwd);

  const grouped = new Map();
  for (const entry of entries) {
    if (!grouped.has(entry.group)) grouped.set(entry.group, []);
    grouped.get(entry.group).push(entry);
  }

  const sections = [];
  for (const [group, items] of grouped) {
    if (items.length === 0) continue;
    sections.push({
      group,
      items: items.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      ),
    });
  }

  // Stable order of groups.
  sections.sort((a, b) => groupRank(a.group) - groupRank(b.group));

  const stats = {
    commits: entries.length,
    features: entries.filter((e) => e.groupKey === "feat").length,
    fixes: entries.filter((e) => e.groupKey === "fix").length,
    breaking: entries.filter((e) => e.breaking).length,
  };

  return {
    name: projectName,
    version,
    range,
    unreleased,
    sections,
    stats,
    commitCount: entries.length,
  };
}

function groupRank(group) {
  const order = [
    "Breaking Changes",
    "Features",
    "Bug Fixes",
    "Performance",
    "Refactoring",
    "Documentation",
    "Tests",
    "Styling",
    "Build System",
    "Continuous Integration",
    "Reverts",
    "Miscellaneous",
  ];
  const idx = order.indexOf(group);
  return idx === -1 ? order.length : idx;
}

/** A short, human summary line for the changelog header. */
export function summarize(model) {
  const bits = [];
  bits.push(`${model.commitCount} commit${model.commitCount === 1 ? "" : "s"}`);
  if (model.stats.features) bits.push(`${model.stats.features} feature`);
  if (model.stats.fixes) bits.push(`${model.stats.fixes} fix`);
  if (model.stats.breaking) bits.push(`${model.stats.breaking} breaking`);
  return bits.join(", ");
}
