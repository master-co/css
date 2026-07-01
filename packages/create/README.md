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

The default workflow plans and applies project-local setup changes. Dependency installation only runs when `--install` or `--yes` is passed.

If you do not have a project yet, create one first:

```bash
npm create vite@latest my-app
cd my-app
npm create @master/css@rc -- --yes
```

## Examples

```bash
npx @master/create-css@rc add --eslint --yes
```

```bash
npx @master/create-css@rc add --json --eslint --mcp
```

Supported `--framework` values:

```txt
auto, vite, react, nextjs, svelte, nuxt, astro, webpack, laravel, lit, angular, none
```

SvelteKit setup is delegated to the Svelte CLI add-on:

```bash
npx sv add @master/css-sv
```
