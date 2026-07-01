# Package Map

## Public Packages

| Package | Entry Points | Responsibility |
|---|---|---|
| `@master/css` | `.`, `./index.css`, `./base.css`, `./theme.css`, `./variants.css`, `./utilities.css` | Public facade over engine API, manifest types, default preset manifest, and preset stylesheet entries |
| `@master/css-engine` | `.`, `./compiler`, `./inspect` | Browser-safe MasterCSSManifest executor, class semantics, rule generation, layers, variable and animation lifecycle |
| `@master/css-preset` | `.`, `./default-manifest.json`, `./index.css`, `./base.css`, `./theme.css`, `./variants.css`, `./utilities.css` | Default preset CSS source and generated default manifest |
| `@master/css-lexer` | `.` | Dependency-free source ranges, directive/import scanners, lexical escaping helpers, Master class lexical tokens, and CSS unit constants |
| `@master/css-source` | `.`, `./adapters`, `./adapters/astro`, `./adapters/svelte`, `./adapters/vue` | Source-level class candidate extraction and source-format-aware adapters, including HTML, OXC JavaScript/TypeScript, Astro, Svelte, and Vue scanners |
| `@master/css-compiler` | `.`, `./browser` | Compile Master CSS stylesheet entries into MasterCSSManifest values, directive metadata, and native CSS |
| `@master/css-runtime` | `.` | Browser runtime, DOM observation, hydration |
| `@master/css-server` | `.` | HTML render and CSS injection |
| `@master/css-scanner` | `.`, `./options` | Static source scanning, class validation, scanner caches, and generated CSS scanner state |
| `@master/css-stylesheet` | `.`, `./browser`, `./directives` | Stylesheet entry detection, CSS-first stylesheet compilation, native CSS pruning, generated CSS composition, and emittedGlobals manifest output |
| `@master/css.vite` | `.`, `./runtime` | Vite modes and plugin orchestration |
| `@master/css.webpack` | `.` | Webpack integration, runtime script injection, and extraction plugin |
| `@master/css.next` | `.`, `./adapter` | Next.js integration and client instrumentation runtime injection |
| `@master/css.astro` | `.`, `./middleware` | Astro integration |
| `@master/css.nuxt` | `.` | Nuxt module |
| `@master/css.svelte` | `./vite`, `./hooks.server` | SvelteKit hook and Vite wrapper |
| `@master/css-language` | `.`, `./browser`, `./shiki`, `./syntaxes/master-css.tmLanguage.json` | Editor-neutral language primitives, class-position scanning, semantic tokens, browser helpers, Shiki helpers, and shared TextMate grammar |
| `@master/css-language-service` | `.`, `./common` | Stateful language service wrapper for completion, hover, colors, semantic token methods, and `TextDocument` feature gating |
| `@master/css-language-server` | `.`, `./server` | LSP wrapper and active/full semantic token request handling |
| `master-css-vscode` | `.`, `./server` | VS Code extension |
| `@master/css-validator` | `.`, `./native-declaration` | CSS validation for generated rules |
| `@master/css-diagnostics` | `.` | Adapter-neutral project inspection reports for scanner state, stylesheet entries, generated CSS metadata, and missing CSS diagnostics |
| `@master/css-lint` | `.` | Framework-neutral Master CSS class lint policy helpers |
| `@master/eslint-plugin-css` | `.`, `./configs/*` | ESLint plugin |
| `@master/eslint-config-css` | `.` | ESLint config wrapper |
| `@master/css-cli` | package-name binary | Root scan/extract CLI |
| `@master/css-mcp` | `.`, `./server` | Model Context Protocol server and tools for AI clients |
| `@master/css-schema` | `.`, `./manifest`, `./manifest-json`, `./hydration-manifest`, `./css-directives`, `./css-syntax`, `./utility-type`, `./runtime-style`, `./native-css-shorthand`, `./css-common` | Public dependency-light schema, wire-format contracts, serializable constants, and pure codec helpers |
| `@master/css-project` | `./entries`, `./manifest`, `./manifest-sync`, `./workspace` | Resolve project CSS manifest entries, workspace roots, explicit CSS manifest resources, and project manifest module source |
| `@master/css-integration` | `.`, `./client`, `./module`, `./manifest-module`, `./manifest-facade`, `./style-module`, `./emitted-globals-module`, `./node` | Adapter-neutral integration contracts, browser-safe virtual module/codegen helpers, client ambient module declarations, and explicit Node helper subpaths |
| `@master/css.figma` | plugin bundle | Figma variable import/export |

## Dependency Direction

Do not introduce reverse dependencies from engine to compiler, integration contracts, runtime, server, scanner, language packages, ESLint, examples, or site. `@master/css-schema` must stay dependency-light and free of compiler, engine, runtime, integration, filesystem, and framework behavior. `@master/css-lexer` must stay dependency-free from engine/compiler/scanner/language packages and should be consumed upward for lexical source ranges, scanners, tokens, and unit constants. `@master/css-source` may depend on `@master/css-lexer`, HTML parsing, and JavaScript/TypeScript source parsing, but must not depend on scanner, engine, compiler, runtime, server, language service, ESLint, or framework integrations. `@master/css-lint` may depend on engine/schema/validator semantics but must not depend on ESLint, project resolution, filesystem access, scanner, language service, runtime, or framework packages. `@master/css-stylesheet` may compose compiler, integration protocol, validator/native CSS helpers, and structural scanner state, but must not depend on `@master/css-scanner`. `@master/css-diagnostics` may compose project discovery, scanner state, and stylesheet report helpers for tooling reports, and must not own lint policy or adapter-specific CLI/MCP behavior. `@master/css-language` must not depend on `@master/css-language-service`, `@master/css-language-server`, or editor extensions. `@master/css-integration` may depend on `@master/css-schema` and `@master/css-engine` types, must remain below compiler/project/build integrations, and must keep browser-safe subpaths free of Node globals and `node:*` imports. The compiler may depend on the manifest-driven engine for class semantics and must not recreate a public Config contract.

## Package Tests

Most packages use package-local `vitest.config.ts` extending the repo-internal `shared/vitest.config.ts`. Runtime and component integrations use Playwright e2e tests where browser behavior matters.

Runtime script injection, runtime script preload, manifest JSON preload, mode defaults, and cascade-layer initialization are cross-integration behavior. Changes in one build/framework integration must audit Vite, Webpack, Next, Nuxt, and Astro and update package-local `AI.md` files or tests when behavior intentionally differs.
