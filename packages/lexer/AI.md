# AI Notes For `@master/css-lexer`

## Responsibility

`@master/css-lexer` owns dependency-free lexical scanning and source range contracts shared by Master CSS tooling.

## Owns

- Stable source range primitives.
- CSS directive range scanning.
- CSS manifest entrypoint statement scanning.
- Master class lexical tokenizers.
- CSS unit constants and lexical patterns.

## Does Not Own

- Class validation.
- CSS rule generation.
- Manifest resolution.
- CSS directive compilation.
- Source-level class candidate extraction.
- Language-service rendering behavior.

## Public Surface

- Source primitives from `src/source.ts`.
- CSS directive ranges from `src/directive-ranges.ts`.
- CSS manifest entry scanners from `src/css-manifest-entry.ts`.
- Unit constants from `src/units.ts`.
- Class lexical tokenizers from `src/class.ts`.

## Key Files

- `src/source.ts`
- `src/directive-ranges.ts`
- `src/css-manifest-entry.ts`
- `src/class.ts`
- `src/units.ts`
- `src/index.ts`

## Risk Areas

- Source range recovery.
- Class tokenization boundaries.
- Import and directive scanning.
- Keeping runtime dependencies empty unless explicitly justified.

## Safe Changes

- Focused lexical scanner fixes with tests.
- Range recovery improvements covered by consumer tests when behavior crosses packages.

## Dangerous Changes

- Depending on engine, compiler, scanner, language, language-service, integrations, or editor packages.
- Moving source candidate extraction here from `@master/css-source`.
- Validating or generating CSS in this package.

## Validation

```sh
pnpm --filter @master/css-lexer test
pnpm --filter @master/css-lexer lint
pnpm --filter @master/css-lexer type-check
pnpm --filter @master/css-lexer build
```
