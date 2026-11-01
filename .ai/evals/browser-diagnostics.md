# Browser diagnostics for import failures

The repository's Chromium diagnostic reads source and target pages after they
have been built. It uses the installed Playwright browser and public Rust-backed
compiler/tooling APIs. It does not add a published CLI command, MCP tool,
dependency, migration or automatic fix.

```sh
node --import tsx scripts/ai-authoring/diagnose.mjs \
  --source /absolute/source/source.html \
  --target /absolute/project/index.html \
  --selector '#target' \
  --properties line-height,height,padding-top,color \
  --root /absolute/project --entry app.css \
  --width 390 --scheme light --state rest \
  --output /absolute/new-report.json
```

Inputs are local HTML files; linked stylesheets and scripts load normally. Build
source and target before running. The selector must identify the corresponding
element on both pages; comparisons use its first match. Hover, keyboard focus
and disabled states require a unique selector. States are `rest`, `hover`,
`focus` and `disabled`; schemes are `light` and `dark`. The command prints JSON
when `--output` is omitted. Output files are created exclusively: existing files
are never overwritten. Missing elements or unavailable manifest inspection return
a nonzero exit status with partial evidence when possible.

## Evidence and interpretation

- `source` and `target` contain browser-computed values, element classes and
  directly referenced custom-property values. Ancestors include their own values
  and matching declarations, exposing dependencies such as `body{line-height:1.2}`.
- `differences` compares serialized computed values. Different color notations
  can paint identically; this list is not a visual-equivalence verdict.
- Rules carry selectors, stylesheet URLs, one-based declaration positions when
  Chromium provides them, origin, layers, media/supports conditions and ordered
  declarations. Shorthand components, duplicates and `!important` are retained.
  `authored:false` entries include browser-synthesized declaration values and
  user-agent properties without source ranges.
- `layerOrder` comes from Chromium. A 40px component-layer rule alongside a 10px
  utility-layer rule and an observed 10px height exposes the ineffective repair
  without relying on class names or selector specificity alone.
- `classes.unresolved` carries the exact spelling, DOM selectors, element IDs and
  Rust diagnostics. It recognizes native project classes and browser-recognized
  inline styles; an inactive `text/plain` style does not define a native class.
  Unmanaged external native definitions and script hooks may remain unresolved.
  Recognizing a definition does not prove its rule currently applies.

Matching rules are **candidates, not proven winners**. The tool does not implement
a second CSS cascade engine or infer inheritance merely from equal values. Use
computed values together with direct/ancestor declarations and layer metadata.
Animations, transitions, layout, CSS-wide keywords and variable dependencies can
prevent attribution to one rule. Ancestor and directly referenced variable lists
are capped at 16; transitive variable sources, pseudo-elements, frames and shadow
trees are not traced. Browser evidence follows the
[Chromium CSS protocol](https://chromedevtools.github.io/devtools-protocol/tot/CSS/).

## Evaluation integration

`trials/check.mjs` preserves the original acceptance conditions and adds a
`diagnostics` field plus `diagnostics.json`. Unresolved classes get element
locations. Import mismatches trigger independent source/target state replays
**after all scoring finishes**, so inspection does not stretch transition sampling
or modify a scored page. At most six element/state groups are traced at their
first failing viewport/theme; omitted groups are counted. Touch-only checks do
not currently receive rule replays. Replays may differ from the original sample
because of timing, scripts or state history. The original `checks` values remain
the evidence used for grading, and diagnostic failures cannot flip verdicts.

Repair prompts point to the report instead of embedding full rule trees in every
prompt. Runner hashes include the new helper, so incompatible frozen runs cannot
be resumed. No historical observations are replaced and no success-rate claim
follows from deterministic controls. Run a separate paired experiment before
claiming that this feedback improves model repairs.

```sh
node --import tsx --test scripts/ai-authoring/browser-diagnostics.test.mjs
node --import tsx scripts/ai-authoring/trials/control.mjs
```

The tests cover inherited line-height, layered height repairs, important layer
precedence, shorthand/duplicate retention, source positions, custom values,
viewport/theme/state sampling, class locations and safe report creation.

## Recorded diagnostic replay: 2026-11-01

Read-only inspection of the four failed final card outputs from the paired import
campaign identified `color-white` in one output and five unresolved Tailwind
spellings in another. Two outputs showed source line-height 24px versus target
19.2px; the five-class case showed 24px source padding versus zero target padding.
The remaining output differed only in white background serialization:
`rgb(255, 255, 255)` versus `oklch(1 0 none)`. That finding calls for a separate
audit of color equivalence in the grader; it is not evidence of a visible mismatch.
Original observations, acceptance files, repair feedback and token costs remain
unchanged. These diagnostic replays are not new model trials or a score correction.
