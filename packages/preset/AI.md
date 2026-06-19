# AI Notes For `@master/css-preset`

## Responsibility

`@master/css-preset` owns the default Master CSS stylesheet source and generated `default-plan.json`. The public `@master/css` package re-exports preset CSS entries, but not the preset plan data. The key alias, builtin namespace, and native value namespace registry is owned by `@master/css-engine`, not by the preset plan.

## Inputs And Outputs

- Input: preset CSS source files, source utility definitions, default settings, engine built-in registry data, and generated-plan script inputs.
- Output: `default-plan.json`, `index.css`, `base.css`, `theme.css`, `variants.css`, and `utilities.css`.

## Boundaries

- Keep default token, utility, managed keyframe, variant, and layer-statement source here.
- Do not add `keyAliases`, `nativeValueNamespaces`, or namespace registry data to `default-plan.json`.
- Do not put engine execution behavior, project plan discovery, or build integration behavior here.
- Regenerate `src/default-plan.json` only when the source preset intentionally changes.
- The layer statement lives in `src/base.css` and must stay `@layer theme, base, defaults, components, utilities;`.

## Utility Definition Ladder

- Default token namespaces must be declared in `@master/css-engine` built-ins. Do not introduce `variableAliasRefs` that point to namespaces outside that registry.
- Prefer engine `builtinNativeValueNamespaces` for full native or vendor property classes; use engine `builtinKeyAliases` when the public key differs from the emitted property.
- Prefer engine `builtinKeyAliases` for short aliases that map directly to native logical, physical, full, or vendor CSS properties.
- Use `@utilities` for semantic subproperty aliases that direct property fallback cannot represent.
- Keep `src/utilities.ts` only for multi-declaration behavior, special transforms, raw ambiguous matching, or compiler-inexpressible behavior.
- When adding a utility, document why engine `builtinKeyAliases` plus `builtinNativeValueNamespaces` cannot satisfy it.

## Required Tests

```sh
pnpm --filter @master/css-preset test
pnpm --filter @master/css-preset type-check
pnpm --filter @master/css-preset build
```

Generated default-plan changes must be intentional and covered by preset or compiler tests.
