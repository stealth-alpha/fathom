<div align="center">

# Fathom

**Turn any repository into clean release notes, a living documentation site, and
a dependency/license bill of materials — in one command.**

Zero runtime dependencies · Works offline · Open-core (MIT)

[![Node](https://img.shields.io/badge/node-%3E%3D18-43853d?logo=node.js&logoColor=white)](https://nodejs.org)
[![Test](https://github.com/stealth-alpha/fathom/actions/workflows/test.yml/badge.svg)](https://github.com/stealth-alpha/fathom/actions/workflows/test.yml)
[![docs](https://github.com/stealth-alpha/fathom/actions/workflows/docs.yml/badge.svg)](https://stealth-alpha.github.io/fathom/)
[![npm](https://img.shields.io/npm/v/@stealth-alpha/fathom)](https://www.npmjs.com/package/@stealth-alpha/fathom)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

</div>

---

Fathom is an engineering tool for people who **ship**. It reads your git history,
your source files and your dependency manifests, then produces everything a
maintainer needs to release and communicate with confidence:

| Command | Produces |
| --- | --- |
| `fathom changelog` | A Keep-a-Changelog / Semantic-Versioning `CHANGELOG.md` from your commits |
| `fathom sbom` | A CycloneDX / SPDX bill of materials + license policy report |
| `fathom docs` | A searchable, themed static documentation site |
| `fathom build` | All of the above into one deployable output |
| `fathom serve` | A local web server to preview the result |

## Why Fathom

**Release notes people actually read.** Fathom groups conventional commits
(`feat`, `fix`, `perf`, `docs`, `chore`, …), detects breaking changes, and links
issue references — so the changelog reads like an editorial release, not a log
dump.

**Compliance without a compliance team.** The SBOM command inventories every
dependency, resolves versions and licenses where possible, and flags copyleft
licenses against your own policy. This is the kind of evidence auditors and
customers ask for (EU CRA, US EO 14028, SOC 2, MSSN).

**Documentation that stays in sync.** Docs are generated from the repo itself, so
they never drift from the code. A README becomes a landing page, your `docs/`
folder becomes the guide, and source symbols become a searchable API index.

**Single binary, zero setup.** No runtime dependencies, no config ceremony, no
network calls. One `npm i -g @stealth-alpha/fathom` and you're shipping.

## Installation

```bash
npm install --global @stealth-alpha/fathom
```

Requires Node 18+ and `git` on your `PATH`. Works on macOS, Linux and Windows.

## Quick start

```bash
cd my-project
fathom init          # create fathom.config.json
fathom build         # CHANGELOG.md + sbom.json + a docs site in fathom-dist/
fathom serve --port 8080
```

Open `http://localhost:8080` to explore your generated docs, changelog and SBOM.

## Using the changelog

```bash
git log --oneline
# 2d502be chore: bump lodash to 4.17.21
# 4689f01 docs: update installation guide
# 1db8e5d feat!: rewrite pricing engine with v2 business rules
# 7cf71ee fix(api): handle null user response in users endpoint
# b03286b feat(auth): add OAuth login flow

fathom changelog --write
```

`fathom changelog` understands conventional commits, `BREAKING CHANGE:` notes and
`#42` / `GH-42` / `JIRA-42` references. Use `--range v1.0.0..HEAD` for a single
release, and `--format json` for CI.

## Using the SBOM

```bash
fathom sbom                          # CycloneDX (default)
fathom sbom --format spdx            # SPDX 2.3 tag-value
fathom sbom --format md --write     # LICENSES.md compliance report
```

Fathom detects `package.json`, `requirements.txt`, `go.mod`, `Cargo.{toml,lock}`,
`composer.json`, `Gemfile.lock` and `pubspec.yaml`. Add a policy to block or warn
on specific licenses:

```json
{
  "sbom": {
    "policy": {
      "blockLicenses": ["GPL-3.0", "AGPL-3.0"],
      "warnLicenses": ["GPL-2.0", "MPL-2.0"]
    }
  }
}
```

## Configuration

`fathom init` writes a fully documented `fathom.config.json`. The most useful
fields:

```json
{
  "name": "acme-api",
  "changelog": { "file": "CHANGELOG.md", "unreleased": true },
  "sbom": { "formats": ["cyclonedx", "md"] },
  "docs": {
    "title": "Acme API Docs",
    "theme": "dark",
    "primary": "#6366f1",
    "source": ["."]
  },
  "build": { "output": "fathom-dist" }
}
```

## CLI reference

| Command | Description |
| --- | --- |
| `fathom init` | Create `fathom.config.json` |
| `fathom changelog` | Generate release notes (md / json / html) |
| `fathom sbom` | Generate a dependency + license bill of materials |
| `fathom docs` | Build a static documentation site |
| `fathom build` | Run changelog + sbom + docs into one output |
| `fathom serve` | Serve the build output locally |
| `fathom version` | Print the version |

Run `fathom help` for all flags.

## CI & pre-commit

Add the GitHub Action in [`docs.yml`](.github/workflows/docs.yml) to regenerate
your docs, changelog and SBOM on every push and publish them to GitHub Pages:

```yaml
- run: npm install --global @stealth-alpha/fathom
- run: fathom build --out site
- uses: actions/upload-pages-artifact@v3
  with: { path: site }
```

Keep your changelog fresh with the pre-commit hook:

```yaml
# .pre-commit-config.yaml
- repo: local
  hooks:
    - id: fathom
      entry: fathom changelog --write
      language: node
      pass_filenames: false
```

## Dogfooding

Fathom documents itself. Every push to `main` regenerates this repo's changelog,
docs site and SBOM with Fathom itself (see `.github/workflows/docs.yml`):

- **Live docs site:** [stealth-alpha.github.io/fathom](https://stealth-alpha.github.io/fathom/)
- **[CHANGELOG.md](CHANGELOG.md)** — release notes generated from git history
- **[sbom.json](sbom.json)** — CycloneDX bill of materials (it lists zero components:
  Fathom has zero runtime dependencies)
- **[LICENSES.md](LICENSES.md)** — the human-readable license report

## Pro (open-core)

The core CLI is free and open source under MIT. `Fathom Pro` adds the things teams
need once they grow past a single repo — see [`docs/pro.md`](docs/pro.md) and
[`PRICING.md`](PRICING.md).

## Contributing

Contributions are welcome. Read [`CONTRIBUTING.md`](CONTRIBUTING.md), then:

```bash
npm install
npm test
```

## License

[MIT](LICENSE)
