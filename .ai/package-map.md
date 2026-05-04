# Package Map

## Public Packages

| Package | Entry Points | Responsibility |
|---|---|---|
| `@master/css` | `.`, `./*` | Core engine, config, rules, types, utilities |
| `@master/css-runtime` | `.` | Browser runtime, DOM observation, hydration |
| `@master/css-server` | `.` | HTML render and CSS injection |
| `@master/css-extractor` | `.`, `./options` | Static class extraction and CSS output |
| `@master/postcss` | `.` | PostCSS directives for CSS-defined variables, utilities, and components |
| `@master/css.vite` | `.` | Vite modes and plugin orchestration |
| `@master/css.webpack` | `.` | Webpack extraction plugin |
| `@master/css.astro` | `.` | Astro integration |
| `@master/css.nuxt` | `.` | Nuxt module |
| `@master/css.react` | `.` | React runtime provider |
| `@master/css.vue` | `.` | Vue runtime provider |
| `@master/css.svelte` | `.` | Svelte runtime provider and helpers |
| `@master/css-language` | `.`, `./declaration`, `./grammars` | Grammars and language declaration |
| `@master/css-language-service` | `.` | Completion, hover, colors |
| `@master/css-language-server` | `.` | LSP wrapper |
| `master-css-vscode` | `.`, `./server` | VS Code extension |
| `@master/css-validator` | `.` | CSS validation for generated rules |
| `@master/eslint-plugin-css` | `.`, `./configs/*` | ESLint plugin |
| `@master/eslint-config-css` | `.` | ESLint config wrapper |
| `@master/css-cli` | `mcss`, `mastercss` | Extract and render CLI |
| `@master/create-css` | bin | Config/app scaffolding |
| `@master/css-explore-config` | `.` | Locate and load Master CSS config |
| `@master/css-devtools-hook` | `.` | Runtime event hook |
| `@master/css.figma` | plugin bundle | Figma variable import/export |

## Dependency Direction

Do not introduce reverse dependencies from core to integrations, runtime, server, extractor, language service, ESLint, examples, or site.

## Package Tests

Most packages use package-local `vitest.config.ts` extending `shared/vitest.config.ts`. Runtime and component integrations use Playwright e2e tests where browser behavior matters.
