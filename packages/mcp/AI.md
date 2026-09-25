# AI Notes For `@master/css-mcp`

## Responsibility

`@master/css-mcp` exposes high-level Master CSS tools through the Model Context Protocol for AI clients.

## Owns

- MCP server lifecycle and stdio transport wiring.
- MCP tool, resource, and prompt registration.
- Version 3 fixed-object envelopes with required result unions, concrete payload schemas, identical JSON/structuredContent and isError on failures.
- Project context by default; manifest load failure never falls back to a preset. Metadata records actual context and unavailable values explicitly.
- Workspace root containment and two-step write confirmation for generated fixes.
- Tool-oriented orchestration around existing project, scanner, stylesheet, language-service, lint, validator, server, and engine APIs.
- Contributor routing across npm workspaces and Rust crates, including Cargo manifests, crate-local AI notes, risk packs, and scoped validation commands.

- Utility queries expose language v3 fixed raw keys, enum names and token families; never suggest typed raw matchers, colon enums or `=namespace`.

## Does Not Own

- Engine class semantics, CSS output, priority, variables, modes, or generated rule ordering.
- Runtime DOM observation or browser bundle behavior.
- Scanner extraction heuristics, source adapters, or validation semantics.
- Language service completion/hover logic.
- CLI command behavior or output contracts.

## Public Surface

- Binary: `master-css-mcp`.
- Root exports `createMasterCSSMCPServer` and
  `startMasterCSSMCPStdioServer`.

## Risk Areas

- Writing files from AI tool calls; require preview token validation and workspace containment.
- Accidentally logging to stdout in stdio mode.
- Importing private CLI implementation files instead of lower package public APIs.
- Broad file glob inputs escaping the configured workspace root.
- Rust crate paths falling back to repo-root context instead of `.ai/context/rust-routing.md`.

## Validation

```sh
pnpm --filter @master/css-mcp test
pnpm --filter @master/css-mcp lint
pnpm --filter @master/css-mcp type-check
pnpm --filter @master/css-mcp build
```
