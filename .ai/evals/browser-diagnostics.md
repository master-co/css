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

`trials/check.mjs` adds a
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

## Color equivalence and historical audit

The checker now compares import color, background-color and outline-color samples
using Chromium relative `color(from … srgb r g b / alpha)` conversion in a separate
page **after state sampling finishes**. Unclamped sRGB channels retain wide-gamut
information. Channel tolerance is 0.00025 for conversion/serialization roundoff;
alpha tolerance is 0.002 to accommodate legacy 8-bit alpha rounding. Fully
transparent colors ignore hidden RGB channels. Unsupported conversions retain
strict string comparison. This bounded numerical comparison is not a perceptual,
screenshot or general CSS-equivalence test. Non-color properties remain exact.
See [CSS relative colors](https://www.w3.org/TR/css-color-5/#relative-colors).

Every waived difference retains its raw values, check ID, normalized values and
versioned tolerance policy in `acceptance.json.colorComparison`. Diagnostics keep
raw serialized values. Controls accept equivalent white notation and reject a
one-step RGB difference, different alpha, wide-gamut differences and transitions.

`recheck-colors.mjs RUN_DIRECTORY` uniformly reclassifies saved computed samples
without rebuilding or invoking models. The 30-attempt import campaign has two
changed verdicts, both in before/Luna/card/repeat 1: attempts 1 and 2. First-pass
counts remain 4/8 for each arm; final counts under the corrected comparison are
7/8 before and 6/8 after. Original final counts were 6/8 each. Repairs and token
costs are unchanged, including the extra repair requested after the now-corrected
attempt 1. This does not establish that the revised skill reduced success.

Full regeneration was refused because the current native artifact hash differs
from the frozen campaign. This audit uses recorded browser values and is limited
to color equivalence; it cannot detect unrelated checker errors. Raw observations
and all 30 acceptance files retain their original hashes.

## Diagnostic feedback pilot

```sh
node --import tsx scripts/ai-authoring/trials/run.mjs --profile diagnostics-pilot --concurrency 2
node scripts/ai-authoring/trials/compare.mjs /absolute/run/path
```

Sixteen trials pair two import tasks, two models and two repetitions. Both arms
use the identical skill at `eb0bf3cd0`, CLI tools and corrected color checker.
A receives failed checks only; B additionally receives `diagnostics.json` and a
repair instruction to read it. A's workspace and acceptance reports omit browser
evidence. Both first-attempt prompts/capabilities are identical; no diagnostic
report exists before the first attempt. Skill versions, feedback modes, source
hashes and tool artifacts are frozen and verified on resume.

This measures an end-to-end feedback workflow: first attempts are independent
samples, not identical failed candidates. Report first-pass rates, final rates,
repair counts, input/cached-input tokens and conditional repair results separately.
Different starting errors confound conditional repair rates and repair-token costs.
Audit actual report reads; tool availability or a prompt is not proof of use.
Keep calibration separate, preserve every error/timeout, and make no general
success or cost claim from the small fixed-task sample.

### Recorded feedback pilot: 2026-11-01

Frozen runner `5f2dba159`, Codex CLI `0.166.0-alpha.5.1`, `gpt-6.1-sol` and
`gpt-6-luna`, low reasoning, concurrency 2, 120 seconds per attempt and up to two
repairs. Four calibration cases (seven attempts) were excluded. All 16 formal
trials completed in 30 attempts without timeout, service or isolation failure.
Source/tool hashes, copied skills, original fixture inputs and token totals were
audited. No grader changes or regrading occurred during this campaign.

| Measure | A: checks only | B: browser evidence |
| --- | ---: | ---: |
| First pass | 4/8 | 4/8 |
| Final pass | 6/8 | 6/8 |
| Repair requests | 7 | 7 |
| Repaired trials passing | 2/4 | 2/4 |
| First-attempt input tokens | 2,077,738 | 1,870,594 |
| Repair-attempt input tokens | 1,487,958 | 1,461,820 |
| Input tokens including repairs | 3,565,696 | 3,332,414 |
| Cached input tokens | 3,145,472 | 2,941,952 |
| Median model time including repairs | 74.30 s | 65.03 s |
| CLI suggestion calls | 23 | 20 |
| Final unmatched names | 5 | 1 |

Pairs had one A win, one B win, five both-pass and one both-fail. Sol passed 4/4
without repairs in each arm. Luna initially failed all four trials per arm and
finished 2/4 in each. B's four repaired trials visibly read rule evidence in all
seven repair attempts; A's workspace and acceptance files contained no diagnostic
report. One A suggestion call failed because declaration text beginning with
`--height` was treated as an unknown CLI option; B had no suggestion errors.

No measured success-rate or repair-count improvement followed report use. B's
repair input count was 1.8% lower and total input count 6.5% lower, but first-attempt
input already differed by 10.0% before evidence was available. Different initial
errors, cache hits and the small sample prevent a diagnostic cost-benefit claim.
These are token counts, not billing estimates; timings are local concurrent runs.

Both B failures were hover imports. One retained a components-layer hover rule
overridden by its utilities-layer resting background; the other also retained an
unresolved class and incorrect text color. The report exposed candidates but did
not ensure a correct repair. Next compare a compact, property-focused diagnostic
against the full report on **identical failed snapshots**, keeping initial errors
fixed and verifying hover after each repair; see the [paired-repair protocol](repair-snapshots.md). Do not claim a general improvement
or expand the public tool surface based on this pilot alone.

External artifacts contain all prompts, events, snapshots, comparison, audit and
analysis, plus separate calibration and historical color-audit records. Native
and built tool artifacts are now archived alongside source hashes. Observation
SHA-256: `81075b6f92fb24ffc8a6b2b019c377a96aaf8607abf86142006aacc789c2ab92`.
