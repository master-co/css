# AI Notes For `@master/css-cli`

## Responsibility

`@master/css-cli` exposes the `master-css` binary with explicit `generate`, `lint`,
and `inspect` commands.

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
- Commands: `generate`, `lint`, and `inspect`.
- Internal command runner from `src/core.ts`.
- No public `extract`, `scan`, `render`, `mcss`, or `mastercss` aliases.

## Key Files

- `src/core.ts`
- `src/bin/index.ts`
- `src/generate.ts`
- `src/lint.ts`
- `src/inspect.ts`

## Risk Areas

- `generate --watch` event lifecycle.
- Manifest path loading.
- Cross-platform glob behavior.
- Respecting `--no-export` when output paths are configured.

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
pnpm --filter @master/css-cli test
pnpm --filter @master/css-cli lint
pnpm --filter @master/css-cli type-check
pnpm --filter @master/css-cli build
```

Use or extend `tests/extract` and root command tests for command behavior changes.
