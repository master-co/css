# @master/create-css

Add Master CSS to an existing project.

## Usage

```bash
npm create @master/css@rc -- --yes
```

or run the package directly:

```bash
npx @master/create-css@rc add --yes
```

The recommended workflow adds Master CSS to the detected framework and includes the development guardrails Master CSS expects by default:

- `@master/eslint-config-css` and `eslint.config.js`
- `@master/css-mcp` with the stdio registration command in the summary
- Master CSS guidance in `AGENTS.md`

With `--yes`, recommended defaults are accepted and dependency installation runs with the detected package manager unless `--no-install` is passed.

Without `--yes`, TTY sessions ask about ESLint, MCP, AI guidance, and dependency installation. Each prompt defaults to yes. Non-TTY sessions apply recommended defaults without installing dependencies unless `--install <package-manager>` is passed.

Use `--minimal` for core framework setup only, or disable individual recommended integrations with `--no-eslint`, `--no-mcp`, or `--no-ai`.

If you do not have a project yet, create one first:

```bash
npm create vite@latest my-app
cd my-app
npm create @master/css@rc -- --yes
```

## Examples

```bash
npx @master/create-css@rc add --yes
```

```bash
npx @master/create-css@rc add --minimal
```

```bash
npx @master/create-css@rc add --no-mcp --no-ai
```

```bash
npx @master/create-css@rc add --json --minimal --eslint
```

Supported `--framework` values:

```txt
auto, vite, react, react-router, vue, nextjs, svelte, nuxt, astro, webpack, laravel, lit, angular, none
```

SvelteKit setup is delegated to the Svelte CLI add-on:

```bash
npx sv add @master/css-sv
```
