import { escapeHtml, capitalize } from "./util.js";
import { summarize } from "./changelog.js";

/**
 * Render one issue reference. Numeric refs become GitHub-style `#42`;
 * project-prefixed refs ("GH-7", "JIRA-12") are already link-shaped and
 * must NOT gain a `#` ("#GH-7" renders as broken literal text).
 */
export function formatRef(ref) {
  return /^\d+$/.test(ref) ? `#${ref}` : String(ref);
}

/**
 * Render a changelog model as a Keep-a-Changelog flavoured Markdown string.
 */
export function formatChangelogMarkdown(model, opts = {}) {
  const { header = true, date = new Date() } = opts;
  const lines = [];

  if (header) {
    lines.push("# Changelog", "");
    lines.push(
      "All notable changes to this project will be documented in this file."
    );
    lines.push("");
    lines.push(
      "The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) — and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)."
    );
    lines.push("");
  }

  const isoDate = date instanceof Date ? date.toISOString().slice(0, 10) : date;
  lines.push(`## [${model.version}] - ${isoDate}`);
  lines.push("");
  lines.push(`> ${summarize(model)}`);
  lines.push("");

  for (const section of model.sections) {
    lines.push(`### ${section.group}`, "");
    for (const entry of section.items) {
      const taskLink = entry.refs.length
        ? ` — closes ${entry.refs.map(formatRef).join(", ")}`
        : "";
      const byline = entry.author ? ` by @${entry.author.replace(/\s+/g, "-")}` : "";
      lines.push(`- **${escape(entry.description)}**${byline}${taskLink}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function escape(text) {
  return String(text).replace(/([\[\]])/g, "\\$1");
}

export function formatChangelogJson(model) {
  return JSON.stringify(model, null, 2);
}

/** Render a changelog model as an HTML portfolio snippet. */
export function formatChangelogHtml(model) {
  const sections = model.sections
    .map((section) => {
      const items = section.items
        .map((entry) => {
          const refs = entry.refs.length
            ? `<span class="refs">${entry.refs
                .map((r) => `<code>${escapeHtml(formatRef(r))}</code>`)
                .join(" ")}</span>`
            : "";
          return (
            `<li><span class="bullet">•</span><span class="desc">${escapeHtml(
              entry.description
            )}</span>${refs}<span class="meta">${escapeHtml(
              entry.short
            )}</span></li>`
          );
        })
        .join("\n");
      return (
        `<section class="changes-group">` +
        `<h3>${escapeHtml(section.group)}</h3>` +
        `<ul class="changes">${items}</ul>` +
        `</section>`
      );
    })
    .join("\n");

  const stats = Object.entries(model.stats)
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<span class="stat">${escapeHtml(capitalize(k))} <strong>${v}</strong></span>`
    )
    .join("");

  return `
<section class="release">
  <div class="release-head">
    <h2>${escapeHtml(model.name)} <span class="version">v${escapeHtml(model.version)}</span></h2>
    <div class="stats">${stats}</div>
  </div>
  ${sections}
</section>`;
}
