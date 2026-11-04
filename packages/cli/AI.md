# AI Notes For `@master/css-cli`

## Responsibility

`@master/css-cli` exposes the `master-css` binary with explicit `generate`, `lint`,
`inspect` and `suggest` commands.

## Owns

- CLI argument handling and stable versioned output.
- `generate --watch` lifecycle.
- Diagnostics on stderr and result data on stdout.

## Does Not Own

- Scanner extraction semantics.
- Server rendering behavior.
- CSS generation, validation, or manifest compilation.
- Additional command aliases or subcommands unless explicitly requested.

## Public Surface

- Binary: `master-css`.
- Commands: `generate`, `lint`, `inspect`, and `suggest`.
- Internal command runner from `src/core.ts`.
- No public `extract`, `scan`, `render`, `mcss`, or `mastercss` aliases.

## Key Files

- `src/core.ts`
- `src/bin/index.ts`
- `src/generate.ts`
- `src/lint.ts`
- `src/inspect.ts`
- `src/suggest.ts` adapts public project loading and tooling suggestions; no CSS conversion semantics live here.

## Risk Areas

- `generate --watch` event lifecycle.
- Manifest path loading.
- Cross-platform glob behavior.
- Respecting `--no-export` when output paths are configured.
- File export sets delivery `inlineImports`; Rust flattens the graph and decides which sibling stylesheets remain.

## Safe Changes

- CLI option fixes with command tests.
- Watch behavior fixes.
- Logging fixes that do not alter generated output.

## Dangerous Changes

- Duplicating scanner logic in the CLI.
- Writing generated CSS when `--no-export` is set.
- Changing default output paths casually.
- Adding command aliases or subcommands without explicit request.

## Validation

```sh
bun run --filter @master/css-cli test
bun run --filter @master/css-cli lint
bun run --filter @master/css-cli type-check
bun run --filter @master/css-cli build
```

Use or extend `tests/extract` and root command tests for command behavior changes.
