# Public API Rearchitecture

Date: 2026-07-24
Status: complete

## Decision

Master CSS will ship one breaking major across every published package. The
refactor changes JavaScript, TypeScript, CLI, MCP, package, subpath, lifecycle,
and binding contracts. It does not change class syntax, directive semantics,
Manifest v1, hydration semantics, cascade layers, or generated CSS bytes.

Public APIs are allowlists. A source file being reusable inside the repository
does not make it a supported export.

## Package disposition

| Former identity | Owner | Platform | Lifetime | Disposition |
| --- | --- | --- | --- | --- |
| `@master/css-schema` | Serializable contracts and codecs | Universal | Value | Retain; remove root wildcard and raw wire IR |
| `@master/css-native` → `@master/css-backend` | Native loader and generated binding facade | Node | Process/session | Consolidate as `@master/css-binding`; load native and Wasm bindings |
| `@master/css-wasm-runtime` → `@master/css-wasm-engine` | Engine Wasm artifact | Browser/Node | Module/session | Consolidate as `@master/css-binding-wasm-engine` |
| `@master/css-internal-integration` | Official adapter implementation | Node/browser build hosts | Build session | Rename to private `@master/css-internal` |
| `@master/css-sv` | Svelte CLI add-on | Node CLI | Command | Rename to `@master/css-svelte-addon` |
| `@master/eslint-config-css` | Thin official flat-config entrypoint | Node | Value | Retain; delegate to plugin-owned `configs.recommended` |
| `@master/css` | Manifest execution | Universal + Node subpath | Engine/render session | Retain and strictly whitelist |
| `@master/css-compiler` | Compiler/project/stylesheet orchestration | Universal + Node subpaths | Compiler/project session | Retain and separate platform entries |
| `@master/css-tooling` | Lexer/source/scanner/validator/lint/language primitives | Universal + Node subpaths | Tooling/scanner session | Retain; scanner is Node-only |
| `@master/css-runtime` | DOM/CSSOM host | Browser | Runtime session | Retain; expose immutable state |
| `@master/css-server` | HTML rendering and injection | Node | Renderer/document session | Replace the public surface |
| language service/server | Editor features and LSP host | Universal/Node | Service/server | Retain and brand |
| framework packages | Ecosystem lifecycle adapters | Framework-defined | Build/server lifecycle | Retain; use the private build kernel |
| CLI/MCP/create | User-facing hosts | Node | Command/server/plan | Retain; version their result contracts |

Native target packages remain artifact packages and adopt the
`@master/css-binding-<target>` family name.

## Public contract rules

- Classes, sessions, errors, and result contracts use the `MasterCSS` prefix.
- Factories use `create*`; host wrappers use `with*`.
- Universal entries never statically import Node built-ins.
- Sync functions exist only in Node entries and end in `Sync`.
- Low-level functions require an explicit manifest.
- One-shot functions own and dispose their temporary sessions.
- Long-lived objects implement `dispose()` and the appropriate disposal symbol.
- Results are immutable values; mutable maps, sets, DOM nodes, generated
  bindings, and Rust wire IR remain internal.
- Diagnostics use `MasterCSSDiagnostic`; fatal failures use `MasterCSSError`.
- Native and Wasm expose the same versioned feature protocol.
- Default exports are reserved for ecosystem entrypoint conventions.

## High-risk existing exports

| Surface | Existing problem | Replacement |
| --- | --- | --- |
| Schema root | Re-exports compiler, tooling, lint, language, and binding IR | Manifest, diagnostics, integration, and binding metadata allowlist |
| CSS root | Re-exports all schema types | Engine-owned values only |
| Compiler root | Statically imports filesystem and package resolution | Universal compiler root; Node project/provider subpaths |
| Tooling root | Exports filesystem scanner and preset-backed defaults | Universal tooling session; scanner under `scanner/node` |
| Server root | Returns live `ServerCSS` and DOM nodes | Immutable `renderHTML` result and disposable renderer/session |
| Runtime root | Exposes mutable registries and implementation layers | `MasterCSSRuntime` with immutable `snapshot()` |
| Language roots | Generic `CSS*` names and wildcard common exports | Branded named exports |
| Vite root | Exposes mutable `PluginContext` and default options | Named plugin factory and option contract |
| CLI | Implicit root scan and two user-visible executables | One `master-css` binary with explicit commands |
| Installer | Plan-and-write convenience and shell command strings | Preconditioned plan followed by explicit apply |

## Implementation order

1. Schema diagnostics/integration contracts and binding ABI.
2. Binding loader and artifact identities.
3. Engine/render, compiler, and tooling ownership.
4. Runtime, server, language, and ESLint public surfaces.
5. Private build kernel and official adapters.
6. CLI, MCP, installer, applications, documentation, and removal checks.

Each slice updates all direct consumers before deleting its former exports.

## Completion contract

The machine-readable baseline is split into two coordinated contracts:

- `.ai/contracts/public-api.json` records every published package, subpath, bin,
  and source-level export symbol.
- `.ai/contracts/api-census.json` expands that baseline with ownership,
  responsibility, consumers, platform, lifecycle, visibility, disposition, CLI
  commands, MCP tools/resources/prompts, and versioned wire contracts.

`pnpm check:packages` regenerates the actual view from package manifests and the
CLI/MCP/wire registries, then fails if either checked-in contract differs. The same
gate rejects wildcard exports, retired compatibility symbols, public binding IR,
raw native/Wasm session symbols, misplaced sync APIs, and untyped binding feature
contracts.

`pnpm check:artifacts` validates built publish allowlists and declaration references,
then walks every universal, browser, and conditional-browser artifact graph. Those
graphs may not reach Node built-ins, native loaders, `.node` artifacts, Node
subpaths, private integration specifiers, retired packages, binding IR, or generated
binding declarations.

`pnpm check:runtime-size` compares `packages/runtime/dist/global.min.js` against the
checked-in raw, gzip, and brotli baseline. Each format may grow by at most the larger
of 1 KiB or 1%.

No public migration guide or deprecated mapping is part of this reconstruction.
Manifest v1, hydration v1, binding ABI 5, layer order, and generated CSS bytes remain
the compatibility invariants.
