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

## Related docs

- [Static rendering guide](https://rc.css.master.co/guide/installation)
- [Scanner package](../scanner)
