# AI Notes For `@master/css-validator`

## Responsibility

`@master/css-validator` validates whether generated Master CSS text is valid CSS.

## Owns

- `css-tree` validation for at-rules, rule blocks, properties, and values.
- Class validity helpers that generate and validate rules.
- Valid rule generation for scanner and ESLint consumers.

## Does Not Own

- Engine rule generation semantics.
- Scanner extraction.
- ESLint report formatting.
- Broad CSS parser replacement.

## Public Surface

- `isClassValid`
- `validate`
- `generateValidRules`
- Syntax error types
- `./native-declaration`

## Key Files

- `src/validate-css.ts`
- `src/validate.ts`
- `src/is-class-valid.ts`
- `src/generate-valid-rules.ts`
- `src/native-declaration.ts`

## Risk Areas

- `css-tree` support gaps for newer CSS functions.
- At-rule prelude validation.
- Property value validation exceptions.
- Scanner and ESLint consumers depending on valid rule output.

## Safe Changes

- Focused `css-tree` validation fixes.
- Narrow exceptions with tests.
- Error message improvements with tests.

## Dangerous Changes

- Bypassing validation broadly.
- Treating unmatched classes as valid.
- Hiding all `SyntaxMatchError` results.
- Returning valid rules without checking generated CSS.

## Validation

```sh
pnpm --filter @master/css-validator test
pnpm --filter @master/css-validator lint
pnpm --filter @master/css-validator type-check
pnpm --filter @master/css-validator build
```

Use or extend `tests/css.test.ts`, `tests/test.ts`, and `tests/utils`.
