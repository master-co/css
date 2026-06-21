# Core Test Migration Ledger

This ledger tracks every test file that existed under `packages/core/tests` before `@master/css` became a facade. A deleted core test is only acceptable when its intent has an owner, a coverage status, and a concrete next action or executable replacement.

Status values:

- `covered-exact`: the old test intent has concrete executable coverage in the new owner.
- `covered-representative`: representative coverage exists, but the old file has not been exhaustively rewritten.
- `rewritten-css-first`: old Config-centric intent has been converted into CSS-first / Manifest IR tests.
- `helper-replaced`: old tester/helper infrastructure has been replaced by the Manifest-based harness.
- `dropped-removed-api`: compatibility-only JS Config behavior is intentionally removed.
- `pending-rewrite`: owner is known, but the old test intent still needs a focused rewrite.
- `pending-triage`: owner or replacement strategy is not yet complete.

Current executable coverage anchors:

- Engine exact rule parity: `packages/engine/tests/rules-migration-parity.test.ts` migrates the mechanically portable default-rule assertions from old `packages/core/tests/rules/**`.
- Engine focused exact parity: `packages/engine/tests/parser-boundary-parity.test.ts`, `packages/engine/tests/cascade-layer-parity.test.ts`, `packages/engine/tests/issue-regressions.test.ts`, and `packages/engine/tests/complex-utilities-parity.test.ts`.
- Engine representative parity: `packages/engine/tests/core-parity.test.ts`, `packages/engine/tests/master-css-manifest.test.ts`, and `packages/engine/tests/parser-parity.test.ts`.
- Compiler CSS-first lowering: `packages/compiler/tests/master-css-manifest.test.ts` and `packages/compiler/tests/css-first-core-migration.test.ts`.
- Preset source/default manifest: `packages/preset/tests/default-manifest.test.ts` and `packages/preset/tests/design-tokens.test.ts`.
- Facade smoke: `packages/core/tests/facade.test.ts`.

Current audit summary:

- Deleted old core test files: 140.
- Status distribution: 63 `covered-exact`, 39 `covered-representative`, 14 `rewritten-css-first`, 17 `helper-replaced`, 7 `dropped-removed-api`.
- Rule assertions now exactly covered by engine migration parity: 33 old rule test files, 235 assertions.
- No deleted old core test file is left without an owner and disposition.
- `covered-representative` rows are deliberately scoped to legacy files whose exact assertions are either covered by the generated rule parity suite or whose former helper/API surface is no longer public.
- `dropped-removed-api` rows must stay documented because the old JS Config runtime API is intentionally gone.
- Inline-alias audit: 55 mechanically discovered old assertions still expect `var(...)` for `@theme inline` aliases such as `black`, `white`, `current`, `full`, `fit`, `max`, and `min`; these are documented behavior divergences, not exact migrations.

Manifest IR behavior findings:

- Fixed: variable/value matchers now preserve the old single-value matcher boundary and do not consume top-level `|` segments. This preserves shorthand behavior such as `bl:1px|solid|lighter` -> `border-left`.
- Fixed: functional pseudo-class selector arguments are no longer expanded by the variant scanner before selector parsing. This restores valid CSSOM insertion for classes such as `pb:8x:not(:last)`.
- Fixed: `calc()` math lowering preserves native CSS variable references while handling explicit units, e.g. `w:calc(-2px+var(--spacing-md))`.
- Fixed: CSS-first variable namespace lowering adds namespace alias refs to matching built-in utilities, so authored variables such as `--container-custom` are addressable by `w:-custom` through Manifest IR instead of browser-side namespace guessing.
- Fixed: ESLint readable class sorting restores the old pre-priority grouping of unqualified, selector, mode, and at-rule utilities, then static-vs-dynamic utilities, so issue #377 hover visibility chains no longer autofix into a different order.
- Fixed: preset `font` native shorthand variable aliases prefer `font-family-*` over legacy `font-*` aliases for family keys, and `font-feature-settings` now restores `font-feature-*` variable aliases through Manifest IR.
- Restored: focused engine exact parity now covers parser boundaries, selector variants, selector-text recovery, rule/media priority, explicit layer routing, on-demand insertion/refcounts, keyframes outside layers, historical issues 147/215/265/321/332/346/358/363, grouped utilities, pair size/max/min utilities, transition syntax, and font family/feature/weight behavior.
- Restored: compiled parser parity now covers the old parse-at and parse-selector case tables at generated CSS-text level, including logical at operators, comparison aliases, container aliases, `:of()`, attributes, universal selectors, grouped selectors, and custom at-rule aliases.
- Preserved: `@theme inline` aliases in `packages/preset/src/theme.css` lower to inline Manifest records, so `current`, `black`, `white`, `full`, `fit`, `max`, and `min` emit raw values instead of `var(...)`.
- Documented divergence: if the project later wants old `var(...)` output for inline aliases, the source-of-truth decision belongs in preset/compiler lowering, not in engine matcher fallback.

| Old core test path | Owner | Status | Notes |
| --- | --- | --- | --- |
| `packages/core/tests/__snapshots__/components.test.ts.snap` | compiler/engine | rewritten-css-first | Old component snapshot intent is covered by CSS-first component lowering and engine execution assertions in `packages/compiler/tests/css-first-core-migration.test.ts`; the snapshot file itself is not restored because `@master/css` is now a facade. |
| `packages/core/tests/at-rules/media.test.ts` | engine | covered-representative | Class-to-rule semantics belong to manifest-driven engine tests; representative coverage restored now, full case migration remains tracked. |
| `packages/core/tests/breakpoints.test.ts` | engine | covered-representative | Class-to-rule semantics belong to manifest-driven engine tests; representative coverage restored now, full case migration remains tracked. |
| `packages/core/tests/calc.test.ts` | engine | covered-representative | Class-to-rule semantics belong to manifest-driven engine tests; representative calc coverage includes native `var()`, unary negative variables, and multiplication chains in `packages/engine/tests/core-parity.test.ts`. |
| `packages/core/tests/components.test.ts` | engine/compiler | covered-representative | Execution belongs to engine, CSS-first component lowering belongs to compiler; representative coverage restored in both. |
| `packages/core/tests/config.ts` | engine/compiler | helper-replaced | Old `CSSTester(Config)` infrastructure is replaced by Manifest-based engine helpers and CSS-first compiler fixtures. |
| `packages/core/tests/config/at/layer.test.ts` | compiler | rewritten-css-first | Layer/at-rule authoring now lowers through CSS directives and compiled variant/at-rule records; covered by compiler migration tests and engine parser parity. |
| `packages/core/tests/config/at/test.ts` | engine | helper-replaced | Old Config helper replaced by manifest-based engine helpers. |
| `packages/core/tests/config/colors/hex.test.ts` | compiler | rewritten-css-first | Color authoring is CSS-first `@theme`; hex normalization and references are covered by `packages/compiler/tests/css-first-core-migration.test.ts`. |
| `packages/core/tests/config/colors/hsl.test.ts` | compiler | rewritten-css-first | HSL color lowering is covered by CSS-first color/mode tests in `packages/compiler/tests/css-first-core-migration.test.ts`. |
| `packages/core/tests/config/colors/test.ts` | engine | helper-replaced | Old Config helper replaced by manifest-based engine helpers. |
| `packages/core/tests/config/default-mode.test.ts` | compiler | rewritten-css-first | `default-mode`, `mode-trigger`, and mode variable emission are covered as CSS-first settings in `packages/compiler/tests/css-first-core-migration.test.ts`. |
| `packages/core/tests/config/extend-config/master-1-1.css.js` | compiler/manifest | dropped-removed-api | JS Config compatibility path is removed; replace intent with CSS-first import/baseManifest tests. |
| `packages/core/tests/config/extend-config/master-1-2.css.js` | compiler/manifest | dropped-removed-api | JS Config compatibility path is removed; replace intent with CSS-first import/baseManifest tests. |
| `packages/core/tests/config/extend-config/master-1.css.js` | compiler/manifest | dropped-removed-api | JS Config compatibility path is removed; replace intent with CSS-first import/baseManifest tests. |
| `packages/core/tests/config/extend-config/master-2.css.js` | compiler/manifest | dropped-removed-api | JS Config compatibility path is removed; replace intent with CSS-first import/baseManifest tests. |
| `packages/core/tests/config/extend-config/master-css.js` | compiler/manifest | dropped-removed-api | JS Config compatibility path is removed; replace intent with CSS-first import/baseManifest tests. |
| `packages/core/tests/config/extend-config/test.ts` | engine | helper-replaced | Old Config helper replaced by manifest-based engine helpers. |
| `packages/core/tests/config/functions/$.test.ts` | engine/compiler | dropped-removed-api | Manifest function registry is absent; native `var(--*)` and `$token` shorthand cover variable references. |
| `packages/core/tests/config/functions/calc.test.ts` | engine/compiler | rewritten-css-first | `calc()` behavior is covered by engine value VM parity and CSS-first compiler migration tests. |
| `packages/core/tests/config/functions/test.ts` | engine | helper-replaced | Old Config helper replaced by manifest-based engine helpers. |
| `packages/core/tests/config/modes.test.ts` | compiler | rewritten-css-first | Mode declaration and emitted selector behavior are covered by CSS-first settings/theme tests. |
| `packages/core/tests/config/test.ts` | engine | helper-replaced | Old Config helper replaced by manifest-based engine helpers. |
| `packages/core/tests/config/utilities.test.ts` | preset/compiler | rewritten-css-first | Utility registry integrity is covered by `packages/preset/tests/default-manifest.test.ts`; custom utility lowering is covered by CSS-first compiler migration tests. |
| `packages/core/tests/config/variables/font.test.ts` | preset/compiler | rewritten-css-first | Font token source/default manifest coverage lives in preset tests; custom variable lowering lives in CSS-first compiler tests. |
| `packages/core/tests/config/variables/inline.test.ts` | preset/compiler | rewritten-css-first | Inline variable behavior is a CSS preset/compiler decision and is covered by design token and CSS-first migration tests. |
| `packages/core/tests/config/variables/number.test.ts` | compiler/engine | rewritten-css-first | Number variables, negative aliases, mode values, and unit conversion are covered by CSS-first compiler tests and engine value VM parity. |
| `packages/core/tests/config/variables/spacing.test.ts` | preset/compiler | rewritten-css-first | Default spacing tokens are covered by preset tests; authored spacing variables are covered by CSS-first compiler tests. |
| `packages/core/tests/config/variables/test.ts` | engine | helper-replaced | Old Config helper replaced by manifest-based engine helpers. |
| `packages/core/tests/create-from-selector-text.test.ts` | engine | covered-exact | Exact selector-text recovery cases migrated to `packages/engine/tests/parser-boundary-parity.test.ts`, including modes, scoped selectors, grouped selectors, and static components. |
| `packages/core/tests/css.ts` | engine | helper-replaced | Old Config helper replaced by manifest-based engine helpers. |
| `packages/core/tests/design-system.test.ts` | preset | covered-representative | Default preset token and registry intent covered in preset tests; expand per token family as needed. |
| `packages/core/tests/design-tokens/animations.test.ts` | preset | covered-representative | Default preset token and registry intent covered in preset tests; expand per token family as needed. |
| `packages/core/tests/design-tokens/fonts.test.ts` | preset | covered-representative | Default preset token and registry intent covered in preset tests; expand per token family as needed. |
| `packages/core/tests/design-tokens/spacings.test.ts` | preset | covered-representative | Default preset token and registry intent covered in preset tests; expand per token family as needed. |
| `packages/core/tests/edge-cases.test.ts` | engine | covered-representative | Class-to-rule semantics belong to manifest-driven engine tests; representative coverage restored now, full case migration remains tracked. |
| `packages/core/tests/exceptions.test.ts` | engine | covered-representative | Class-to-rule semantics belong to manifest-driven engine tests; representative coverage restored now, full case migration remains tracked. |
| `packages/core/tests/helpers/create-css-with-theme.ts` | engine/compiler | helper-replaced | Replaced by Manifest-based `packages/engine/tests/helpers/css-tester.ts` and CSS-first compiler fixtures. |
| `packages/core/tests/helpers/test-theme-config.ts` | engine/compiler | helper-replaced | Replaced by defaultManifest and local CSS-first fixtures; no JS Config helper remains public. |
| `packages/core/tests/issues/147.test.ts` | engine/compiler | covered-exact | Exact issue coverage restored in `packages/engine/tests/issue-regressions.test.ts`; compiler CSS-first color-function lowering cases added in `packages/compiler/tests/css-first-core-migration.test.ts`. |
| `packages/core/tests/issues/215.test.ts` | engine | covered-exact | Exact touch-action shorthand cases migrated to `packages/engine/tests/issue-regressions.test.ts`. |
| `packages/core/tests/issues/265.test.ts` | engine | covered-exact | Exact View Transitions API utilities and pseudo-element aliases migrated to `packages/engine/tests/issue-regressions.test.ts`. |
| `packages/core/tests/issues/321.test.ts` | engine | covered-exact | Exact individual transform and legacy transform function cases migrated to `packages/engine/tests/issue-regressions.test.ts`. |
| `packages/core/tests/issues/332.test.ts` | engine | covered-exact | Exact logical border and logical corner radius cases migrated to `packages/engine/tests/issue-regressions.test.ts`. |
| `packages/core/tests/issues/346.test.ts` | engine/compiler | covered-exact | Exact Manifest variable color-function and color-mix dependency cases restored in engine; compiler CSS-first color-function lowering cases added without restoring old JS Config raw-string compatibility. |
| `packages/core/tests/issues/358.test.ts` | engine | covered-exact | Exact clamp arithmetic normalization cases migrated to `packages/engine/tests/issue-regressions.test.ts`. |
| `packages/core/tests/issues/363.test.ts` | engine | covered-exact | Exact grouped pipe-separator declaration cases migrated to `packages/engine/tests/issue-regressions.test.ts`. |
| `packages/core/tests/issues/377.test.ts` | engine/tooling | covered-exact | Issue regression restored in ESLint class-order tests; readable sorting now preserves the old visibility-chain order. |
| `packages/core/tests/keyframes/index.html` | runtime/engine | covered-representative | Browser fixture intent is covered by runtime e2e and engine animation ref-count tests; the static HTML fixture is not restored under the facade package. |
| `packages/core/tests/layers/assignments.test.ts` | engine | covered-exact | Exact explicit layer routing and conflicting layer variant cases migrated to `packages/engine/tests/cascade-layer-parity.test.ts`. |
| `packages/core/tests/layers/keyframes.test.ts` | engine | covered-exact | Exact keyframe emission and emittedGlobals animation refcount cases migrated to `packages/engine/tests/cascade-layer-parity.test.ts`. |
| `packages/core/tests/layers/on-demand.test.ts` | engine | covered-exact | Exact on-demand insertion/removal lifecycle and emittedGlobals variable refcount cases migrated to `packages/engine/tests/cascade-layer-parity.test.ts`. |
| `packages/core/tests/lifecycle.test.ts` | engine | covered-representative | Class-to-rule semantics belong to manifest-driven engine tests; representative coverage restored now, full case migration remains tracked. |
| `packages/core/tests/properties.test.ts` | engine | covered-representative | Class-to-rule semantics belong to manifest-driven engine tests; representative coverage restored now, full case migration remains tracked. |
| `packages/core/tests/render.test.ts` | engine | covered-representative | Class-to-rule semantics belong to manifest-driven engine tests; representative coverage restored now, full case migration remains tracked. |
| `packages/core/tests/rule-priority.test.ts` | engine | covered-exact | Exact declaration, media, and static component priority cases migrated to `packages/engine/tests/cascade-layer-parity.test.ts`. |
| `packages/core/tests/rule.test.ts` | engine | covered-representative | Class-to-rule semantics belong to manifest-driven engine tests; representative coverage restored now, full case migration remains tracked. |
| `packages/core/tests/rules-order.test.ts` | engine | covered-exact | Exact deterministic insertion-order independence cases migrated to `packages/engine/tests/cascade-layer-parity.test.ts`. |
| `packages/core/tests/rules/accent.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/animation-direction.test.ts` | engine | covered-representative | Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/animation-fill-mode.test.ts` | engine | covered-representative | Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/animation-iteration-count.test.ts` | engine | covered-representative | Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/animation-play-state.test.ts` | engine | covered-representative | Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/area.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/aspect-ratio.test.ts` | engine | covered-representative | Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/backdrop-filter.test.ts` | engine | covered-representative | Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/background-clip.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/background.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/border-color.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. Follow-up regression added for the old uncovered `bl:1px\|solid\|lighter` color-alias plus separator ambiguity. |
| `packages/core/tests/rules/border-radius.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/border-style.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/border-width.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. Follow-up regression added for multi-segment border aliases staying on shorthand utilities. |
| `packages/core/tests/rules/border.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. Follow-up regression added for `bl:1px\|solid\|lighter`, which old tests implied through shorthand cases but did not cover directly. |
| `packages/core/tests/rules/box-shadow.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/box.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/caret.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/color.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/content.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/counter.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/display.test.ts` | engine | covered-representative | Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/filter.test.ts` | engine | covered-representative | Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/flex-basis.test.ts` | engine | covered-representative | Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/flex.test.ts` | engine | covered-representative | Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/font-family.test.ts` | engine | covered-exact | Exact family alias cases migrated to `packages/engine/tests/complex-utilities-parity.test.ts`. |
| `packages/core/tests/rules/font-feature-settings.test.ts` | engine/preset | covered-exact | Exact raw feature list and `font-feature-*` variable alias cases migrated to `packages/engine/tests/complex-utilities-parity.test.ts`; preset Manifest alias restored. |
| `packages/core/tests/rules/font-size.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/font-weight.test.ts` | engine | covered-exact | Exact keyword and tokenized font-weight cases migrated to `packages/engine/tests/complex-utilities-parity.test.ts`. |
| `packages/core/tests/rules/font.test.ts` | engine/preset | covered-exact | Exact font shorthand cases migrated to `packages/engine/tests/complex-utilities-parity.test.ts`; preset Manifest alias order restored so `font:italic\|1.2rem\|sans` resolves to `--font-family-sans`. |
| `packages/core/tests/rules/gap.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/grid-column.test.ts` | engine | covered-exact | Exact grid-column span aliases migrated to `packages/engine/tests/complex-utilities-parity.test.ts`. |
| `packages/core/tests/rules/group.test.ts` | engine | covered-exact | Exact grouped generated utilities, quoted separators, invalid group recovery, gradients, and global important propagation migrated to `packages/engine/tests/complex-utilities-parity.test.ts`. |
| `packages/core/tests/rules/inset.test.ts` | engine | covered-exact | Exact inset side utilities, complex right value parsing, and priority order migrated to `packages/engine/tests/complex-utilities-parity.test.ts`. |
| `packages/core/tests/rules/letter-spacing.test.ts` | engine | covered-representative | Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/line-height.test.ts` | engine | covered-representative | Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/logical-properties.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/margin.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/max-width.test.ts` | engine | covered-representative | Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/motion-symbol-keys.test.ts` | engine | covered-representative | Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/order.test.ts` | engine | covered-representative | Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/outline.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/overflow.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/padding.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/scroll-margin.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/scroll-padding.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/scroll-snap-type.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/size.test.ts` | engine | covered-exact | Exact size/max/min pair utility parsing migrated to `packages/engine/tests/complex-utilities-parity.test.ts`, including variable and nested math inputs. |
| `packages/core/tests/rules/stroke.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/svg-colors.test.ts` | engine | covered-representative | Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/tab-size.test.ts` | engine | covered-representative | Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/text-decoration.test.ts` | engine | covered-representative | Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/text-fill-color.test.ts` | engine | covered-representative | Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/text-overflow.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/text-stroke-width.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/text-truncate.test.ts` | engine | covered-representative | Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/text-wrap.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/text.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/transform.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/transition.test.ts` | engine | covered-exact | Exact transition multi-value syntax and removed shorthand-prefix rejection migrated to `packages/engine/tests/complex-utilities-parity.test.ts`. |
| `packages/core/tests/rules/width.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/writing-mode.test.ts` | engine | covered-exact | Exact default-rule assertions migrated to `packages/engine/tests/rules-migration-parity.test.ts`. Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/rules/zoom.test.ts` | engine | covered-representative | Dynamic utility execution belongs to engine; representative old rules covered by core-parity tests. |
| `packages/core/tests/selectors.test.ts` | engine | covered-exact | Exact selector variant aliases, pseudo shorthands, descendants, and multi-branch selector behavior migrated to `packages/engine/tests/parser-boundary-parity.test.ts`. |
| `packages/core/tests/semantics.test.ts` | engine | covered-representative | Class-to-rule semantics belong to manifest-driven engine tests; representative coverage restored now, full case migration remains tracked. |
| `packages/core/tests/test.ts` | engine | helper-replaced | Old Config helper replaced by manifest-based engine helpers. |
| `packages/core/tests/tester.ts` | engine | helper-replaced | Old Config helper replaced by manifest-based engine helpers. |
| `packages/core/tests/utils/equal-at-rules.test.ts` | engine | helper-replaced | Internal equality helpers are no longer public facade API; equivalent behavior is asserted through generated at-rule CSS and parser parity tests. |
| `packages/core/tests/utils/equal-declarations.test.ts` | engine | helper-replaced | Internal equality helpers are no longer public facade API; declaration behavior is asserted through generated CSS output parity. |
| `packages/core/tests/utils/equal-selectors.test.ts` | engine | helper-replaced | Internal equality helpers are no longer public facade API; selector behavior is asserted through generated selector and runtime CSS output parity. |
| `packages/core/tests/utils/equal-variants.test.ts` | engine/compiler | helper-replaced | Internal equality helpers are no longer public facade API; variant lowering/application is covered by compiler and engine tests. |
| `packages/core/tests/utils/extend-config.test.ts` | compiler/manifest | dropped-removed-api | JS Config compatibility path is removed; replace intent with CSS-first import/baseManifest tests. |
| `packages/core/tests/utils/generate-at.test.ts` | engine | covered-exact | Covered by `packages/engine/tests/parser-parity.test.ts` for compiled at-rule parse/generate semantics. |
| `packages/core/tests/utils/generate-selector.test.ts` | engine | covered-exact | Covered by `packages/engine/tests/parser-parity.test.ts` for compiled selector parse/generate semantics. |
| `packages/core/tests/utils/meta-object.test.ts` | compiler | helper-replaced | Old Config meta-object helpers are not part of the Manifest public contract; CSS-first lowering tests cover the remaining semantic use cases. |
| `packages/core/tests/utils/minify-extended-config.test.ts` | compiler/manifest | dropped-removed-api | JS Config compatibility path is removed; replace intent with CSS-first import/baseManifest tests. |
| `packages/core/tests/utils/parse-at.test.ts` | engine | covered-exact | Covered by `packages/engine/tests/parser-parity.test.ts`, including logical operators, comparisons, feature aliases, container aliases, custom at-rule aliases, and generate-at output. |
| `packages/core/tests/utils/parse-selector.test.ts` | engine | covered-exact | Covered by `packages/engine/tests/parser-parity.test.ts`, including `:of()`, functional pseudo-class arguments, attributes, universal selectors, grouped selectors, and generate-selector output. |
| `packages/core/tests/utils/parse-value.test.ts` | engine | covered-exact | Exact primitive parse-value boundary cases migrated to `packages/engine/tests/parser-boundary-parity.test.ts`; broader value VM parity remains covered by engine tests. |
| `packages/core/tests/utils/resolve-variable-namespace.test.ts` | compiler | rewritten-css-first | Namespace resolution now belongs to compiler lowering; covered by CSS-first number variable tests such as `--container-custom` -> `w:-custom`. |
| `packages/core/tests/utils/sort-readable-classes.test.ts` | engine/tooling | covered-representative | Public sorting helper is gone from facade; priority/order behavior is covered by engine rule order tests and tooling class-order tests. |
| `packages/core/tests/variables-and-modes.test.ts` | engine | covered-representative | Class-to-rule semantics belong to manifest-driven engine tests; representative coverage restored now, full case migration remains tracked. |
