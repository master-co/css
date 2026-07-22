# Package Map

## Public Packages

| Package | Entry Points | Responsibility |
|---|---|---|
| `@master/css` | `.`, `./index.css`, `./base.css`, `./theme.css`, `./variants.css`, `./utilities.css` | Public facade over engine API, manifest types, default preset manifest, and preset stylesheet entries |
| `@master/css-engine` | `.`, `./node` | Rust-backed Manifest v1 engine session, inspection/transition/snapshot IR, rule generation, layers, and resource lifecycle |
| `@master/css-preset` | `.`, `./default-manifest.json`, `./index.css`, `./base.css`, `./theme.css`, `./variants.css`, `./utilities.css` | Default preset CSS source and generated default manifest |
| `@master/css-lexer` | `.`, `./node`, `./browser`, `./shiki` | Rust-backed batched lexical analysis; generated constants/types; Shiki-only asset helpers |
| `@master/css-source` | `.`, `./node`, `./browser`, `./adapters`, `./adapters/astro`, `./adapters/svelte`, `./adapters/vue` | Rust-backed raw/HTML/JS/TS/Astro extraction plus thin official-parser adapters for Svelte and Vue |
| `@master/css-compiler` | `.`, `./node`, `./browser` | Rust-backed directive lowering, Manifest v1 compilation, normalization, native CSS transform, and provider-neutral graph analysis |
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
| `@master/css-sv` | `.` | Svelte CLI add-on for one-time SvelteKit project setup |
| `@master/css-language` | `.`, `./node`, `./browser`, `./shiki`, `./syntaxes/master-css.tmLanguage.json` | Rust-backed document intelligence and IR plus LSP/editor adapters, Shiki helpers, and shared TextMate grammar |
| `@master/css-language-service` | `.`, `./common` | Stateful language service wrapper for completion, hover, colors, semantic token methods, and `TextDocument` feature gating |
| `@master/css-language-server` | `.`, `./server` | LSP wrapper and active/full semantic token request handling |
| `master-css-vscode` | `.`, `./server` | VS Code extension |
| `@master/css-validator` | `.`, `./node`, `./native-declaration` | Rust-generated validation IR with a TypeScript host CSS capability oracle |
| `@master/css-diagnostics` | `.` | Adapter-neutral project inspection reports for scanner state, stylesheet entries, generated CSS metadata, and missing CSS diagnostics |
| `@master/css-lint` | `.`, `./node` | Rust-owned framework-neutral class lint policy, diagnostics, and edit plans |
| `@master/eslint-plugin-css` | `.`, `./configs/*` | ESLint plugin |
| `@master/eslint-config-css` | `.` | ESLint config wrapper |
| `@master/css-cli` | package-name binary | Root scan/extract CLI |
| `@master/create-css` | `.` | Add-first installer for applying Master CSS, ESLint config, MCP, and AI guidance to existing projects |
| `@master/css-mcp` | `.`, `./server` | Model Context Protocol server and tools for AI clients |
| `@master/css-schema` | `.`, `./manifest`, `./manifest-json`, `./hydration-manifest`, `./css-directives`, `./css-syntax`, `./utility-type`, `./runtime-style`, `./native-css-shorthand`, `./css-common` | Public dependency-light schema, wire-format contracts, serializable constants, and pure codec helpers |
| `@master/css-project` | `./entries`, `./manifest`, `./manifest-sync`, `./workspace` | Resolve project CSS manifest entries, workspace roots, explicit CSS manifest resources, and project manifest module source |
| `@master/css-integration` | `.`, `./client`, `./module`, `./manifest-module`, `./manifest-facade`, `./style-module`, `./emitted-globals-module`, `./node` | Adapter-neutral integration contracts, browser-safe virtual module/codegen helpers, client ambient module declarations, and explicit Node helper subpaths |
| `@master/css.figma` | plugin bundle | Figma variable import/export |

## Dependency Direction

Do not introduce reverse dependencies from engine to compiler, integration contracts, runtime, server, scanner, language packages, ESLint, examples, or site. `@master/css-schema` must stay dependency-light and own versioned Rust/TypeScript wire contracts. Lexer, source, engine, compiler, project, scanner, lint, language, diagnostics, and validator semantics live in Rust crates and their split native/Wasm surfaces; TypeScript packages may adapt platform IO and host APIs but must not implement a semantic fallback. `@master/css-stylesheet` may compose compiler, integration protocol, host validation, and structural scanner state, but must not depend on `@master/css-scanner`. `@master/css-language` must not depend on language service, language server, or editor extensions. `@master/css-integration` depends on schema types, not engine implementation, and browser-safe subpaths must remain free of Node globals and `node:*` imports.

## Package Tests

Most packages use package-local `vitest.config.ts` extending the repo-internal `shared/vitest.config.ts`. Runtime and component integrations use Playwright e2e tests where browser behavior matters.

Runtime script injection, runtime script preload, manifest JSON preload, mode defaults, and cascade-layer initialization are cross-integration behavior. Changes in one build/framework integration must audit Vite, Webpack, Next, Nuxt, and Astro and update package-local `AI.md` files or tests when behavior intentionally differs.
