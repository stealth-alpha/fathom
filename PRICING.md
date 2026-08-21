# Pricing

Fathom is **open-core**: the CLI is MIT-licensed and free forever. Revenue comes
from the hosted `Fathom Pro` product, which removes operational drag rather than
holding basic functionality hostage.

## Tiers

| | **Community** | **Pro** | **Team** | **Enterprise** |
| --- | --- | --- | --- | --- |
| Price | Free | $9 / month | $39 / month | Custom |
| CLI (`fathom`) | ✅ | ✅ | ✅ | ✅ |
| GitHub / GitLab sync | ✅ | ✅ | ✅ | ✅ |
| Local docs + changelog + SBOM | ✅ | ✅ | ✅ | ✅ |
| **Hosted documentation** | — | ✅ 1 site | ✅ 10 sites | ✅ Unlimited |
| **Continuous SBOM** | — | ✅ | ✅ | ✅ |
| **License policy alerts** | — | ✅ | ✅ | ✅ |
| **AI release summaries** | — | ✅ | ✅ | ✅ |
| **Team workspaces** | — | — | ✅ | ✅ |
| **SSO / SCIM** | — | — | — | ✅ |
| **Audit export** | ✅ | ✅ | ✅ | ✅ |
| Support | Community | Email | Priority | Dedicated |

> Prices are illustrative placeholders you can tune. The launcher below accounts
> for the fact that conversion to a paid hosted tier is the primary revenue line;
> the open-source CLI creates the audience.

## Pricing philosophy

1. **Give away the tool, sell the outcome.** The CLI is genuinely useful and free;
   that's the best marketing.
2. **Charge for convenience, not capability.** Hosting, alerts, team sync and
   governance are things a solo dev is happy to run themselves but a company will
   pay to avoid.
3. **Low monthly price, high perceived value.** $9 is an easy yes; the compliance
   report alone justifies it for teams that sell into regulated industries.

## Distribution levers

- **npm** — `npm i -g fathomcli` is the top-of-funnel.
- **GitHub** — the repo, Stars, Discussions and a clean README.
- **Release audit** — position against `npm audit` + `cyclonedx` + license tools.
- **Docs-as-a-product** — the generated site is a demo of the tool.
- **Web search SEO** — target "generate changelog", "sbom generator",
  "dependency license report".
