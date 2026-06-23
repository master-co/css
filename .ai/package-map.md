# Package Map

## Public Packages

| Package | Entry Points | Responsibility |
|---|---|---|
| `@master/css` | `.`, `./index.css`, `./base.css`, `./theme.css`, `./variants.css`, `./utilities.css` | Public facade over engine API, manifest types, default preset manifest, and preset stylesheet entries |
| `@master/css-engine` | `.`, `./compiler` | Browser-safe MasterCSSManifest executor, class semantics, rule generation, layers, variable and animation lifecycle |
| `@master/css-preset` | `.`, `./index.css`, `./base.css`, `./theme.css`, `./variants.css`, `./utilities.css` | Default preset CSS source and generated default manifest |
| `@master/css-lexer` | `.` | Dependency-free source ranges, directive/import scanners, lexical escaping helpers, Master class lexical tokens, and CSS unit constants |
| `@master/css-source` | `.`, `./adapters` | Source-level class candidate extraction and source-format-aware adapters, including HTML and OXC JavaScript/TypeScript scanners |
| `@master/css-compiler` | `.` | Compile Master CSS stylesheet entries into MasterCSSManifest values, directive metadata, and native CSS |
| `@master/css-runtime` | `.` | Browser runtime, DOM observation, hydration |
| `@master/css-server` | `.` | HTML render and CSS injection |
| `@master/css-scanner` | `.`, `./options` | Static source scanning, class validation, scanner caches, and generated CSS scanner state |
| `@master/css-stylesheet` | `.`, `./directives` | Stylesheet entry detection, CSS-first stylesheet compilation, native CSS pruning, generated CSS composition, and emittedGlobals manifest output |
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
| `@master/css-schema` | `.`, `./manifest`, `./manifest-json`, `./hydration-manifest`, `./css-directives`, `./css-syntax`, `./utility-type`, `./runtime-style`, `./native-css-shorthand`, `./css-common` | Public dependency-light schema, wire-format contracts, serializable constants, and pure codec helpers |
| `@master/css-project` | `./entries`, `./manifest`, `./manifest-sync` | Resolve project CSS manifest entries, workspace roots, explicit CSS manifest resources, and project manifest module source |
| `@master/css-integration` | `.`, `./client`, `./module`, `./manifest-module`, `./manifest-facade`, `./style-module`, `./emitted-globals-module`, `./manifest-loader-plugin`, `./runtime`, `./node` | Adapter-neutral integration contracts, browser-safe virtual module/codegen helpers, runtime injection source, client ambient module declarations, and explicit Node/build helper subpaths |
| `@master/css-devtools-hook` | `.` | Runtime event hook |
| `@master/css.figma` | plugin bundle | Figma variable import/export |

## Dependency Direction

Do not introduce reverse dependencies from engine to compiler, integration contracts, runtime, server, scanner, language packages, ESLint, examples, or site. `@master/css-schema` must stay dependency-light and free of compiler, engine, runtime, integration, filesystem, and framework behavior. `@master/css-lexer` must stay dependency-free from engine/compiler/scanner/language packages and should be consumed upward for lexical source ranges, scanners, tokens, and unit constants. `@master/css-source` may depend on `@master/css-lexer`, HTML parsing, and JavaScript/TypeScript source parsing, but must not depend on scanner, engine, compiler, runtime, server, language service, ESLint, or framework integrations. `@master/css-stylesheet` may compose compiler, integration protocol, validator/native CSS helpers, and structural scanner state, but must not depend on `@master/css-scanner`. `@master/css-language` must not depend on `@master/css-language-service`, `@master/css-language-server`, or editor extensions. `@master/css-integration` may depend on `@master/css-schema` and `@master/css-engine` types, must remain below compiler/project/build integrations, and must keep browser-safe subpaths free of Node globals and `node:*` imports. The compiler may depend on the manifest-driven engine for class semantics and must not recreate a public Config contract.

## Package Tests

Most packages use package-local `vitest.config.ts` extending the repo-internal `shared/vitest.config.ts`. Runtime and component integrations use Playwright e2e tests where browser behavior matters.
