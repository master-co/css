# AI Notes For `@master/css-cli`

## Responsibility

`@master/css-cli` exposes one package-name binary. It wraps the static scan/extraction workflow for command-line usage.

## Inputs And Outputs

- Input: command-line args, source globs, manifest entry paths, scanner options.
- Output: generated CSS to stdout or file, logs.

## Public APIs

- Binary:
  - `@master/css-cli`
- There are no public `extract`, `scan`, `render`, `mcss`, or `mastercss` aliases.
- Internal command runner exported from `src/core.ts`.

## Core Files

- `src/core.ts`
- `src/bin/index.ts`
- `src/scan.ts`

## Allowed Changes

- CLI option fixes.
- Watch behavior fixes.
- Logging fixes that do not alter generated output.
- Tests for command behavior.

## Forbidden Without Explicit Request

- Adding command aliases or subcommands.
- Changing default output paths casually.
- Writing generated CSS when `--no-export` is set.
- Changing scanner/server behavior in CLI instead of lower packages.

## Risk Areas

- Root `--watch` event lifecycle.
- Manifest path loading.
- Cross-platform glob behavior.

## Required Tests

```sh
pnpm --filter @master/css-cli test
pnpm --filter @master/css-cli type-check
pnpm --filter @master/css-cli build
```

Use or extend:

- `tests/extract`
- root command tests

## Good Changes

- Add a fixture for a CLI option regression.
- Add a root command fixture for CLI option regressions.

## Dangerous Changes

- Duplicating scanner logic in CLI.
- Writing generated CSS when `--no-export` is set.
