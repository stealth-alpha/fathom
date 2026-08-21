# Documentation site

`fathom docs` (and `fathom build`) produce a fully static, searchable
documentation site with zero runtime dependencies.

## What's generated

- `index.html` — your `README.md` rendered as a landing page
- `<page>.html` — one page per Markdown file in your `docs/` folder
- `api.html` — functions and classes detected from your source
- `files.html` — your file tree with languages and sizes
- `changelog.html` — the generated release notes
- `sbom.html` — the dependency inventory and license policy findings
- `assets/style.css`, `assets/app.js`, `assets/search-index.json`

## Content sources

The main page is the nearest `README.md`. Additional Markdown files under your
`docs.source` directories become side pages. Their heading structure becomes a
table of contents.

## Themes

```json
{
  "docs": {
    "theme": "dark",
    "primary": "#6366f1"
  }
}
```

Themes are `dark` and `light`. The `primary` colour drives the accent used for
links, bullets and headings.

## Hosting

The output is static. Copy `fathom-dist/` to a CDN, a GitHub Pages branch,
Vercel, Netlify, or an S3 bucket. Use `fathom serve` for local preview only.
