# AI Notes For `@master/css-compiler`

## Responsibility

`@master/css-compiler` is the canonical CSS source compiler for Master CSS. It parses Master CSS stylesheet directives and native CSS, resolves CSS import graphs, detects project entry markers, parses standalone extraction directives, and uses `@master/css-engine/compiler` helpers to produce `MasterCSSPlan` values.

## Inputs And Outputs

- Input: CSS containing `@settings`, `@theme`, `@custom-variant`, managed `@defaults`, `@components`, and `@utilities` definition directives, condition blocks with `@variant`, style rules with `@compose`, top-level extraction policy directives, and top-level native `@keyframes`.
- Output: `MasterCSSPlan`, shared directive data for lower-level consumers, style definitions, native CSS with consumed Master directives removed, native class names, warnings, standalone directive metadata, and CSS import dependencies.
- CSS plan directives such as `@settings`, `@theme`, and `@custom-variant` define plan input. Defining a component, utility, variable, variant, or animation does not emit CSS by itself; the class still needs to be used or extracted.
- `@master;` is only a lightweight entry marker.
- `@master;` and `@import "@master/css"` are equivalent user project entry markers. Package CSS files such as `@master/css/index.css` must not contain `@master;`.
- `compileCSSFile()` resolves CSS `@import` graphs before compiling and returns absolute dependency paths.
- `compileProjectPlan()` compiles project entry CSS files into the canonical project-level `MasterCSSPlan`.

## Boundaries

- Do not make `@master/css` depend on this package.
- This package may depend on the plan-driven engine for class semantics.
- Keep directive parsing package-local.
- Consume dependency-free source range helpers from `@master/css-lexer`; compiler-specific semantic directive parsing stays package-local.
- Emit shared directive contracts from `shared/css-directives` for low-level consumers, and expose plan APIs for plan loading.
- Do not reintroduce PostCSS in this package.
- If CSS plan directive syntax is expanded or changed incompatibly, update any language-service semantic token classification that is affected in the same change when practical.

## Directive MVP

- `@settings { root-size: 16; }`
- `@settings { important: on; }` and `@settings { important: off; }`
- `@theme { --color-primary: #123; --breakpoint-md: 48rem; @keyframes fade { from { opacity: 0; } to { opacity: 1; } } }`
- `@theme dark { --color-primary: #456; }`
- Unitless numeric `font-size`, `radius`, `spacing`, `breakpoint`, and `container` tokens remain supported for existing projects, but new docs and examples should prefer explicit CSS lengths such as `rem`.
- The compiler records mode declarations as written. Plan settings and engine execution decide which modes are defaults.
- `@custom-variant @motion-safe { @media (prefers-reduced-motion: no-preference) { @slot; } }`
- `@custom-variant ::scrollbar { &::-webkit-scrollbar { @slot; } }`
- `@components { btn { @compose inline-flex; display: inline-flex; } }`
- `@components { btn { @dark { @compose bg:neutral-90; } } }`
- `@utilities { content-auto { content-visibility: auto; } }`
- `@utilities { text-<left,center,right> { text-align: --value(); } }`
- `@utilities { print-hidden { @variant @print { display: none; } } }`
- `.card { @compose block; @dark { @compose fg:primary; } }`
- Managed definition directives use first-level bare names, not selectors. Put selector states and descendants in nested selectors inside the named block.
- `@compose` is allowed in managed class definitions and native style rules, including inside `@variant`.
- Utilities defined in CSS can be static bare-name utilities or managed enum pattern utilities.
- Top-level native `@keyframes` remain native CSS. Put direct `@keyframes` inside a top-level non-mode, non-inline `@theme` block when keyframes should become managed plan animations.
- Native `@layer` blocks are never compiler-managed. Use `@defaults`, `@components`, or `@utilities` for managed definitions, and keep regular CSS selectors in native CSS.
- The compiler package does not scan unrelated `.css` files for class usage. Pair CSS plan entries with static mode or pass extracted classes through compiler options when filtering native CSS.
- CSS/theme/source tests that depend on `.css` files belong here rather than in core tests.

## Tests

Use focused package tests first:

```sh
pnpm --filter @master/css-compiler test
pnpm --filter @master/css-compiler type-check
pnpm --filter @master/css-compiler build
```
