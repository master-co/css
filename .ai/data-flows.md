# Data Flows

## Class To CSS

```txt
class string
  -> MasterCSS.add()
  -> generate()
  -> match configured static utilities, including main-layer project styles
  -> create()
  -> match() against variable, value, key, arbitrary matchers
  -> new Utility()
  -> parse values, functions, variables, selectors, modes, at-rules
  -> declarations/declarers/transformers
  -> calcRulePriority()
  -> UtilityLayer.insert()
  -> insert referenced variables and animations
  -> css.text
```

Main files:

- `packages/core/src/core.ts`
- `packages/core/src/utility.ts`
- `packages/core/src/factories/with-utility-layer.ts`
- `packages/core/src/utils/compare-rule-priority.ts`
- `packages/core/src/utils/parse-at.ts`
- `packages/core/src/utils/parse-selector.ts`
- `packages/core/src/utils/generate-selector.ts`

Risks:

- Class matching order changes can alter valid/invalid class behavior.
- Value parsing changes can alter many properties.
- Priority changes can alter cascade outcomes without changing declarations.
- Selector/at-rule parsing changes affect runtime, server, extractor, language service, and ESLint.

## Config To Resolved Config

```txt
default config + user config
  -> extendConfig()
  -> recursively collect extends
  -> flatten variables, modes, atTokens
  -> merge utilities, selectorTokens, functions, animations
  -> MasterCSS.resolve()
  -> resolveVariables()
  -> resolveAnimations()
  -> resolveSelectors()
  -> resolveAtRules()
  -> resolveUtilities()
```

Main files:

- `packages/core/src/utils/extend-config.ts`
- `packages/core/src/utils/flatten-meta-object.ts`
- `packages/core/src/utils/flatten-object.ts`
- `packages/core/src/core.ts`
- `packages/core/src/config/*`

Risks:

- Extend order and flattening affect all config consumers.
- Variable aliases and modes affect inlining vs CSS custom property output.
- Static utility layer assignment affects semantic class output and cascade behavior.

## Build-Time Extraction

```txt
source globs / Vite modules / Webpack modules
  -> CSSExtractor.init()
  -> load extractor options and Master CSS config
  -> extractLatentClasses()
  -> generateValidRules()
  -> insert valid rules into layers
  -> export css.text or virtual CSS module
```

Main files:

- `packages/extractor/src/core.ts`
- `packages/extractor/src/functions/extract-latent-classes.ts`
- `packages/validator/src/generate-valid-rules.ts`
- `packages/vite/src/modes/extract.ts`
- `packages/vite/src/plugins/virtual-css-module.ts`
- `packages/webpack/src/index.ts`

Risks:

- False positives increase CSS output.
- False negatives omit required CSS.
- Static extraction cannot infer truncated dynamic strings.

## Runtime

```txt
document or shadow root
  -> initCSSRuntime()
  -> CSSRuntime.observe()
  -> find or create style#master
  -> hydrate pre-rendered layers or add connected classes
  -> MutationObserver detects class and child changes
  -> classCounts increments/decrements
  -> add/remove rules in native stylesheet
```

Main files:

- `packages/runtime/src/core.ts`
- `packages/runtime/src/layer.ts`
- `packages/runtime/src/utility-layer.ts`
- `packages/runtime/src/init.ts`

Risks:

- Hydration must reconstruct virtual rules from native CSS rules.
- Native CSSRule order must match core layer priority.
- Class count bugs can leak or remove active rules.

## Language Service

```txt
TextDocument + cursor
  -> CSSLanguageService.getClassPosition()
  -> suggestSyntax / inspectSyntax / renderSyntaxColors / editSyntaxColors
  -> query core utilities, variables, selectors, at-rules, generated CSS
  -> LSP response through language-server
```

Main files:

- `packages/language-service/src/core.ts`
- `packages/language-service/src/features/*`
- `packages/language-service/src/utils/query-syntax-completions.ts`
- `packages/language-server/src/core.ts`

Note: syntax diagnostics are currently handled mainly by `@master/eslint-plugin-css`, not by LSP diagnostics.
