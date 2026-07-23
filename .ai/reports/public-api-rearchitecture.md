# Public API Rearchitecture

Date: 2026-07-23
Status: implementation contract

## Decision

Master CSS will ship one breaking major across every published package. The
refactor changes JavaScript, TypeScript, CLI, MCP, package, subpath, lifecycle,
and backend contracts. It does not change class syntax, directive semantics,
Manifest v1, hydration semantics, cascade layers, or generated CSS bytes.

Public APIs are allowlists. A source file being reusable inside the repository
does not make it a supported export.

## Package disposition

| Current identity | Owner | Platform | Lifetime | Disposition |
| --- | --- | --- | --- | --- |
| `@master/css-schema` | Serializable contracts and codecs | Universal | Value | Retain; remove root wildcard and raw wire IR |
| `@master/css-native` | Native loader and generated binding facade | Node | Process/session | Rename to `@master/css-backend`; broker native and Wasm |
| `@master/css-wasm-runtime` | Engine Wasm artifact | Browser/Node | Module/session | Rename to `@master/css-wasm-engine` |
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

Native target packages remain artifact packages. Their platform-specific names
are not renamed.

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
| Schema root | Re-exports compiler, tooling, lint, language, and binding IR | Manifest, diagnostics, integration, and backend metadata allowlist |
| CSS root | Re-exports all schema types | Engine-owned values only |
| Compiler root | Statically imports filesystem and package resolution | Universal compiler root; Node project/provider subpaths |
| Tooling root | Exports filesystem scanner and preset-backed defaults | Universal tooling session; scanner under `scanner/node` |
| Server root | Returns live `ServerCSS` and DOM nodes | Immutable `renderHTML` result and disposable renderer/session |
| Runtime root | Exposes mutable registries and implementation layers | `MasterCSSRuntime` with immutable `snapshot()` |
| Language roots | Generic `CSS*` names and wildcard common exports | Branded named exports |
| Vite root | Exposes mutable `PluginContext` and default options | Named plugin factory and option contract |
| CLI | Implicit root scan and two user-visible executables | One `master-css` binary with explicit commands |
| Installer | Plan-and-write convenience and shell command strings | Preconditioned plan followed by explicit apply |

## Migration order

1. Schema diagnostics/integration contracts and backend ABI.
2. Backend broker and artifact identities.
3. Engine/render, compiler, and tooling ownership.
4. Runtime, server, language, and ESLint public surfaces.
5. Private build kernel and official adapters.
6. CLI, MCP, installer, applications, documentation, and removal checks.

Each slice updates all direct consumers before deleting its former exports.
