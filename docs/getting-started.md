# Getting started

Fathom turns your repository into three things in one shot: a changelog, a
bill of materials, and a documentation site. This guide walks through a
first run.

## Prerequisites

- **Node.js 18+**
- **git** on your `PATH`

Install the CLI globally:

```bash
npm install --global fathomcli
```

## 1. Initialise

```bash
cd /path/to/your/project
fathom init
```

This writes a `fathom.config.json` with sensible defaults. Open it and set the
`name` and `docs.title` to match your project.

## 2. Build

```bash
fathom build
```

This generates:

- `CHANGELOG.md` — semantic release notes from your git history
- `fathom-dist/sbom.json` — a CycloneDX 1.5 bill of materials
- `fathom-dist/LICENSES.md` — a human-readable dependency + license report
- `fathom-dist/` — a static documentation site (index, API, files, changelog, SBOM)

## 3. Preview

```bash
fathom serve --port 8080
```

Open `http://localhost:8080`. The site is fully static, so you can also drop the
`fathom-dist/` folder on any static host.

## What you'll see

- The **Docs** page renders your `README.md` with a table of contents.
- The **API** page lists functions and classes found in your source.
- The **Files** page shows your file tree with languages and sizes.
- The **Changelog** page shows the release notes from your commits.
- The **SBOM** page shows your dependency inventory and license policy findings.

## Next steps

- Add a `docs/` folder with `.md` files to grow the generated site.
- Set a license policy in `fathom.config.json` to enforce compliance.
- Run `fathom changelog --format json` in CI to publish release notes.
