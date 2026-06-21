# AI Notes For `@master/css-lexer`

## Responsibility

`@master/css-lexer` owns dependency-free lexical scanning and source range contracts shared by Master CSS tooling. It may identify source ranges, directive boundaries, quoted strings, class lexical tokens, CSS unit patterns, and plan entrypoint statements. It must not validate classes, generate CSS rules, resolve plans, compile directives, extract source-level class candidates, or depend on language-service rendering behavior.

## Inputs And Outputs

- Input: raw source strings and offsets.
- Output: stable source ranges, lexical token items, directive/import statements, and lexical constants.

## Dependency Boundary

This package must remain below `@master/css`, `@master/css-compiler`, `@master/css-extractor`, `@master/css-language`, `@master/css-language-service`, integrations, and editor packages. Do not import those packages here. Keep runtime dependencies empty unless a focused parser dependency is explicitly chosen for this package.

## Public APIs

- Source primitives from `src/source.ts`
- CSS directive ranges from `src/directive-ranges.ts`
- CSS plan entry scanners from `src/css-plan-entry.ts`
- Master CSS lexical unit constants from `src/units.ts`
- Master class lexical tokenizers from `src/class.ts`

## Required Tests

```sh
pnpm --filter @master/css-lexer test
pnpm --filter @master/css-lexer type-check
pnpm --filter @master/css-lexer build
```

Any change to source range recovery, class tokenization, or import/directive scanning needs focused tests here and consumer tests when behavior changes across packages. Source-level class candidate extraction belongs to `@master/css-source`.
