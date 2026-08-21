# Demo — proof it works

Fathom is verified against a real repository. `demo/` is a small API project with
git history, npm dependencies (including a GPL dependency), source files and a
`docs/` folder.

## Reproduce it

```bash
cd demo
node ../bin/fathom.js init
node ../bin/fathom.js build
node ../bin/fathom.js serve --port 8080
```

## What the build produces

| Artifact | Location |
| --- | --- |
| Semantic changelog | `demo/CHANGELOG.md` |
| CycloneDX SBOM | `demo/fathom-dist/sbom.json` |
| License report | `demo/fathom-dist/LICENSES.md` |
| Documentation site | `demo/fathom-dist/` |

## Verified results

The demo changelog groups a real history correctly:

```
### Breaking Changes
- **rewrite pricing engine with v2 business rules**

### Features
- **add OAuth login flow**

### Bug Fixes
- **handle null user response in users endpoint**
```

The demo SBOM inventories three dependencies and flags the GPL policy breach:

```
## Policy findings

- **BLOCK** — license-helper@1.2.0 (GPL-3.0): Copyleft license "GPL-3.0" is blocked by policy
```

The generated docs site ships as a static, searchable site (`index.html`,
`api.html`, `files.html`, `changelog.html`, `sbom.html`).

## Tests

```bash
npm test
```

The suite builds real git repos and manifest trees in temporary directories and
verifies changelog grouping, SBOM/CycloneDX output, license policy, Markdown
rendering and the docs site generator.
