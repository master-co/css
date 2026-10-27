# Atomic class authoring validation

Scope: remove Master CSS mechanisms that interpret or prioritize compound classes.
Native CSS in stylesheets, examples, inline styles and authored mixins remains
ordinary CSS. Single-setting classes such as `animation:none@media(print)`,
`white-space:nowrap` and `flex:1` remain supported and are not mechanically
expanded into reset declarations. Generic full-property declarations still accept
native values such as `margin:1px|1px` and `border:1px|solid|red`.

## Intentional changes

- The engine has no shorthand property classification or special priority tier.
  Tokens and native declarations use normal priority, retaining layers,
  conditions, recipe priority, value-source priority and deterministic ordering.
  Overlapping classes may therefore have a different winner; browser tests now
  verify the actual generated order, including `padding:8px padding-top:12px`.
- `UtilityType.Shorthand` and the schema `native-css-shorthand` subpath are removed.
  Compound border, outline, animation and transition namespace mappings are
  removed; atomic color, duration and easing mappings remain. Existing `b-*` and
  `bg-*` target colors. No `b-1`, `b(1)` or `b-solid` inference was added.
- Partial conflicts are read-only diagnostics with no replacement or autofix.
  Full-conflict fixes, native validation, migration overlap analysis and managed
  animation dependencies remain. Historical compound reconstruction requires
  manual review; original native CSS declarations can still be preserved.
- Ten `animate-*` names now use the generic named mixin. Primary tokens hold
  keyframe names; companion tokens hold timing and playback settings. The mixin
  emits longhands, retaining the previous durations, easing and repetition.
- Language version is **9** because the starting checkout already used version 8.
  Binding ABI is **19**, lint batch is **4**; Manifest v4 and hydration v3 envelope
  versions are unchanged. Old semantic data must be regenerated.
- Sixteen composite teaching routes become noindex redirect entrances. Seven
  atomic-property or recipe pages replace missing destinations. Catalog, search,
  sitemap, Markdown and LLM outputs omit retired bodies. The LLM CLI now actually
  invokes generation, and Reference generation removes stale search entries.
- Repository-only audits check authored classes, escaped demo markup, syntax
  tables and provable overlaps. Native CSS and style objects remain allowed;
  historical migration evidence and intentional invalid-input fixtures are excluded.

## Validation

- Affected Rust engine, compiler, lint, schema, language, render, CLI, project,
  scanner, validator and xtask tests passed; workspace clippy, rustfmt, codegen
  and parity checks passed.
- Schema, preset, native/Wasm bindings, CSS, compiler, tooling, internal, server,
  CLI, Next, MCP, language service/server and ESLint tests passed. All changed
  packages have lint scripts, which were run. Package type checks passed.
- Chromium and WebKit runtime suites each passed all 168 cases. Native/Wasm
  animation parity covers all ten recipes, companion overrides, lazy keyframe
  loading and release. Old lint and hydration language versions are rejected.
- Release-artifact engine benchmarks passed all five cases. Initial debug-artifact
  benchmark and watch tests timed out under concurrent builds; release-artifact
  reruns passed. These runs are not a controlled before/after timing comparison.
- Site reference (20), syntax (14), docs examples (17), LLM exports (32), redirect
  checks (4) and demo coverage (4, covering 642 scenes) passed. The production
  build and 95 public-asset checks passed. Site lint reports zero errors and 163
  warnings; scoped checks for subsequently added components also passed.
- The CSS snapshot records 1,261 routes, 128 delivery contracts, 1,743 generated
  rules and 3,949 exact CSS segments. Root AI-context, API-census, package contract
  and dependency-boundary checks passed.
- Runtime bundle budget passed. Preset manifest gzip grows from 16,731 to 16,942
  bytes (+211); Brotli grows from 10,544 to 10,730 bytes (+186). Native preset CSS
  remains 2,989 bytes (1,042 gzip, 850 Brotli).

## Browser coverage and limits

Chromium checks cover both light and dark modes at 1440px and 390px for Motion,
border width, padding, Play and all seven new reference pages. Screenshots were
inspected; no horizontal page overflow or page errors were observed. Keyboard
focus remains visible. Logical start padding was verified as 16px on the left
in LTR and on the right in RTL. Keyboard focus grows the outline to 4px without changing box geometry;
print resets it to 0px. The rotate recipe uses 1s, linear easing and infinite
repetition, while reduced motion and print disable animation.
This is representative visual coverage, not a screenshot review of every route.

Firefox fails at browser launch with `Could not find profile folder`, including
with a separate temporary profile directory. This environment failure is also
recorded in `native-boundary-qa.md`; Firefox execution remains unverified.
