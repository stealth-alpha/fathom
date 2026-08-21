import path from "node:path";
import fs from "node:fs";
import {
  walkFiles,
  readIfExists,
  escapeHtml,
  fileSize,
  slugify,
  capitalize,
} from "./util.js";
import { renderMarkdown, extractHeadings } from "./markdown.js";
import { cssStyles, pageShell } from "./site.js";
import { formatChangelogHtml } from "./changelog-format.js";
import { formatSbomHtml } from "./sbom-format.js";

const LANGUAGES = {
  ".js": "JavaScript",
  ".mjs": "JavaScript",
  ".cjs": "JavaScript",
  ".jsx": "JavaScript",
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".py": "Python",
  ".go": "Go",
  ".rs": "Rust",
  ".rb": "Ruby",
  ".php": "PHP",
  ".c": "C",
  ".h": "C",
  ".cpp": "C++",
  ".hpp": "C++",
  ".java": "Java",
  ".kt": "Kotlin",
  ".swift": "Swift",
  ".cs": "C#",
  ".sh": "Shell",
  ".bash": "Shell",
  ".zsh": "Shell",
  ".html": "HTML",
  ".css": "CSS",
  ".scss": "SCSS",
  ".sql": "SQL",
  ".json": "JSON",
  ".yaml": "YAML",
  ".yml": "YAML",
  ".toml": "TOML",
  ".md": "Markdown",
  ".vue": "Vue",
  ".svelte": "Svelte",
  ".lua": "Lua",
  ".r": "R",
  ".dart": "Dart",
  ".ex": "Elixir",
  ".exs": "Elixir",
};

function langFor(file) {
  return LANGUAGES[path.extname(file).toLowerCase()] || "Text";
}

function symbolsFor(file, code) {
  const ext = path.extname(file).toLowerCase();
  const out = [];
  const patterns = {
    ".js": /^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(/gm,
    ".mjs": /^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(/gm,
    ".ts": /^(?:export\s+)?(?:abstract\s+)?(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(/gm,
    ".py": /^(?:async\s+)?def\s+([A-Za-z0-9_]+)\s*\(/gm,
    ".go": /^func\s+(?:\([^)]*\)\s*)?([A-Za-z0-9_]+)\s*\(/gm,
    ".rs": /^(?:pub\s+)?fn\s+([A-Za-z0-9_]+)\s*\(/gm,
    ".rb": /^def\s+([A-Za-z0-9_]+)(?:[!?=]?)/gm,
  };
  const classPatterns = {
    ".js": /^(?:export\s+)?class\s+([A-Za-z0-9_$]+)/gm,
    ".mjs": /^(?:export\s+)?class\s+([A-Za-z0-9_$]+)/gm,
    ".ts": /^(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z0-9_$]+)/gm,
    ".py": /^class\s+([A-Za-z0-9_]+)/gm,
    ".go": /^type\s+([A-Za-z0-9_]+)\s+struct/gm,
    ".rs": /^(?:pub\s+)?(?:struct|enum|trait)\s+([A-Za-z0-9_]+)/gm,
    ".rb": /^class\s+([A-Za-z0-9_]+)/gm,
  };
  const fp = patterns[ext];
  if (fp) {
    let m;
    while ((m = fp.exec(code))) out.push({ kind: "function", name: m[1] });
  }
  const cp = classPatterns[ext];
  if (cp) {
    let m;
    while ((m = cp.exec(code))) out.push({ kind: "class", name: m[1] });
  }
  return out;
}

function collectDocs(cwd, config) {
  const docs = [];
  // Primary README in root.
  const readme = ["README.md", "readme.md", "README.MD", "Readme.md"]
    .map((f) => path.join(cwd, f))
    .find((f) => fs.existsSync(f));
  if (readme) {
    docs.push({
      file: readme,
      src: "index",
      title: "Overview",
      body: readIfExists(readme) || "",
    });
  }
  // docs/**/*.md (and root-level *.md except README & CHANGELOG).
  const sourceDirs = Array.isArray(config?.source)
    ? config.source
    : ["."];
  let bodyFiles = [];
  for (const sd of sourceDirs) {
    const abs = path.resolve(cwd, sd);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) continue;
    bodyFiles = [
      ...bodyFiles,
      ...walkFiles(abs, {
        include: /\.md$/i,
        exclude: config?.exclude || [],
      }),
    ];
  }
  // Prefer files under a docs/ dir, then any other md.
  bodyFiles.sort((a, b) => {
    const aIsDocs = a.includes(`${path.sep}docs${path.sep}`) || a.includes("/docs/");
    const bIsDocs = b.includes(`${path.sep}docs${path.sep}`) || b.includes("/docs/");
    if (aIsDocs !== bIsDocs) return aIsDocs ? -1 : 1;
    return a.localeCompare(b);
  });
  for (const file of bodyFiles) {
    const rel = path.relative(cwd, file);
    const base = path.basename(file).replace(/\.md$/i, "");
    if (["README", "readme", "CHANGELOG", "changelog", "LICENSE", "CONTRIBUTING", "SECURITY"].includes(base)) {
      continue;
    }
    const dir = path.dirname(rel).replace(/^\.$/, "");
    const title = capitalize(base.replace(/[-_]/g, " "));
    docs.push({
      file,
      src: slugify(dir ? `${dir}-${base}` : base),
      title,
      body: readIfExists(file) || "",
    });
  }
  return docs;
}

function collectFiles(cwd, config) {
  const exclude = config?.exclude || [];
  return walkFiles(cwd, { exclude }).map((file) => {
    const rel = path.relative(cwd, file);
    const stat = fs.statSync(file);
    return {
      path: rel,
      size: stat.size,
      lang: langFor(file),
    };
  });
}

function appJs() {
  return `(function(){
var idx=[];var input=document.getElementById('search');var toc=document.querySelector('.toc');
function load(){fetch('./assets/search-index.json').then(function(r){return r.json()}).then(function(data){idx=data}).catch(function(){})}
function render(list){if(!toc)return;var wrap=document.createElement('nav');wrap.className='toc';
list.slice(0,40).forEach(function(x){var a=document.createElement('a');a.textContent=x.title;a.href=x.href;wrap.appendChild(a)});
toc.parentNode.replaceChild(wrap,toc);toc=wrap;}
if(input){input.addEventListener('input',function(e){var q=e.target.value.trim().toLowerCase();
if(!q){render([]);return}var res=idx.filter(function(x){return (x.title+' '+x.text).toLowerCase().indexOf(q)>-1});render(res)});}
load();
})();`;
}

/**
 * Build a static documentation site into `outDir`.
 * `extras` may contain `changelog` (model) and `sbom` (model) to embed pages.
 */
export function buildDocsSite({
  cwd = process.cwd(),
  config = {},
  outDir,
  extras = {},
} = {}) {
  const docs = collectDocs(cwd, config);
  const files = collectFiles(cwd, config);

  // Language stats.
  const langCount = new Map();
  for (const f of files) langCount.set(f.lang, (langCount.get(f.lang) || 0) + 1);

  // Symbol index.
  let symbols = [];
  for (const f of files.slice(0, 400)) {
    if (!/\.(js|jsx|ts|tsx|mjs|cjs|py|go|rs|rb)$/.test(f.path)) continue;
    const raw = readIfExists(path.join(cwd, f.path));
    if (!raw) continue;
    const found = symbolsFor(f.path, raw);
    symbols = symbols.concat(
      found.map((s) => ({ ...s, file: f.path, lang: f.lang }))
    );
  }
  symbols.sort((a, b) => b.kind.localeCompare(a.kind) || a.name.localeCompare(b.name));

  const title = config.title || config.name || "Project Docs";
  const brand = config.name || "Fathom";
  const css = cssStyles(config.theme || "dark", config.primary || "#6366f1");
  const nav = [
    { label: "Docs", href: "./index.html" },
    { label: "API", href: "./api.html" },
    { label: "Files", href: "./files.html" },
    ...(extras.changelog ? [{ label: "Changelog", href: "./changelog.html" }] : []),
    ...(extras.sbom ? [{ label: "SBOM", href: "./sbom.html" }] : []),
  ];
  const footer = `Generated by <a href="https://github.com/stealth-alpha/fathom">Fathom</a> · ${title}`;

  fs.mkdirSync(path.join(outDir, "assets"), { recursive: true });

  // index
  const indexDoc = docs.find((d) => d.src === "index");
  const toc = extractHeadings(indexDoc?.body || "");
  writeSite(
    path.join(outDir, "index.html"),
    pageShell({
      title,
      brand,
      active: "./index.html",
      nav,
      toc: toc.map((h) => ({ slug: h.slug, text: h.text, level: h.level })),
      body: bodyFrom(indexDoc, title, files, langCount, symbols),
      css,
      footer,
    })
  );

  // A landing header (hero + stats) + the rendered README.
  // Docs pages.
  for (const doc of docs) {
    if (doc.src === "index") continue;
    const docToc = extractHeadings(doc.body);
    const html = renderMarkdown(doc.body);
    writeSite(
      path.join(outDir, `${doc.src}.html`),
      pageShell({
        title: `${doc.title} · ${title}`,
        brand,
        active: doc.src,
        nav,
        toc: docToc.map((h) => ({ slug: h.slug, text: h.text, level: h.level })),
        body: `<h1>${escapeHtml(doc.title)}</h1>\n${html}`,
        css,
        footer,
      })
    );
  }

  // API page.
  const apiBody =
    symbols.length === 0
      ? `<p class="empty">No symbols detected. Fathom indexes function and class declarations from supported languages.</p>`
      : `<h1>API Reference</h1><p class="lead">Function and class symbols detected in this repository.</p>` +
        symbols
          .slice(0, 500)
          .map(
            (s) =>
              `<div class="api-symbol"><span class="kind">${escapeHtml(
                s.kind
              )}</span><span class="sig"><code>${escapeHtml(
                s.name
              )}</code></span><span class="meta" style="margin-left:auto;color:var(--muted);font-size:12px">${escapeHtml(
                s.file
              )}</span></div>`
          )
          .join("");
  writeSite(
    path.join(outDir, "api.html"),
    pageShell({
      title: `API · ${title}`,
      brand,
      active: "./api.html",
      nav,
      toc: [],
      body: apiBody,
      css,
      footer,
    })
  );

  // Files page.
  const fileRows = files
    .sort((a, b) => a.path.localeCompare(b.path))
    .map(
      (f) =>
        `<div class="row"><span class="name">${escapeHtml(f.path)}</span><span class="lang">${escapeHtml(
          f.lang
        )}</span><span class="size">${fileSize(f.size)}</span></div>`
    )
    .join("");
  writeSite(
    path.join(outDir, "files.html"),
    pageShell({
      title: `Files · ${title}`,
      brand,
      active: "./files.html",
      nav,
      toc: [],
      body: `<h1>Files</h1><p class="lead">${
        files.length
      } source files.</p><div class="files-tree">${fileRows}</div>`,
      css,
      footer,
    })
  );

  // Changelog page.
  if (extras.changelog) {
    const cl = extras.changelog;
    writeSite(
      path.join(outDir, "changelog.html"),
      pageShell({
        title: `Changelog · ${title}`,
        brand,
        active: "./changelog.html",
        nav,
        toc: [],
        body: `<h1>Changelog</h1>` + formatChangelogHtml(cl),
        css,
        footer,
      })
    );
  }

  // SBOM page.
  if (extras.sbom) {
    writeSite(
      path.join(outDir, "sbom.html"),
      pageShell({
        title: `SBOM · ${title}`,
        brand,
        active: "./sbom.html",
        nav,
        toc: [],
        body: formatSbomHtml(extras.sbom),
        css,
        footer,
      })
    );
  }

  // Assets.
  fs.writeFileSync(path.join(outDir, "assets", "style.css"), css);
  fs.writeFileSync(path.join(outDir, "assets", "app.js"), appJs());

  // Search index (title + first paragraph text).
  const searchIndex = docs.map((d) => ({
    title: d.title,
    href: d.src === "index" ? "./index.html" : `./${d.src}.html`,
    text: d.body.replace(/[#*`>\-_]/g, " ").slice(0, 4000),
  }));
  fs.writeFileSync(
    path.join(outDir, "assets", "search-index.json"),
    JSON.stringify(searchIndex)
  );

  return {
    pages: [...docs.map((d) => d.src), "api", "files"].filter(
      (v, i, a) => a.indexOf(v) === i
    ),
    files: files.length,
    symbols: symbols.length,
  };
}

function bodyFrom(doc, title, files, langCount, symbols) {
  if (!doc) return landingBody(files, langCount, symbols);
  if (doc.src === "index") return renderMarkdown(doc.body);
  return `<h1>${escapeHtml(doc.title)}</h1>\n${renderMarkdown(doc.body)}`;
}

function landingBody(files, langCount, symbols) {
  const totalLines = files.length;
  const langRows = [...langCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(
      ([lang, count]) =>
        `<span class="pill">${escapeHtml(lang)} · ${count}</span>`
    )
    .join(" ");
  return `<h1>Welcome</h1>
<p class="lead">This documentation site is generated by Fathom directly from your repository.</p>
<div class="grid-cards">
  <div class="card"><div class="num">${totalLines}</div><div class="lbl">Source files</div></div>
  <div class="card"><div class="num">${langCount.size}</div><div class="lbl">Languages</div></div>
  <div class="card"><div class="num">${symbols}</div><div class="lbl">Symbols indexed</div></div>
</div>
<h2>Languages</h2>${langRows || `<p class="empty">—</p>`}
<p style="color:var(--muted);font-size:14px">Add a <code>README.md</code> to fill this page with your project overview.</p>`;
}

function writeSite(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  return file;
}
