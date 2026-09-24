<br>
<div align="center">

<p align="center">
  <a href="https://css.master.co">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/33840671/201701649-3bb7d698-abec-4d5f-ac30-ccc4d7bafcd4.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/33840671/201703010-77bf2373-9899-40cc-98f5-30cf9b546941.svg">
      <img alt="Master CSS" src="https://user-images.githubusercontent.com/33840671/201703010-77bf2373-9899-40cc-98f5-30cf9b546941.svg" width="100%">
    </picture>
  </a>
</p>
<p align="center">Master CSS CLI</p>

<p align="center">
  <a aria-label="GitHub release (latest by date including pre-releases)" href="https://github.com/master-co/css/releases">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=212022&label=&style=for-the-badge&logo=github&logoColor=fff">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=f6f7f8&label=&style=for-the-badge&logo=github&logoColor=%23000">
      <img alt="NPM Version" src="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=f6f7f8&label=&style=for-the-badge&logo=github">
    </picture>
  </a>
  <a aria-label="NPM Package" href="https://www.npmjs.com/package/@master/css-cli">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/npm/dm/@master/css-cli?color=212022&label=%20&logo=npm&style=for-the-badge">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/npm/dm/@master/css-cli?color=f6f7f8&label=%20&logo=npm&style=for-the-badge">
      <img alt="NPM package ( download / month )" src="https://img.shields.io/npm/dm/@master/css-cli?color=f6f7f8&label=%20&logo=npm&style=for-the-badge">
    </picture>
  </a>
  <a aria-label="Discord Community" href="https://discord.gg/sZNKpAAAw6">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/discord/917780624314613760?color=212022&label=%20&logo=discord&style=for-the-badge">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/discord/917780624314613760?color=f6f7f8&label=%20&logo=discord&style=for-the-badge">
      <img alt="Discord online" src="https://img.shields.io/discord/917780624314613760?color=f6f7f8&label=%20&logo=discord&style=for-the-badge">
    </picture>
  </a>
  <a aria-label="Follow @mastercorg" href="https://twitter.com/mastercorg">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/static/v1?label=%20&message=twitter&color=212022&logo=twitter&style=for-the-badge">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/static/v1?label=%20&message=twitter&color=f6f7f8&logo=twitter&style=for-the-badge">
      <img alt="Follow @mastercorg" src="https://img.shields.io/static/v1?label=%20&message=twitter&color=f6f7f8&logo=twitter&style=for-the-badge">
    </picture>
  </a>
  <a aria-label="Github Actions" href="https://github.com/master-co/css/actions/workflows/ci-release.yml">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/github/actions/workflow/status/master-co/css/ci-release.yml?branch=rc&label=%20&message=twitter&color=212022&logo=githubactions&style=for-the-badge">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/github/actions/workflow/status/master-co/css/ci-release.yml?branch=rc&label=%20&message=twitter&color=f6f7f8&logo=githubactions&style=for-the-badge&logoColor=%23000">
      <img alt="Github release actions" src="https://img.shields.io/github/actions/workflow/status/master-co/css/ci-release.yml?branch=rc&label=%20&message=twitter&color=f6f7f8&logo=githubactions&style=for-the-badge&logoColor=%23000">
    </picture>
  </a>
</p>

</div>

## Installation

```bash
npm install -D @master/css-cli
```

Run the package binary directly with `npx @master/css-cli`. The package does not expose `mcss` or `mastercss` aliases.

## Commands

### `npx @master/css-cli [source paths]`

Scan source files, detect Master CSS classes, generate CSS rules, and write the generated CSS file.

```bash
npx @master/css-cli index.html main.js
```

When no source paths are passed, the CLI scans the current project with the default scanner `include` and `exclude` options.

```bash
npx @master/css-cli
```

Options:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `-o, --output <path>` | `string` | `master.css` | Generated CSS output path. |
| `-v, --verbose <level>` | `number` | `1` | Logging level. Use `0` to silence terminal output. |
| `-w, --watch` | `boolean` | `false` | Watch files and rebuild continuously. |
| `--binding <binding>` | `auto`, `native`, or `wasm` | `auto` | Select the execution binding for diagnostics and migration testing. |
| `--no-export` | `boolean` | `false` | Print generated CSS instead of writing a file. |

File-export watch mode reports missing imported stylesheets and resources while
keeping the last successful export. It retries when those files are restored,
including files in newly created directories. Source edits made during failed
dependency preparation are included when the rebuild succeeds.

Node-host file exports publish versioned CSS sidecars and content-addressed
resources before atomically replacing the entry CSS. A failed asset write or
entry replacement leaves the previous export usable. Existing sidecars are reused
only when their bytes match; conflicting files are preserved and reported as an
error. Watch mode can retry publication after permissions are restored and a source
or dependency changes. Publish the entry together with its referenced sidecars.

Each output keeps a hidden ownership journal beside its entry. Later successful
exports remove only unchanged files created by that output. Current and previous
generations are retained; older generations remain for at least 24 hours after
replacement. Another tracked output's references also prevent deletion. Existing matching
files are reused without acquiring ownership, and modified or replaced files are
preserved. Keep the journal for future builds; removing it leaves existing assets
unowned and prevents their automatic cleanup.

Cooperating CLI processes of the same OS account serialize publication and cleanup
on a local filesystem. An interrupted journal can be recovered on the next export.
A journal-finalization failure can occur after the new entry is already published;
retrying recovers that state. Cleanup failures report a warning and leave valid
output in place for a later retry. These guarantees do not cover older writers,
external edits during publication, or power-loss durability.

`--binding native` opts a one-shot scan into the Rust `mcss` executable and verifies its package, ABI, manifest, and hydration versions before execution. Watch, lint, and inspect remain on the Node host until their native parity gates pass. `MASTER_CSS_CLI_BINDING` provides the same selection for automation.

### `npx @master/css-cli lint [source paths]`

Run machine-readable Master CSS diagnostics for agents, MCP servers, editor tools, and native CI checks. JavaScript and VS Code projects should still use ESLint as the main human lint workflow; this command is a native preflight surface that shares the same class policy engine.

```bash
npx @master/css-cli lint index.html main.js
```

Use JSON output for tools:

```bash
cat src/App.tsx | npx @master/css-cli lint --exit-code never --stdin --stdin-filepath src/App.tsx
```

Options:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `--stdin` | `boolean` | `false` | Read one source buffer from stdin. |
| `--stdin-filepath <path>` | `string` | `stdin.html` | File path used to infer the stdin language. |
| `--fix` | `boolean` | `false` | Apply safe class-list fixes to files. |
| `--fix-dry-run` | `boolean` | `false` | Return fix proposals without writing files. |
| `--fix-directives` | `boolean` | `false` | Allow structural directive fixes when `--fix` writes files. |
| `--format <format>` | `json` or `stylish` | `json` | Print machine-readable diagnostics or human-readable output. |
| `--rules <rules>` | comma list | recommended | Select lint rules, `recommended`, or `all`. |
| `--exit-code <mode>` | `diagnostics` or `never` | `diagnostics` | Control whether diagnostics set a non-zero exit code. |
| `--max-warnings <number>` | `number` | none | Exit with a non-zero status when warnings exceed this count. |

The JSON report uses `version: 1`. Tooling can rely on the top-level `version`, `cwd`, `manifest`, `files`, and `summary` fields. Diagnostic `data` objects may gain additional fields as Master CSS reports become more precise.

### `npx @master/css-cli inspect [source paths]`

Inspect scanner state, managed stylesheet entries, generated CSS size, and explicit missing CSS checks. This command is for MCP servers, AI agents, build diagnostics, and support tooling that need machine-readable extraction state, not class policy linting.

```bash
npx @master/css-cli inspect --classes "btn card" --format json --exit-code never
```

Use `--classes` to ask whether specific class names are present in the generated CSS path. The report explains each checked class as `generated`, `native-css`, `safelist`, `invalid`, `blocklisted`, or `not-detected`.

The JSON report includes:

| Field | Description |
| --- | --- |
| `inputs` | Source patterns, resolved files, and explicit classes checked by this run. |
| `scanner` | Global scanner class sets, counts, safelist/blocklist counts, and reset dependencies. |
| `stylesheets` | Managed CSS entries, dependency metadata, warnings, and entry loading errors. |
| `css` | Generated CSS byte size, emitted global counts, and optional CSS text. |
| `missingCSS` | Present and missing results for `--classes`. |
| `files` | Per-file scanner discoveries for latent, valid, invalid, and native CSS classes. |
| `diagnostics` | Machine-readable `scanner`, `stylesheet`, and `missing-css` diagnostics. |
| `summary` | File, stylesheet, diagnostic, error, warning, missing CSS, and invalid class totals. |

The JSON report uses `version: 1`. Tooling can rely on the top-level `version`, `cwd`, `inputs`, `scanner`, `stylesheets`, `css`, `missingCSS`, `files`, `diagnostics`, and `summary` fields. Nested diagnostic `data` and stylesheet details may evolve unless documented for a specific diagnostic code.

Options:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `--classes <classes>` | whitespace list | none | Class names to verify against scanner state and generated CSS. |
| `--include-css` | `boolean` | `false` | Include generated CSS text in the JSON report. |
| `--format <format>` | `json` or `stylish` | `json` | Print machine-readable diagnostics or human-readable output. |
| `--exit-code <mode>` | `diagnostics` or `never` | `diagnostics` | Control whether diagnostics set a non-zero exit code. |
| `--max-warnings <number>` | `number` | none | Exit with a non-zero status when warnings exceed this count. |

### `npx @master/css-cli migrate [source paths]`

Preview the v2 RC syntax upgrade using the project's saved, resolved RC manifest:

```bash
npx @master/css-cli migrate src --manifest master.rc.manifest.json
npx @master/css-cli migrate src --manifest master.rc.manifest.json --write
```

The default manifest path is `master.rc.manifest.json`. Missing or invalid configuration
stops migration; the command never substitutes default settings after a read failure.
Length `x` conversion uses the original `baseUnit` and `rootSize`, and preserves native
resolution descriptors. Token names, declaration intent, and conditions must remain equivalent.

JSON output lists proposed `edits`, manual `review` diagnostics, and `written` status for
each file. `--write` leaves the entire selected batch unchanged if any file needs review.
Dynamic classes, selector references, ambiguous tokens, and changed cascade order must
be resolved manually. For custom definitions, supply `--target-manifest migrated.json`
to check against their migrated manifest. Repeating a completed migration produces no edits.

Follow the [Master CSS v2 RC upgrade guide](https://rc.css.master.co/guide/migration/v2-rc)
for the coordinated package, artifact, source, and hydration upgrade.

## Related docs

- [Static rendering guide](https://rc.css.master.co/guide/installation)
- [Scanner package](../scanner)
