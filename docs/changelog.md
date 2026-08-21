# Changelog generation

Fathom generates a `CHANGELOG.md` using the
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) header format and
[Semantic Versioning](https://semver.org/) section headings.

## How commits are grouped

The parser understands conventional commits:

```
type(scope)!: description
```

| Type | Section |
| --- | --- |
| `feat` | Features |
| `fix` | Bug Fixes |
| `docs` | Documentation |
| `perf` | Performance |
| `refactor` | Refactoring |
| `test` | Tests |
| `build` | Build System |
| `ci` | Continuous Integration |
| `chore` | Miscellaneous |
| `revert` | Reverts |

A `!` after the type, or a `BREAKING CHANGE:` line in the body, moves a commit
into **Breaking Changes**.

## Issue references

Fathom links `#42`, `GH-42` and `JIRA-42` style references found in the commit
subject or body.

## Version detection

Fathom reads the most recent semver git tag (for example `v1.4.2`) and uses it as
the release version. If there is no tag it falls back to `Unreleased`.

## Output formats

```bash
fathom changelog --write                      # write CHANGELOG.md
fathom changelog --range v1.0.0..HEAD --write # just one release
fathom changelog --format json                # machine-readable
fathom changelog --format html                # embedded HTML snippet
```
