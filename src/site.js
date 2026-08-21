import { escapeHtml } from "./util.js";

export function themeCss(theme) {
  if (theme === "light") {
    return {
      vars: `--bg:#ffffff;--bg-2:#f6f7f9;--panel:#ffffff;--border:#e5e7eb;--text:#111827;--muted:#6b7280;--link:#2563eb;--code-bg:#f3f4f6;--code-text:#111827;`,
      body: "background:var(--bg);color:var(--text);",
    };
  }
  return {
    vars: `--bg:#0b0f17;--bg-2:#111827;--panel:#111827;--border:#1f2937;--text:#e5e7eb;--muted:#94a3b8;--link:#818cf8;--code-bg:#0f172a;--code-text:#e2e8f0;`,
    body: "background:var(--bg);color:var(--text);",
  };
}

export function cssStyles(theme, primary) {
  const t = themeCss(theme);
  return `:root{--primary:${primary};${t.vars}}
*{box-sizing:border-box}
body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;${t.body}line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:var(--link);text-decoration:none}a:hover{text-decoration:underline}
.topbar{position:sticky;top:0;z-index:50;display:flex;align-items:center;gap:24px;padding:14px 28px;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--border)}
.brand{font-weight:800;font-size:18px;letter-spacing:-.02em;color:var(--text);display:flex;align-items:center;gap:10px}
.brand .dot{width:22px;height:22px;border-radius:6px;background:linear-gradient(135deg,var(--primary),#a855f7);display:inline-block}
.nav{display:flex;gap:6px;flex-wrap:wrap}
.nav a{padding:6px 12px;border-radius:8px;color:var(--muted);font-size:14px;font-weight:500}
.nav a:hover,.nav a.active{color:var(--text);background:var(--bg-2);text-decoration:none}
.layout{display:grid;grid-template-columns:240px 1fr;gap:0;max-width:1200px;margin:0 auto;min-height:calc(100vh - 57px)}
@media(max-width:860px){.layout{grid-template-columns:1fr}.sidebar{display:none}}
.sidebar{position:sticky;top:57px;height:calc(100vh - 57px);overflow:auto;padding:28px 12px 28px 28px;border-right:1px solid var(--border)}
.sidebar h5{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);margin:18px 0 8px}
.sidebar ul{list-style:none;margin:0;padding:0}
.sidebar li{margin:2px 0}
.sidebar a{display:block;color:var(--muted);font-size:13.5px;padding:5px 10px;border-radius:6px}
.sidebar a:hover{color:var(--text);background:var(--bg-2);text-decoration:none}
.sidebar a.d2{padding-left:22px}
.content{padding:40px 48px 80px;min-width:0}
.content h1{font-size:2.1rem;letter-spacing:-.03em;margin:.2rem 0 1.2rem;line-height:1.2}
.content h2{font-size:1.45rem;letter-spacing:-.02em;margin-top:2rem;padding-top:1rem;border-top:1px solid var(--border)}
.content h3{font-size:1.15rem;margin-top:1.8rem}
.content p{color:var(--text)}
.content .anchor{opacity:0;margin-left:6px;color:var(--muted);font-weight:400}
.content h1:hover .anchor,.content h2:hover .anchor,.content h3:hover .anchor{opacity:1}
code{background:var(--code-bg);color:var(--code-text);padding:.12em .38em;border-radius:5px;font-size:.9em;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
pre{background:var(--code-bg);border:1px solid var(--border);border-radius:12px;padding:16px 18px;overflow:auto;color:var(--code-text)}
pre code{background:none;padding:0}
.code-block{position:relative;margin:1.2rem 0}
.code-lang{position:absolute;top:10px;right:12px;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}
blockquote{border-left:3px solid var(--primary);margin:1.1rem 0;padding:.2rem 1.1rem;color:var(--muted);background:var(--bg-2);border-radius:0 10px 10px 0}
ul,ol{padding-left:1.3rem}
li.task{list-style:none;margin-left:-1.3rem}
.table-wrap{overflow-x:auto;margin:1.2rem 0;border:1px solid var(--border);border-radius:12px}
table{border-collapse:collapse;width:100%;font-size:14px}
th,td{padding:10px 14px;text-align:left;border-bottom:1px solid var(--border)}
th{background:var(--bg-2);font-weight:600}
td code{background:var(--bg-2)}
hr{border:none;border-top:1px solid var(--border);margin:2rem 0}
img{max-width:100%;border-radius:12px}
.release,.sbom{margin-top:1rem}
.release-head{display:flex;justify-content:space-between;align-items:end;flex-wrap:wrap;gap:12px;border-bottom:1px solid var(--border);padding-bottom:16px}
.release-head .version{color:var(--primary);font-weight:700}
.stats{display:flex;gap:8px;flex-wrap:wrap}
.stat{font-size:13px;color:var(--muted);background:var(--bg-2);border:1px solid var(--border);border-radius:999px;padding:4px 12px}
.stat strong{color:var(--text)}
.changes-group{margin-top:1.4rem}
.changes{list-style:none;padding:0;margin:.6rem 0}
.changes li{display:flex;align-items:baseline;gap:10px;padding:.4rem 0;border-bottom:1px dashed var(--border)}
.changes .bullet{color:var(--primary)}
.changes .meta{margin-left:auto;color:var(--muted);font-size:12px}
.changes .refs code{background:var(--bg-2)}
.files-tree{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13.5px}
.files-tree .row{display:flex;gap:12px;padding:6px 10px;border-bottom:1px dashed var(--border)}
.files-tree .name{flex:1}
.files-tree .size{color:var(--muted)}
.files-tree .lang{color:var(--muted);font-size:11px}
.pill{display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;background:var(--bg-2);border:1px solid var(--border);color:var(--muted)}
.lead{color:var(--muted);font-size:1.06rem}
.searchbox{display:flex;align-items:center;gap:8px;background:var(--bg-2);border:1px solid var(--border);border-radius:8px;padding:6px 12px;margin-left:auto;width:220px}
.searchbox input{background:none;border:none;outline:none;color:var(--text);width:100%;font-size:13.5px}
.footer{padding:24px 48px;border-top:1px solid var(--border);color:var(--muted);font-size:13px;text-align:center}
.grid-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:1rem 0}
.card{background:var(--bg-2);border:1px solid var(--border);border-radius:12px;padding:16px}
.card .num{font-size:1.8rem;font-weight:800;letter-spacing:-.03em}
.card .lbl{color:var(--muted);font-size:13px}
.empty{color:var(--muted);padding:1rem 0}
.api-symbol{display:flex;gap:12px;align-items:baseline;padding:.5rem 0;border-bottom:1px dashed var(--border)}
.api-symbol .kind{color:var(--primary);font-size:12px;text-transform:uppercase;letter-spacing:.05em;min-width:72px}
.api-symbol .sig{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13.5px}
`.trim();
}

export function pageShell({
  title,
  brand,
  active,
  nav,
  toc,
  body,
  css,
  footer,
}) {
  const tocHtml = toc
    ? `<nav class="toc">${toc.map((item) => {
        const href = item.href || `#${item.slug}`;
        return `<a class="${item.level > 1 ? "d2" : ""}" href="${href}">${escapeHtml(
          item.text
        )}</a>`;
      }).join("")}</nav>`
    : "";
  const navHtml = nav
    ? nav
        .map(
          (n) =>
            `<a href="${n.href}" class="${n.href === active ? "active" : ""}">${escapeHtml(
              n.label
            )}</a>`
        )
        .join("")
    : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="generator" content="fathom">
<link rel="stylesheet" href="./assets/style.css">
</head>
<body>
<header class="topbar">
  <a class="brand" href="./index.html"><span class="dot"></span>${escapeHtml(brand)}</a>
  <nav class="nav">${navHtml}</nav>
  <div class="searchbox"><input type="search" id="search" placeholder="Search docs…"></div>
</header>
<div class="layout">
  <aside class="sidebar"><h5>On this page</h5>${tocHtml}</aside>
  <main class="content">${body}</main>
</div>
<footer class="footer">${footer}</footer>
<script src="./assets/app.js"></script>
</body>
</html>`;
}
