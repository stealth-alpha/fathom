# Fathom Pro

Fathom is **open-core**. The CLI you install from npm is free and MIT licensed.
Fathom Pro is a hosted service and an expanded feature set for teams that need
more than one repository.

## Pro features

- **Team workspaces** — centralize docs, changelogs and SBOMs for every repo.
- **Cloud documentation** — publish your Fathom site to a managed URL.
- **Continuous SBOM** — fresh bills of materials per commit, stored and diffable.
- **License alerts** — email / Slack / webhook notifications on policy changes.
- **AI release summaries** — one-click summaries of a release for stakeholders.
- **Dashboards** — release cadence, dependency health and compliance status.

## Pricing

See [`PRICING.md`](../PRICING.md) for the current model.

## Activating a license

Bought Fathom Pro? Activate your license key locally:

```bash
fathom activate XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX
```

The key is verified against Gumroad and stored in
`~/.config/fathom/license.json`. `fathom --version` shows your current tier.
Pro features ship in an upcoming release — activating now reserves your tier;
nothing is gated in the free CLI.

## Why open-core

The core tool is genuinely useful on its own, and it's the best form of
word-of-mouth marketing. Fathom Pro earns revenue by removing operational
drag — hosting, alerts, sharing and governance — rather than by holding a
basic feature hostage.
