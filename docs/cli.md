# CLI reference

```
fathom <command> [options]
```

## Global options

| Option | Description |
| --- | --- |
| `--cwd <dir>` | Project directory (default: current directory). |
| `--silent` | Reduce output. |
| `--json` | Emit machine-readable output where supported. |
| `--debug` | Show stack traces on error (also `FATHOM_DEBUG=1`). |

## `fathom init`

Create `fathom.config.json`.

```bash
fathom init
```

## `fathom changelog`

Generate release notes from git history.

```bash
fathom changelog [--range a..b] [--format md|json|html] [--write] [--json]
```

## `fathom sbom`

Generate a dependency + license bill of materials.

```bash
fathom sbom [--format cyclonedx|spdx|md|json] [--write]
```

## `fathom docs`

Build a static documentation site.

```bash
fathom docs [--out <dir>]
```

## `fathom build`

Run changelog + sbom + docs into one output. This is the command to use in
release pipelines and pre-commit hooks.

```bash
fathom build [--out <dir>]
```

## `fathom serve`

Serve the build output locally.

```bash
fathom serve [--dir <dir>] [--host <host>] [--port <port>]
```

## `fathom version`, `fathom help`

Print the version or the help text.
