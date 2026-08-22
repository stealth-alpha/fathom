# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) — and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] — tracked as 0.1.2 in package.json, not yet on npm

> 2 fixes

### Fixed

- **version derivation** — CLI banner and generated SBOM tool metadata now read the version from package.json instead of a stale hardcoded constant (published 0.1.1 self-reported 0.1.0)
- **project-prefixed issue refs** — `GH-7` / `JIRA-12` style refs no longer render with a broken `#` prefix; numeric refs keep the GitHub-style `#42`

## [0.1.1] - 2026-08-22

> metadata-only republish

### Fixed

- **package metadata** — published 0.1.0 pointed `repository` and `homepage` at the fathomcli.dev placeholder; 0.1.1 corrects them to the real repo. No code changes.

## [0.1.0] - 2026-08-21

> 10 commits, 3 feature

### Features

- **static documentation site generator** by @Fathom-Contributors
- **cyclonedx and spdx sbom generation** by @Fathom-Contributors
- **changelog generation from git history** by @Fathom-Contributors

### Documentation

- **landing page, guides, GTM, CI workflow and polish** by @Fathom-Contributors
- **add product guides and go-to-market** by @Fathom-Contributors

### Continuous Integration

- **add test workflow (node 18/20); fix package metadata and install commands** by @Fathom-Contributors
- **install fathom from source until npm package is live** by @Fathom-Contributors

### Miscellaneous

- **publish as scoped @stealth-alpha/fathom (npm typosquat rule)** by @Fathom-Contributors
- **rename package to unscoped fathomcli (org-free publish)** by @Fathom-Contributors
- **initial Fathom repository** by @Fathom-Contributors

