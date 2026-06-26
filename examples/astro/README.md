# Master CSS Astro example

This example uses `@master/css.astro` with its default `progressive` mode.

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
│   └── pages/
│       └── index.astro
└── package.json
```

`astro.config.js` registers `masterCSS()` with no options because progressive rendering is the default.

`src/layouts/Layout.astro` imports the Master CSS default stylesheet globally:

```astro
<style is:global>
    @import '@master/css';
</style>
```

`src/pages/index.astro` includes a small runtime hydration demo. The built HTML contains the initial classes, and the client runtime handles the class added by the button interaction.

## Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm run dev`             | Starts local dev server at `localhost:3000`      |
| `npm run build`           | Builds the production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |
