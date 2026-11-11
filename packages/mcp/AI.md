# AI Notes For `@master/css-mcp`

## Responsibility

`@master/css-mcp` exposes high-level Master CSS tools through the Model Context Protocol for AI clients.

## Owns

- MCP server lifecycle and stdio transport wiring.
- MCP tool, resource, and prompt registration.
- `migrate-to-mastercss` plans external styling-system conversions to current Master CSS only.
- Public MCP docs may list this prompt's name and external-system purpose. Detailed conversion workflows and comparisons belong only in the site's Migration Guide.
- Version 3 fixed-object envelopes with required result unions, concrete payload schemas, identical JSON/structuredContent and isError on failures.
- Project context by default; manifest load failure never falls back to a preset. Metadata records actual context and unavailable values explicitly.
- Workspace root containment and two-step write confirmation for generated fixes.
- Tool-oriented orchestration around existing project, scanner, stylesheet, language-service, lint, validator, server, and engine APIs.
- Utility queries expose native properties, explicit utility recipes and named token families.
- `suggest_classes` delegates isolated CSS declaration suggestions to Rust lint through tooling; it is read-only and does not prove cascade or browser equivalence.
- Contract tools (`contract_list`, `contract_get`, `contract_check`) serve a design system's component contracts through a package.json protocol: `masterCSS.contracts` and optional `masterCSS.check` in declared dependencies (falling back to the monorepo root's dependencies) or the workspace's own package.json, merged with project-owned contract files. Checkers run in a worker thread with a time and memory limit, never in the server's own thread. The server names no design system and must not import one.
- Optional `scan_project.designSystem` passes metadata and native declaration policy to compiler-owned project inspection; it returns the Rust report and authored source graph without changing CSS or runtime programs.

## Does Not Own

- Engine class semantics, CSS output, priority, variables, modes, or generated rule ordering.
- Runtime DOM observation or browser bundle behavior.
- Scanner extraction heuristics, source adapters, or validation semantics.
- Language service completion/hover logic.
- CLI command behavior or output contracts.
- The vocabulary or semantics of a design system's contracts, or its checker's diagnostics; only `name` and `classes` are read.
- Master CSS repository contributor routing; use the repository-local `scripts/contributor-context.mjs` and canonical `.ai/context/` guidance.

## Public Surface

- Binary: `master-css-mcp`.
- Root exports `createMasterCSSMCPServer` and
  `startMasterCSSMCPStdioServer`.

## Risk Areas

- Writing files from AI tool calls; require preview token validation and workspace containment.
- Accidentally logging to stdout in stdio mode.
- Importing private CLI implementation files instead of lower package public APIs.
- Broad file glob inputs escaping the configured workspace root.
- Importing a contract checker: only from a declared dependency of the workspace root and a path inside that package; never from a project contract file. A checker runs in the server process, so its console output is kept off stdout.

## Validation

```sh
bun run --filter @master/css-mcp test
bun run --filter @master/css-mcp lint
bun run --filter @master/css-mcp type-check
bun run --filter @master/css-mcp build
```
