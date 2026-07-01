# @master/create-css

Add Master CSS to an existing project.

## Usage

```bash
npm create @master/css@rc
```

or run the package directly:

```bash
npx @master/create-css@rc add
```

The default workflow plans and applies project-local setup changes. Dependency installation only runs when `--install` or `--yes` is passed.

## Examples

```bash
npx @master/create-css@rc add --framework vite --eslint
```

```bash
npx @master/create-css@rc add --dry-run --json --eslint --mcp
```

SvelteKit setup is delegated to the Svelte CLI add-on:

```bash
npx sv add @master/css-sv
```
