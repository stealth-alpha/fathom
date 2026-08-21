# Go to market — how to actually sell Fathom

This is the playbook. The product is built; this is how you go from a repo to
customers.

## 0. What you have

- A zero-dependency Node CLI that turns a repo into a changelog, an SBOM and a
  documentation site.
- A `fathom build` output that is immediately *demonstrable* and hostable.
- A free (MIT) core + a paid hosted `Pro` tier.

## 1. Pick your wedge

The single most valuable, least-crowded story is **supply-chain compliance**.
"Generate an SBOM and license report you can hand to a customer or auditor" is
concrete, painful, and increasingly mandatory. The changelog/docs site is the
pleasant side effect that makes the tool fun and viral.

Position one line:

> **"One command turns your repo into the release notes, docs and SBOM your
> customers and auditors actually ask for."**

## 2. Ship it publicly

- Publish to npm as `fathomcli` and to a GitHub repo. Add a CI badge.
- Generate the Fathom docs site for the Fathom repo and link it from the README
  (dogfooding).
- Add a `CHANGELOG.md` and an SBOM to the repo. Practice what you preach.

## 3. Create the demo asset

Record or screenshot a real lifecycle:

```bash
fathom init
fathom build
fathom serve
```

Show the beautiful dark docs table of contents, the changelog grouped by
conventional commits, and the license policy flagging a GPL dependency. Put the
animated demo at the top of the README and the landing page.

## 4. Distribution targets

### Developer channels

- **npm** and **GitHub** — write a strong README and `package.json` description.
- **Reddit**: r/node, r/devops, r/opensource — as a helpful tool, not spam.
- **Hacker News** — a "Show HN: Fathom — one command for changelog, docs, SBOM".
- **Dev.to / Hashnode** — an honest tutorial: "You're releasing wrong. Here's
  how we do it."
- **Product Hunt** — classic launch; focus on the one-command magic.

### Compliance / security audience

- Post on **LinkedIn** and r/cybersecurity about SBOM generation for EO 14028 /
  EU CRA audit prep.
- Offer a free `LICENSES.md` generator — the report is the lead magnet.

### Integrations

- **GitHub Action** to run `fathom build` on every push and publish docs.
- **pre-commit** hook to keep the changelog fresh.
- **Docker** image for CI.

## 5. Convert free → Pro

The CLI is the funnel. The paid product is the hosted `Pro` tier:

- Publish docs to a managed URL (`docs.yourcompany.com`).
- Continuous SBOM per commit with diffing and alerts.
- Team workspaces, AI release summaries, SSO.

Put a `Pro` hint in CLI output ("Host your docs with `fathom pro`") and a small
`upgrade` link in the generated site footer — low pressure, but present.

## 6. Pricing validation

Start with the placeholder pricing in `PRICING.md`. Your goal in the first 2–4
weeks is not revenue, it's **signal**:

- Do people install it? (npm downloads)
- Do they `init` and `build`? (telemetry-free, so ask in Discord/GitHub)
- Which page do they screenshot? (the docs site is the hook)

Then price the Pro tier around the biggest named pain: compliance review and
docs drift.

## 7. Milestones

| Milestone | Signal |
| --- | --- |
| 100 GitHub stars | Real interest |
| 1,000 npm downloads | Distribution works |
| 25 `fathom build` runs/day | Repeated use, not a one-off |
| 3 paying Pro teams | Willingness to pay |

## 8. Risks & watchouts

- **Competition** — `git-cliff`, `conventional-changelog`, `cyclonedx-npm` all
  exist. You win on *combined* output + the docs site + the compliance framing,
  not on any single narrow feature.
- **Don't gate the CLI.** Keep the core free; monetize the hosted layer.
- **Licensing accuracy** — an SBOM is best-effort. Be honest that it's
  generated from manifests and local `node_modules`.
