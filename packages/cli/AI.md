# AI Notes For `@master/css-cli`

## Responsibility

`@master/css-cli` exposes `mcss` and `mastercss` commands. It wraps extraction and HTML rendering workflows for command-line usage.

## Inputs And Outputs

- Input: command-line args, source globs, config paths, extractor options.
- Output: generated CSS to stdout or file, rendered HTML files, logs.

## Public APIs

- Binaries:
  - `mcss`
  - `mastercss`
- Internal command runner exported from `src/core.ts`.

## Core Files

- `src/core.ts`
- `src/bin/index.ts`
- `src/commands/extract.ts`
- `src/commands/render.ts`

## Allowed Changes

- CLI option fixes.
- Watch behavior fixes.
- Logging fixes that do not alter generated output.
- Tests for command behavior.

## Forbidden Without Explicit Request

- Changing command names.
- Changing default output paths casually.
- Writing files in analyze/no-export modes.
- Changing extractor/server behavior in CLI instead of lower packages.

## Risk Areas

- `extract --watch` event lifecycle.
- `render` writing HTML files.
- Config path loading.
- Cross-platform glob behavior.

## Required Tests

```sh
pnpm --filter @master/css-cli test
pnpm --filter @master/css-cli type-check
pnpm --filter @master/css-cli build
```

Use or extend:

- `tests/extract`
- `tests/render`

## Good Changes

- Add a fixture for a CLI option regression.
- Fix render analyze mode without writing files.

## Dangerous Changes

- Duplicating extractor logic in CLI.
- Writing generated CSS when `--no-export` is set.

