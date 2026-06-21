# Package Map

## Public Packages

| Package | Entry Points | Responsibility |
|---|---|---|
| `@master/css` | `.`, `./index.css`, `./base.css`, `./theme.css`, `./variants.css`, `./utilities.css` | Public facade over engine API, plan types, default preset plan, and preset stylesheet entries |
| `@master/css-engine` | `.`, `./compiler` | Browser-safe MasterCSSPlan executor, class semantics, rule generation, layers, variable and animation lifecycle |
| `@master/css-preset` | `.`, `./index.css`, `./base.css`, `./theme.css`, `./variants.css`, `./utilities.css` | Default preset CSS source and generated default plan |
| `@master/css-lexer` | `.` | Dependency-free source ranges, directive/import scanners, Master class lexical tokens, and CSS unit constants |
| `@master/css-source` | `.`, `./adapters` | Source-level class candidate extraction and source-format-aware adapters, including HTML and OXC JavaScript/TypeScript scanners |
| `@master/css-compiler` | `.` | Compile Master CSS stylesheet entries into MasterCSSPlan values, directive metadata, and native CSS |
| `@master/css-runtime` | `.` | Browser runtime, DOM observation, hydration |
| `@master/css-server` | `.` | HTML render and CSS injection |
| `@master/css-extractor` | `.`, `./options` | Static source scanning, class validation, watch/cache state, and generated CSS extraction state |
| `@master/css-stylesheet` | `.`, `./directives` | Stylesheet entry detection, CSS-first stylesheet compilation, native CSS pruning, generated CSS composition, and preloaded manifest output |
| `@master/postcss` | `.` | PostCSS directives for CSS-defined variables, utilities, and components |
| `@master/css.vite` | `.` | Vite modes and plugin orchestration |
| `@master/css.webpack` | `.` | Webpack extraction plugin |
| `@master/css.astro` | `.` | Astro integration |
| `@master/css.nuxt` | `.` | Nuxt module |
| `@master/css.react` | `.`, `./runtime-provider` | React runtime registry, provider, and hooks |
| `@master/css.vue` | `.`, `./runtime-provider`, `./adapter`, `./vite` | Vue runtime registry, provider, and Vue SFC extraction adapter |
| `@master/css.svelte` | `.`, `./runtime-provider`, `./adapter`, `./vite`, `./hooks.server` | Svelte runtime registry, provider, SvelteKit hook, Vite wrapper, and Svelte source adapter |
| `@master/css-language` | `.`, `./browser`, `./shiki`, `./syntaxes/master-css.tmLanguage.json` | Editor-neutral language primitives, class-position scanning, semantic tokens, browser helpers, Shiki helpers, and shared TextMate grammar |
| `@master/css-language-service` | `.` | Stateful language service wrapper for completion, hover, colors, semantic token methods, and `TextDocument` feature gating |
| `@master/css-language-server` | `.` | LSP wrapper and active/full semantic token request handling |
| `master-css-vscode` | `.`, `./server` | VS Code extension |
| `@master/css-validator` | `.` | CSS validation for generated rules |
| `@master/eslint-plugin-css` | `.`, `./configs/*` | ESLint plugin |
| `@master/eslint-config-css` | `.` | ESLint config wrapper |
| `@master/css-cli` | `mcss`, `mastercss` | Extract and render CLI |
| `@master/css-plan` | `./css`, `./load`, `./load-sync` | Resolve project CSS plan entries, workspace roots, explicit CSS plan resources, and project plan module source |
| `@master/css-integration` | `.`, `./client`, `./module`, `./plan-module`, `./style-module`, `./preloaded-module`, `./plan-loader-plugin`, `./runtime`, `./node` | Adapter-neutral integration contracts, virtual module ids, generated module source helpers, runtime injection source, and client ambient module declarations |
| `@master/css-devtools-hook` | `.` | Runtime event hook |
| `@master/css.figma` | plugin bundle | Figma variable import/export |

## Dependency Direction

Do not introduce reverse dependencies from engine to compiler, integration contracts, runtime, server, extractor, language packages, ESLint, examples, or site. `@master/css-lexer` must stay dependency-free from engine/compiler/extractor/language packages and should be consumed upward for lexical source ranges, scanners, tokens, and unit constants. `@master/css-source` may depend on `@master/css-lexer`, HTML parsing, and JavaScript/TypeScript source parsing, but must not depend on extractor, engine, compiler, runtime, server, language service, ESLint, or framework integrations. `@master/css-stylesheet` may compose compiler, integration protocol, validator/native CSS helpers, and structural extractor state, but must not depend on `@master/css-extractor`. `@master/css-language` must not depend on `@master/css-language-service`, `@master/css-language-server`, or editor extensions. `@master/css-integration` may depend on shared plan types and must remain below compiler/plan/build integrations. The compiler may depend on the plan-driven engine for class semantics and must not recreate a public Config contract.

## Package Tests

Most packages use package-local `vitest.config.ts` extending `shared/vitest.config.ts`. Runtime and component integrations use Playwright e2e tests where browser behavior matters.
