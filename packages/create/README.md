# @master/create-css

Add Master CSS to an existing project.

## Usage

```bash
npm create @master/css@latest -- --yes
```

or run the package directly:

```bash
npx @master/create-css@latest add --yes
```

The recommended workflow adds Master CSS to the detected framework and includes the development guardrails Master CSS expects by default:

- `@master/eslint-config-css` and `eslint.config.js`
- `@master/css-mcp` with the stdio registration command in the summary
- Master CSS guidance in `AGENTS.md`

With `--yes`, recommended defaults are accepted and dependency installation runs with the detected package manager unless `--no-install` is passed.

Without `--yes`, TTY sessions ask about ESLint, MCP, AI guidance, and dependency installation. Each prompt defaults to yes. Non-TTY sessions apply recommended defaults without installing dependencies unless `--install <package-manager>` is passed.

Use `--minimal` for core framework setup only, or disable individual recommended integrations with `--no-eslint`, `--no-mcp`, or `--no-ai`.

Without `--mode`, the installer configures static rendering. Use `--mode <mode>` when the framework integration should be configured for a specific rendering mode during setup:

```bash
npm create @master/css@latest -- --framework nextjs --mode static --yes
```

The installer accepts `static`, `runtime`, `prerender`, and `progressive` for `vite`, `react`, `react-router`, `tanstack-start`, `vue`, `nextjs`, `nuxt`, `astro`, `webpack`, `rspack`, `rsbuild`, and `lit`. The [rendering modes guide](https://css.master.co/guide/rendering-modes) explains where each integration generates CSS. `laravel` accepts `static` only; `angular` and `none` accept `static` and `runtime`. SvelteKit setup is delegated to the Svelte CLI add-on and does not accept `--mode` here.

If you do not have a project yet, create one first:

```bash
npm create vite@latest my-app
cd my-app
npm create @master/css@latest -- --yes
```

## Examples

```bash
npx @master/create-css@latest add --yes
```

```bash
npx @master/create-css@latest add --minimal
```

```bash
npx @master/create-css@latest add --no-mcp --no-ai
```

```bash
npx @master/create-css@latest add --json --minimal --eslint
```

```bash
npx @master/create-css@latest add --framework nextjs --mode runtime --yes
```

```bash
npx @master/create-css@latest add --framework webpack --mode static --yes
```

Supported `--framework` values:

```txt
auto, vite, react, react-router, tanstack-start, vue, nextjs, svelte, nuxt, astro, webpack, rspack, rsbuild, laravel, lit, angular, none
```

SvelteKit setup is delegated to the Svelte CLI add-on:

```bash
npx sv add @master/css-svelte-addon
```
