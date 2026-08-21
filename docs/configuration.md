# Configuration

Fathom reads `fathom.config.json` from the project root. Create one with
`fathom init`, or hand-write it. Every default is documented below.

## Top level

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "changelog": {},
  "sbom": {},
  "docs": {},
  "build": {}
}
```

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | string | directory name | The project name used in output. |
| `version` | string | `null` | Override the version from the latest git tag. |

## `changelog`

```json
{
  "changelog": {
    "file": "CHANGELOG.md",
    "format": "md",
    "unreleased": true,
    "groups": {
      "feat": "Features",
      "fix": "Bug Fixes",
      "docs": "Documentation",
      "breaking": "Breaking Changes"
    }
  }
}
```

`groups` maps conventional commit types to section headings. The default set
also covers `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore` and
`revert`.

## `sbom`

```json
{
  "sbom": {
    "formats": ["cyclonedx", "md"],
    "policy": {
      "blockLicenses": ["GPL-3.0", "AGPL-3.0"],
      "warnLicenses": ["GPL-2.0", "MPL-2.0", "EUPL-1.2"]
    }
  }
}
```

| Field | Description |
| --- | --- |
| `formats` | Output formats: `cyclonedx`, `spdx`, `md`, `json`. |
| `policy.blockLicenses` | Licenses that produce a `BLOCK` finding. |
| `policy.warnLicenses` | Licenses that produce a `WARN` finding. |

License matching is substring-based, so `Mozilla Public License 2.0` and
`MPL-2.0` both match `MPL-2.0`.

## `docs`

```json
{
  "docs": {
    "title": "My Project Docs",
    "theme": "dark",
    "primary": "#6366f1",
    "source": ["."],
    "exclude": ["bench"],
    "include": null
  }
}
```

| Field | Description |
| --- | --- |
| `title` | Site `<title>` and header. |
| `theme` | `dark` or `light`. |
| `primary` | A `#rrggbb` accent colour. |
| `source` | Directories to scan for Markdown docs. |
| `exclude` | Extra directory names to skip. |
| `include` | A regex (string) to filter files by name. |

## `build`

```json
{
  "build": { "output": "fathom-dist" }
}
```

`output` is the directory that `build`, `docs` and `serve` use by default.
