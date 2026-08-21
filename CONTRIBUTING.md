# Contributing to Fathom

Thanks for helping. This project has **zero runtime dependencies** by design — a
large part of its appeal is that it just works anywhere Node 18+ runs.

## Development

```bash
npm install        # only for local tooling
npm test           # node:test (no test framework)
node bin/fathom.js build   # dogfood on this repo
```

## What makes a good contribution

- A new command or format, with tests.
- A fix to an existing parser, with a regression test.
- Better Markdown rendering, more language patterns, more manifest support.
- Docs and examples.

Please **keep the runtime dependency-free**. New functionality should rely on
Node built-ins (`node:fs`, `node:path`, `node:child_process`, `node:http`). If a
feature genuinely needs a dependency, propose it in an issue first.

## Testing

Tests live in `test/` and use the built-in `node:test` runner:

```bash
npm test
```

Add a test for anything you change. The test suite intentionally builds real
git repositories and temp manifest trees so behaviour is verified, not mocked.

## Commit style

Use conventional commits (`feat:`, `fix:`, `docs:`, `perf:`, `test:`,
`chore:`). Fathom reads them for its own changelog.

## Code of conduct

Be kind, be specific, and keep the conversation constructive.
