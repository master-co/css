# AI Notes For `@master/css-schema`

This package owns public, dependency-light Master CSS schema and wire-format contracts. It is below engine, compiler, runtime, server, tooling, and integrations in the dependency graph.

## Boundaries

- Keep this package free of compiler, engine, runtime, integration, filesystem, and framework behavior.
- Only include stable public contracts, serializable constants, pure data tables, and pure JSON codec helpers.
- Manifest ABI changes, hydration manifest changes, CSS directive schema changes, and syntax IR type changes belong here first.
- Do not add project discovery, CSS import graph resolution, stylesheet compilation, class matching, DOM hydration, or build adapter logic.

## Validation

```sh
pnpm --filter @master/css-schema type-check
pnpm --filter @master/css-schema lint
pnpm --filter @master/css-schema test
pnpm --filter @master/css-schema build
```
