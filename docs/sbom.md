# Bill of materials

Fathom's `sbom` command inventories your dependencies and their licenses, then
emits a CycloneDX or SPDX document you can hand to auditors, customers or CI.

## Supported manifests

| Ecosystem | Files |
| --- | --- |
| npm | `package.json`, `node_modules/*/package.json` |
| Python | `requirements.txt`, `requirements.in` |
| Go | `go.mod` |
| Rust | `Cargo.lock`, `Cargo.toml` |
| PHP | `composer.json` |
| Ruby | `Gemfile.lock` |
| Dart | `pubspec.yaml` |

## Commands

```bash
fathom sbom                             # CycloneDX JSON to stdout
fathom sbom --format spdx               # SPDX 2.3 text
fathom sbom --format md                 # license report
fathom sbom --write                     # write to fathom-dist/
```

## License policy

Configure `sbom.policy.blockLicenses` and `sbom.policy.warnLicenses` in
`fathom.config.json`. Findings appear in `LICENSES.md` and in the `summary` of
the CycloneDX document.

## Why it matters

Supply-chain evidence is now part of procurement and regulation. A bill of
materials — even a best-effort one generated from manifests — is a huge head
start over a spreadsheet.
