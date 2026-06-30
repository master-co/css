# AI Notes For `@master/css-diagnostics`

## Responsibility

`@master/css-diagnostics` owns adapter-neutral project inspection reports for tooling that needs scanner state, stylesheet entry metadata, generated CSS size, and missing CSS diagnostics.

## Owns

- Project source pattern resolution for inspection runs.
- Scanner state reports and per-file discovered class summaries.
- Managed stylesheet entry diagnostics and generated CSS metadata.
- Missing CSS classification for explicit class checks.
- Stable inspection report version and top-level report shape shared by CLI and MCP adapters.

## Does Not Own

- Class lint policy, class-list edits, or source-content linting; use `@master/css-lint`.
- CLI argument parsing, stdout formatting, exit code behavior, or watch lifecycle.
- MCP tool registration, workspace write safety, or preview token validation.
- Engine class semantics, CSS output behavior, scanner extraction heuristics, or stylesheet compilation semantics.

## Public Surface

- `createMasterCSSInspectionReport`
- Inspection report, diagnostic, stylesheet, source, and missing CSS result types.

## Risk Areas

- Report shape drift between CLI and MCP consumers.
- Accidentally hiding stylesheet entry errors while scanner diagnostics still exist.
- Broadening scanner source discovery or missing CSS classification in a way that changes CLI exit behavior.
- Introducing package-boundary cycles by moving lint policy or adapter-specific behavior here.

## Validation

```sh
pnpm --filter @master/css-diagnostics test
pnpm --filter @master/css-diagnostics lint
pnpm --filter @master/css-diagnostics type-check
pnpm --filter @master/css-diagnostics build
```
