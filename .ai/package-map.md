# Package Map

## Public Packages

| Package | Entry Points | Responsibility |
|---|---|---|
| `@master/css` | `.`, `./index.css`, `./normal.css`, `./*` | Core engine, config, rules, types, utilities, default stylesheet |
| `@master/css-compiler` | `.` | Compile Master CSS stylesheet entries into semantic config, directive metadata, and native CSS |
| `@master/css-runtime` | `.` | Browser runtime, DOM observation, hydration |
| `@master/css-server` | `.` | HTML render and CSS injection |
| `@master/css-extractor` | `.`, `./options`, `./style` | Static class extraction, CSS output, and extraction-specific stylesheet helpers |
| `@master/postcss` | `.` | PostCSS directives for CSS-defined variables, utilities, and components |
| `@master/css.vite` | `.` | Vite modes and plugin orchestration |
| `@master/css.webpack` | `.` | Webpack extraction plugin |
| `@master/css.astro` | `.` | Astro integration |
| `@master/css.nuxt` | `.` | Nuxt module |
| `@master/css.react` | `.`, `./runtime-provider` | React runtime registry, provider, and hooks |
| `@master/css.vue` | `.`, `./runtime-provider`, `./adapter`, `./vite` | Vue runtime registry, provider, and Vue SFC extraction adapter |
| `@master/css.svelte` | `.`, `./runtime-provider`, `./adapter`, `./vite`, `./hooks.server` | Svelte runtime registry, provider, SvelteKit hook, Vite wrapper, and Svelte source adapter |
| `@master/css-language` | `.`, `./declaration`, `./grammars` | Grammars and language declaration |
| `@master/css-language-service` | `.` | Completion, hover, colors |
| `@master/css-language-server` | `.` | LSP wrapper |
| `master-css-vscode` | `.`, `./server` | VS Code extension |
| `@master/css-validator` | `.` | CSS validation for generated rules |
| `@master/eslint-plugin-css` | `.`, `./configs/*` | ESLint plugin |
| `@master/eslint-config-css` | `.` | ESLint config wrapper |
| `@master/css-cli` | `mcss`, `mastercss` | Extract and render CLI |
| `@master/css-configer` | `./css`, `./load`, `./load-sync`, `./module` | Resolve project CSS config entries, workspace roots, query modules, and virtual config modules |
| `@master/css-devtools-hook` | `.` | Runtime event hook |
| `@master/css.figma` | plugin bundle | Figma variable import/export |

## Dependency Direction

Do not introduce reverse dependencies from core to compiler, integrations, runtime, server, extractor, language service, ESLint, examples, or site. The compiler may depend on core to convert CSS directive results into semantic `Config` values.

## Package Tests

Most packages use package-local `vitest.config.ts` extending `shared/vitest.config.ts`. Runtime and component integrations use Playwright e2e tests where browser behavior matters.
