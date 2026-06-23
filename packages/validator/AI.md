# AI Notes For `@master/css-validator`

## Responsibility

`@master/css-validator` validates whether generated Master CSS text is valid CSS. It uses `css-tree` to check at-rules, rule blocks, properties, and values.

## Inputs And Outputs

- Input: potential Master CSS class and optional `MasterCSS` instance, or raw CSS text.
- Output: validity boolean, generated valid rules, or syntax errors.

## Public APIs

- `isClassValid`
- `validate`
- `generateValidRules`
- syntax error types

## Core Files

- `src/validate-css.ts`
- `src/validate.ts`
- `src/is-class-valid.ts`
- `src/generate-valid-rules.ts`

## Allowed Changes

- Focused `css-tree` validation fixes.
- Targeted exceptions with tests.
- Error message improvements with tests.

## Forbidden Without Explicit Request

- Bypassing validation broadly.
- Treating unmatched classes as valid.
- Hiding all css-tree mismatch errors.

## Risk Areas

- css-tree support gaps for newer CSS functions.
- At-rule prelude validation.
- Property value validation exceptions.
- Consumers in scanner and ESLint.

## Required Tests

```sh
pnpm --filter @master/css-validator test
pnpm --filter @master/css-validator type-check
pnpm --filter @master/css-validator build
```

Use or extend:

- `tests/css.test.ts`
- `tests/test.ts`
- `tests/utils`

## Good Changes

- Add one invalid and one valid regression class for a validation edge case.
- Narrowly exempt a known css-tree false positive.

## Dangerous Changes

- Returning valid rules without checking generated CSS.
- Ignoring all `SyntaxMatchError` results.

