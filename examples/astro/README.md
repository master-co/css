# Master CSS Astro example

This example selects `progressive` mode in `@master/css-astro`. Astro also supports `static` (the default), `runtime`, and `prerender`. Both `prerender` and `progressive` render CSS from Astro's HTML.

The integration:

- pre-renders initial page CSS into `<style id="master-css">`
- injects the Master CSS runtime
- hydrates the pre-rendered stylesheet in the browser
- generates CSS for class names that appear after the initial HTML

## Project structure

```
/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   └── Card.astro
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   └── index.astro
│   └── styles/
│       └── global.css
└── package.json
```

`astro.config.js` registers `masterCSS({ mode: 'progressive' })` to enable server rendering and browser hydration for this example.

`src/layouts/Layout.astro` imports `../styles/global.css`, which loads the Master CSS default stylesheet:

```css
@import '@master/css';
```

`src/pages/index.astro` includes a small runtime hydration demo. The built HTML contains the initial classes, and the client runtime handles the class added by the button interaction.

## Commands

Install and build the workspace packages from the repository root, then enter this example:

```sh
bun install --frozen-lockfile
bun run build
cd examples/astro
```

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `bun run dev`             | Starts local dev server at `localhost:4321`      |
| `bun run build`           | Builds the production site to `./dist/`          |
| `bun run preview`         | Preview your build locally, before deploying     |
| `bun run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `bun run astro -- --help` | Get help using the Astro CLI                     |
