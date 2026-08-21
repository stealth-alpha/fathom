import { escapeHtml } from "./util.js";

/**
 * A small, dependency-free Markdown → HTML renderer. It intentionally favours
 * correctness over exhaustive CommonMark coverage: headings, paragraphs, block
 * quotes, fenced and indented code, lists, task lists, tables, images, links,
 * horizontal rules and inline formatting.
 */

const inlineCache = new WeakMap();

export function renderInline(text) {
  // Escape first so every subsequent replacement can insert raw HTML safely.
  let src = escapeHtml(String(text));
  const tokens = [];
  const stash = (html) => {
    tokens.push(html);
    return `\u0000${tokens.length - 1}\u0000`;
  };

  // Images first.
  src = src.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_, alt, url, title) =>
    stash(
      `<img src="${url}" alt="${alt}"${
        title ? ` title="${title}"` : ""
      }>`
    )
  );
  // Links.
  src = src.replace(
    /\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (_, label, url, title) =>
      stash(
        `<a href="${url}"${
          title ? ` title="${title}"` : ""
        }>${label}</a>`
      )
  );
  // Inline code.
  src = src.replace(/`([^`]+)`/g, (_, code) =>
    stash(`<code>${code}</code>`)
  );
  // Bold / italic / strikethrough.
  src = src.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  src = src.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  src = src.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  src = src.replace(/(^|[^\w])_([^_]+)_(?=[^\w]|$)/g, "$1<em>$2</em>");
  src = src.replace(/~~([^~]+)~~/g, "<del>$1</del>");

  const restore = (out) =>
    out.replace(/\u0000(\d+)\u0000/g, (_, i) => tokens[Number(i)] ?? "");
  return restore(src);
}

function renderList(lines, i, isOrdered) {
  const items = [];
  const marker = isOrdered ? /^\s*\d+[.)]\s+/ : /^\s*[-*+]\s+/;
  let raw = "";
  while (i < lines.length && marker.test(lines[i])) {
    const line = lines[i];
    const task = line.match(/^\s*[-*+]\s+\[([ xX])\]\s+(.*)$/);
    const indent = line.match(/^\s*/)[0].length;
    if (task) {
      const checked = /[xX]/.test(task[1]);
      items.push(
        `<li class="task${checked ? " checked" : ""}">${
          `<input type="checkbox" disabled${checked ? " checked" : ""}> `
        }${renderInline(task[2])}</li>`
      );
    } else {
      items.push(`<li>${renderInline(line.replace(marker, ""))}</li>`);
    }
    raw = line;
    i++;
  }
  return {
    html: `<${isOrdered ? "ol" : "ul"}>${items.join("")}</${isOrdered ? "ol" : "ul"}>`,
    next: i,
  };
}

function renderTable(lines, i) {
  const headerLine = lines[i];
  if (!headerLine.includes("|")) return null;
  const header = splitTableRow(headerLine);
  if (header.length < 2) return null;
  const sep = lines[i + 1];
  if (!sep || !/^\s*\|?[\s:|-]+\|?\s*$/.test(sep.replace(/-+/g, "-"))) {
    return null;
  }
  i += 2;
  const rows = [];
  while (i < lines.length && lines[i].includes("|")) {
    rows.push(splitTableRow(lines[i]));
    i++;
  }
  const thead = `<thead><tr>${header
    .map((c) => `<th>${renderInline(c)}</th>`)
    .join("")}</tr></thead>`;
  const tbody = `<tbody>${rows
    .map(
      (r) =>
        `<tr>${r.map((c) => `<td>${renderInline(c)}</td>`).join("")}</tr>`
    )
    .join("")}</tbody>`;
  return {
    html: `<div class="table-wrap"><table>${thead}${tbody}</table></div>`,
    next: i,
  };
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

function renderFence(lines, i) {
  const match = lines[i].match(/^\s*```(.*)$/);
  if (!match) return null;
  const lang = match[1].trim();
  const buf = [];
  i++;
  while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) {
    buf.push(lines[i]);
    i++;
  }
  if (i < lines.length) i++; // closing fence
  const code = buf.join("\n");
  return {
    html: `<div class="code-block">${
      lang
        ? `<div class="code-lang">${escapeHtml(lang)}</div>`
        : ""
    }<pre><code>${escapeHtml(code)}</code></pre></div>`,
    next: i,
  };
}

/**
 * Render a Markdown document body to an HTML string (without a wrapper).
 */
export function renderMarkdown(md) {
  if (typeof md !== "string") return "";
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const out = [];
  let i = 0;
  const closeList = () => {};

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      closeList();
      i++;
      continue;
    }

    // Heading
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      closeList();
      const level = h[1].length;
      const content = renderInline(h[2]);
      const slug = makeSlug(h[2]);
      out.push(
        `<h${level} id="${slug}"><a class="anchor" href="#${slug}">#</a>${content}</h${level}>`
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (/^\s*(?:---|\*\*\*|___)\s*$/.test(line)) {
      closeList();
      out.push("<hr>");
      i++;
      continue;
    }

    // Fenced code
    if (/^\s*```/.test(line)) {
      closeList();
      const res = renderFence(lines, i);
      out.push(res.html);
      i = res.next;
      continue;
    }

    // Blockquote
    if (/^\s*>\s?/.test(line)) {
      closeList();
      const buf = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      out.push(`<blockquote>${renderMarkdown(buf.join("\n"))}</blockquote>`);
      continue;
    }

    // Table
    if (line.includes("|") && i + 1 < lines.length && lines[i + 1].includes("-")) {
      const res = renderTable(lines, i);
      if (res) {
        closeList();
        out.push(res.html);
        i = res.next;
        continue;
      }
    }

    // Ordered / unordered list
    if (/^\s*[-*+]\s+/.test(line)) {
      const res = renderList(lines, i, false);
      out.push(res.html);
      i = res.next;
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const res = renderList(lines, i, true);
      out.push(res.html);
      i = res.next;
      continue;
    }

    // Indented code block
    if (/^\s{4,}\S/.test(line)) {
      closeList();
      const buf = [];
      while (i < lines.length && /^\s{4,}/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s{4,}/, ""));
        i++;
      }
      out.push(
        `<div class="code-block"><pre><code>${escapeHtml(buf.join("\n"))}</code></pre></div>`
      );
      continue;
    }

    // Paragraph (gather continuation lines)
    closeList();
    const buf = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !/^\s*(?:[-*+]\s+|\d+[.)]\s+|```|>\s?|\s{4,}\S)/.test(lines[i]) &&
      !/^\s*(?:---|\*\*\*|___)\s*$/.test(lines[i]) &&
      !lines[i].includes("|")
    ) {
      buf.push(lines[i]);
      i++;
    }
    out.push(`<p>${renderInline(buf.join(" "))}</p>`);
  }
  closeList();
  return out.join("\n");
}

function makeSlug(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Extract heading structure for a table of contents. */
export function extractHeadings(md) {
  const headings = [];
  const lines = String(md).split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^(#{1,6})\s+(.*)$/);
    if (!m) continue;
    headings.push({
      level: m[1].length,
      text: m[2].trim(),
      slug: makeSlug(m[2]),
    });
  }
  return headings;
}
