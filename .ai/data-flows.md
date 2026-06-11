# Data Flows

## Class To CSS

```txt
class string
  -> MasterCSS.add()
  -> generate()
  -> match configured static utilities, including components-layer project styles
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
project CSS files containing @master; or @import "@master/css"
  -> @master/css-configer discovers project entry files only
  -> @master/css-compiler resolves CSS imports and package style imports
  -> compiler parses @theme token/mode directives, @settings root options, top-level @custom-variant definitions, @animations keyframes, and @defaults/@components/@utilities managed definition directives
  -> compiler converts directive result through the core adapter into Config
  -> build tools / ESLint / language-server receive the same semantic project Config
  -> MasterCSS.resolve() resolves variables, animations, selectors, at-rules, utilities
```

Main files:

- `packages/configer/src/css.ts`
- `packages/configer/src/load.ts`
- `packages/integration/src/config-module.ts`
- `packages/compiler/src/index.ts`
- `packages/core/src/utils/extend-config.ts`
- `packages/core/src/utils/flatten-meta-object.ts`
- `packages/core/src/utils/flatten-object.ts`
- `packages/core/src/core.ts`

Risks:

- Entry detection must only use project-level markers: `@master;` and `@import "@master/css"`.
- Package CSS such as `@master/css/index.css` must not contain or imply a project entry marker.
- Configer must not implement CSS import graph or CSS config directive parsing.
- Extend order and flattening affect all config consumers.
- Variable aliases and modes affect inlining vs CSS custom property output.
- Static utility layer assignment affects semantic class output and cascade behavior.
- `?master-css-config` query ids, virtual module ids, and generated JavaScript module source helpers are integration protocol and belong in `@master/css-integration`, not configer.

## Build-Time Extraction

```txt
source globs / Vite modules / Webpack modules
  -> CSSExtractor.init()
  -> build tool / CLI registers managed CSS entries discovered by configer
  -> extractLatentClasses()
  -> compile managed CSS through @master/css-compiler
  -> merge style config returned by compiler with explicit Config options
  -> generateValidRules()
  -> insert valid rules into layers
  -> export css.text / virtual CSS module
  -> export preloaded counts for generated variables and keyframes
```

Main files:

- `packages/extractor/src/core.ts`
- `packages/extractor/src/style.ts`
- `packages/extractor/src/functions/extract-latent-classes.ts`
- `packages/validator/src/generate-valid-rules.ts`
- `packages/vite/src/modes/static.ts`
- `packages/vite/src/plugins/virtual-css-module.ts`
- `packages/webpack/src/index.ts`

Risks:

- False positives increase CSS output.
- False negatives omit required CSS.
- Static rendering cannot infer truncated dynamic strings.

## Runtime

```txt
document or shadow root
  -> initCSSRuntime({ config, preloaded, root, autoObserve })
  -> CSSRuntime.observe()
  -> register preloaded variable/keyframe counts
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
