import fs from "node:fs";
import path from "node:path";
import {
  log,
  info,
  success,
  error,
  warn,
  green,
  cyan,
  yellow,
  bold,
  dim,
} from "./util.js";
import { VERSION } from "./version.js";
import { activate, currentTier, loadLicense, maskKey } from "./license.js";
import { loadConfig, configExists, configFileName, DEFAULT_CONFIG } from "./config.js";
import { isGitRepo, getProjectName } from "./git.js";
import { buildChangelog } from "./changelog.js";
import {
  formatChangelogMarkdown,
  formatChangelogJson,
  formatChangelogHtml,
} from "./changelog-format.js";
import { buildSbom, writeSbomFiles } from "./sbom.js";
import { buildDocsSite } from "./docs.js";
import { createStaticServer, listen } from "./serve.js";

function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const eq = arg.indexOf("=");
      if (eq !== -1) {
        flags[arg.slice(2, eq)] = arg.slice(eq + 1);
      } else {
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith("--")) {
          flags[arg.slice(2)] = next;
          i++;
        } else {
          flags[arg.slice(2)] = true;
        }
      }
    } else {
      positional.push(arg);
    }
  }
  return { flags, positional };
}

function printVersion() {
  log(`${VERSION}`);
  const tier = currentTier();
  log(
    tier === "pro"
      ? dim(`tier: pro (license ${maskKey(loadLicense()?.license_key)})`)
      : dim("tier: free — activate Pro with: fathom activate <license-key>")
  );
}

function printHelp() {
  log(`fathom ${VERSION}

${bold("Usage")}
  fathom <command> [options]

${bold("Commands")}
  init                  Create a ${configFileName()} in the current directory
  changelog             Generate release notes from git history
  sbom                  Generate a dependency + license bill of materials
  docs                  Build a static documentation site
  build                 Run changelog + sbom + docs into a single output
  serve                 Serve the generated build output
  activate              Activate a Fathom Pro license key
  version               Print the Fathom version and license tier
  help                  Show this help

${bold("Options")}
  --range <a..b>        Limit changelog to a git range
  --format <f>          Output format (md | json | html | cyclonedx | spdx)
  --write               Write output to disk (default: print to stdout)
  --out <dir>           Output directory (default: ${DEFAULT_CONFIG.build.output})
  --cwd <dir>           Project directory (default: current directory)
  --port <n>            Port for serve (default: 4173)
  --host <host>         Host for serve (default: 127.0.0.1)
  --silent              Reduce output
  --json                Emit machine-readable output where supported

${bold("Examples")}
  fathom init
  fathom changelog --write
  fathom sbom --format cyclonedx --write
  fathom build
  fathom serve --port 8080
`);
}

function resolveProject(flags) {
  const cwd = path.resolve(flags.cwd || process.cwd());
  if (!fs.existsSync(cwd) || !fs.statSync(cwd).isDirectory()) {
    throw new FathomError(`Directory not found: ${cwd}`);
  }
  return cwd;
}

class FathomError extends Error {}

async function cmdInit(flags) {
  const cwd = resolveProject(flags);
  if (configExists(cwd)) {
    log(`${yellow("Existing")} ${configFileName()} already present in ${cwd}`);
    return;
  }
  const name = getProjectName(cwd);
  const config = {
    ...DEFAULT_CONFIG,
    name,
    version: null,
  };
  const file = path.join(cwd, configFileName());
  fs.writeFileSync(file, JSON.stringify(config, null, 2) + "\n");
  success(`Created ${configFileName()} in ${cyan(cwd)}`);
  info(dim("Edit the file to customise name, theme and output paths."));
}

async function cmdChangelog(flags) {
  const cwd = resolveProject(flags);
  if (!isGitRepo(cwd)) {
    throw new FathomError(`Not a git repository: ${cwd}`);
  }
  const config = loadConfig(cwd) || DEFAULT_CONFIG;
  const format = flags.format || config.changelog.format || "md";
  const model = buildChangelog({
    cwd,
    range: flags.range || null,
    groupMap: config.changelog.groups,
    unreleased: config.changelog.unreleased,
    name: config.name,
  });

  let out;
  if (format === "json") out = formatChangelogJson(model);
  else if (format === "html") out = formatChangelogHtml(model);
  else out = formatChangelogMarkdown(model);

  if (flags.write) {
    const file = path.join(cwd, config.changelog.file || "CHANGELOG.md");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, out + "\n");
    success(`${yellow("Changelog")} written to ${cyan(file)} (${model.commitCount} commits)`);
  } else if (flags.json) {
    log(formatChangelogJson(model));
  } else {
    log(out);
  }
}

async function cmdSbom(flags) {
  const cwd = resolveProject(flags);
  const config = loadConfig(cwd) || DEFAULT_CONFIG;
  const sbom = buildSbom(cwd, config);
  if (flags.write) {
    const { files } = writeSbomFiles(cwd, config);
    for (const f of files) {
      success(`${yellow("SBOM")} written to ${cyan(f)}`);
    }
  } else {
    const format = flags.format || "cyclonedx";
    if (format === "spdx") {
      const { formatSpdx } = await import("./sbom-format.js");
      log(formatSpdx(sbom));
    } else if (format === "md") {
      const { formatLicensesMarkdown } = await import("./sbom-format.js");
      log(formatLicensesMarkdown(sbom, config));
    } else {
      log(JSON.stringify(sbom, null, 2));
    }
  }
}

async function cmdDocs(flags) {
  const cwd = resolveProject(flags);
  const config = loadConfig(cwd) || DEFAULT_CONFIG;
  const outDir = path.resolve(cwd, flags.out || config.build.output || "fathom-dist");
  const result = buildDocsSite({
    cwd,
    config,
    outDir,
    extras: {},
  });
  success(`Documentation site built at ${cyan(outDir)}`);
  info(`${result.pages.length} pages · ${result.files} files · ${result.symbols} symbols`);
}

async function cmdBuild(flags) {
  const cwd = resolveProject(flags);
  const config = loadConfig(cwd) || DEFAULT_CONFIG;
  const outDir = path.resolve(cwd, flags.out || config.build.output || "fathom-dist");

  fs.mkdirSync(outDir, { recursive: true });

  let changelog = null;
  if (isGitRepo(cwd)) {
    const model = buildChangelog({
      cwd,
      groupMap: config.changelog.groups,
      unreleased: config.changelog.unreleased,
      name: config.name,
    });
    const md = formatChangelogMarkdown(model);
    const file = path.join(cwd, config.changelog.file || "CHANGELOG.md");
    fs.writeFileSync(file, md + "\n");
    changelog = model;
    success(`${yellow("Changelog")} → ${cyan(file)}`);
  } else {
    warn("Skipping changelog — not a git repository");
  }

  let sbom = null;
  if (config.sbom?.formats?.length) {
    const { sbom: model } = writeSbomFiles(cwd, config, outDir);
    sbom = model;
    success(`${yellow("SBOM")} → ${cyan(path.join(outDir, "sbom.json"))}`);
  }

  const docs = buildDocsSite({
    cwd,
    config,
    outDir,
    extras: { changelog, sbom },
  });
  success(`Docs site → ${cyan(outDir)}`);
  if (flags.json) {
    log(
      JSON.stringify({
        output: outDir,
        changelog: changelog ? changelog.commitCount : 0,
        components: sbom ? sbom.components.length : 0,
        violations: sbom ? sbom.summary.violations.length : 0,
        pages: docs.pages.length,
        files: docs.files,
        symbols: docs.symbols,
      })
    );
  }
  info(
    `${docs.pages.length} pages · ${docs.files} files · ${docs.symbols} symbols · ${
      changelog ? changelog.commitCount + " commits" : "0 commits"
    }`
  );
}

async function cmdServe(flags) {
  const cwd = resolveProject(flags);
  const config = loadConfig(cwd) || DEFAULT_CONFIG;
  const dir = path.resolve(cwd, flags.dir || config.build.output || "fathom-dist");
  if (!fs.existsSync(dir)) {
    throw new FathomError(
      `No build output at ${dir}. Run ${green("fathom build")} first.`
    );
  }
  const port = Number(flags.port || 4173);
  const host = flags.host || "127.0.0.1";
  const { server } = createStaticServer(dir, { host, port });
  await listen(server, { host, port });
  const addr = server.address();
  const shownPort = typeof addr === "object" && addr ? addr.port : port;
  log(`${green("Serving")} ${cyan(dir)} at ${cyan(`http://${host}:${shownPort}`)}`);
  log(dim("Press Ctrl+C to stop."));
}

async function cmdActivate(flags) {
  const key = flags._dir ?? flags.cwd;
  if (!key) {
    error("activate requires a license key: fathom activate <license-key>");
    info(dim("Buy Fathom Pro at https://ektorsot.gumroad.com/l/ujksed"));
    process.exitCode = 1;
    return;
  }
  info("Verifying license with Gumroad…");
  try {
    const { record, file } = await activate(key);
    if (!record.valid) {
      error(record.message || "License is not valid.");
      info(dim("Keys look like XXXX-XXXX-XXXX-XXXX-XXXX and are issued per purchase."));
      process.exitCode = 1;
      return;
    }
    success(`License verified — Fathom Pro activated for ${record.email || "your account"}`);
    log(dim(`Saved to ${file}`));
    info(dim("Pro features ship in an upcoming release; your tier is already recorded."));
  } catch (err) {
    error(err.message);
    process.exitCode = 1;
  }
}

export async function main(argv) {
  const { flags, positional } = parseArgs(argv);
  if (flags.debug) process.env.FATHOM_DEBUG = "1";
  const command = positional[0] || (flags.version ? "version" : "help");
  flags._dir = positional[1];
  try {
    switch (command) {
      case "init":
        await cmdInit(flags);
        break;
      case "changelog":
        await cmdChangelog(flags);
        break;
      case "sbom":
        await cmdSbom(flags);
        break;
      case "docs":
        await cmdDocs(flags);
        break;
      case "build":
        await cmdBuild(flags);
        break;
      case "serve":
        await cmdServe(flags);
        break;
      case "activate":
        await cmdActivate(flags);
        break;
      case "version":
      case "--version":
      case "-v":
        printVersion();
        break;
      case "help":
      case "--help":
      case "-h":
        printHelp();
        break;
      default:
        error(`Unknown command: ${command}`);
        printHelp();
        process.exitCode = 1;
    }
  } catch (err) {
    error(err.message || String(err));
    if (process.env.FATHOM_DEBUG) {
      console.error(err);
    }
    process.exitCode = 1;
  }
}
