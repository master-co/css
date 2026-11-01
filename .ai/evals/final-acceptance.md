# Final seven-case acceptance and delivery

This is the bounded closing acceptance for the AI repair workflow, followed by
official skill/documentation consolidation. Do not start another improvement
campaign from ordinary model mistakes or incomplete explanations found here.

## Frozen acceptance protocol

Run the complete original seven failed snapshots once with the current
state-reconciliation completion guidance, Luna low reasoning, at most two
120-second attempts per case, sequentially. Use the existing cohort runner,
unchanged scorer and no-new-failures adoption gate. Preserve failures, rejections,
unverified cases and missing coverage; do not extend budgets or select retries.

```sh
node --import tsx scripts/ai-authoring/trials/guarded-cohort-run.mjs --source /absolute/original-recheck-run --attempts 2
```

Freeze scripts, tool artifacts, client/browser and official skill before calls.
Each initial source and scored check must match the original archived snapshot.
Independently rebuild and check every retained output, including original sources
when proposals are rejected. Audit parent copies, source/CSS hashes, decisions,
protected files, usage, final inspection/lint evidence and answer claims.

The preceding two successful targeted replications started from a later retained
four-failure snapshot. Do not combine them with this cohort or claim this run is
a causal comparison. The original seven-case denominator stays explicit.

## Delivery boundary

After acceptance, consolidate the demonstrated repair principles into the
official skill's existing troubleshooting reference and public AI-coding Guide.
Keep the skill entry point concise. Explain lint coverage, class recognition,
native CSS hooks, conflicts, layers, state verification and remaining uncertainty.
Preserve unresolved diagnostics in the final report even if a narrower check
passes. Avoid adding the evaluation harness or benchmark-specific prompts to
ordinary user workflows.

The acceptance measures the frozen internal workflow and its archived skill;
the subsequent official skill wording is a documented consolidation, not a new
model-evaluated treatment. Validate its structure/references and the public
article through existing site preparation/lint/export checks. Report known
limitations and unrelated check failures without changing their criteria.

Only a regression actually adopted by the gate blocks closing acceptance and
requires a focused fix. Ordinary repair failures, intercepted proposals and
explanation gaps become known limitations. Commit the completed deliverables and
end this development cycle without automatically scheduling further work.

## Acceptance result — 2026-11-01

The one planned cohort completed **7/7 passes**, with no failed, unverified or
missing case. Nine proposals produced seven complete repairs and two accepted
intermediate improvements. No proposal introduced a new measured failure; none
was rejected. Independent final rebuilds confirmed **zero retained regressions**.
There were 23 formal host assessments: seven initial, nine proposals and seven
separate retained copies. No budget extension or replacement run was used.

| Original snapshot | Calls | Final result | New retained failures |
| --- | ---: | --- | ---: |
| `seed-03-gpt-6-luna-b` | 1 | Passed | 0 |
| `seed-05-gpt-6-luna-a` | 2 | Passed | 0 |
| `seed-05-gpt-6-luna-b` | 2 | Passed | 0 |
| `seed-06-gpt-6-luna-b` | 1 | Passed | 0 |
| `seed-07-gpt-6-luna-b` | 1 | Passed | 0 |
| `seed-08-gpt-6-luna-a` | 1 | Passed | 0 |
| `seed-08-gpt-6-luna-b` | 1 | Passed | 0 |

Frozen source revision: `58eae67a0093ceb58ff3a3fdf512b60fcbb287aa`, including the
state-review implementation from `b970ce93b`. All 422 tracked tool artifacts matched
the preceding state-reconciliation evaluation. The official skill remained
unchanged throughout the model calls. Initial editable sources and scored checks
matched the original recheck snapshots; the runner, scorer and adoption policy
were unchanged. Client `codex-cli 0.166.0-alpha.5.1`, Chromium `156.0.8078.4`, Luna
low reasoning and the two-attempt/120-second budget were retained.

The raw summary's `priorPassed: 6` refers to the older source campaign. Earlier
cohorts and targeted runs remain separate records. This final 7/7 result is one
bounded observation, not a universal reliability rate or causal comparison.

### Evidence review and known limitations

Manual review covered all nine final replies, their raw command outputs, final
source diffs and host results. All nine used final inspection after their last
source edit and supported their markup class-recognition claims. All described
actual selected lint scope without claiming whole-project coverage; none repeated
the zero-diagnostics-means-no-checks mistake or claimed to have run host browser
checks. Some outputs were labelled or partial projections rather than complete
JSON reports; these were checked against raw events, not inferred from missing
automatic extraction entries. Not every answer explicitly stated both file counts.

Functional acceptance does not establish complete explanation quality:

- The first proposals in both seed 05 cases still left the native hover rule in
  components. Their explanations named the layer order but did not resolve the
  conflict. The unchanged host checks kept four hover failures visible; the second
  proposals corrected them without new failures.
- Several answers described utilities as following generated utility rules,
  obscuring the same-layer specificity decision after moving a native rule. The
  seed 03 repair added body line-height in both defaults and base, but its answer
  attributed the correction mainly to base. The later defaults declaration matters
  to the actual cascade; the explanation is not proof of the winning rule.
- Seed 07 moved its conditional hover rule outside named layers. It passed every
  measured state, but the wider effect of that layer-contract change on other host
  components was not measured. A successful sample does not endorse unlayered
  overrides as a general repair strategy.
- Diagnostic disclosure remained uneven. Some answers omitted informational value
  notes or stylesheet-scanner findings. Others correctly disclosed existing
  `app.js` diagnostics alongside narrower clean lint results. A keyword-based
  reporting check cannot establish that every diagnostic was explained.
- These are static fixtures and sampled browser states. Dynamic/runtime consumers,
  other host contexts and general model behavior remain outside the measurement.
  This run exercised accepted progress but no rejection branch; prior regression
  tests and archived rejected proposals retain that coverage.

These limitations are recorded rather than triggering another campaign. No
adopted regression blocked closure, and no implementation change or model retry
was added after inspecting these results.

## Official delivery

The official `skills/master-css/SKILL.md` now routes repair work to the expanded
existing troubleshooting reference. It keeps project discovery, authoring and
importing entry points concise. Troubleshooting separates lint coverage, class
recognition, real native selectors, emitted declarations, conflicts/layers,
state verification and final reporting. The importing reference links to that
review instead of duplicating it.

The public `/guide/ai-coding` article adds **Verify a repair** and **Read the result
and its limits**, preserving installation and MCP instructions. It explains checked
inputs versus diagnostic files, native-hook evidence, conditional versus ordinary
utility output, the need for browser/state checks, and unresolved diagnostics from
broader checks. It explicitly says the skill does not implement an automatic
browser runner or rollback gate. Dynamic and untested contexts remain limitations.

This official wording was consolidated **after** the frozen acceptance. Its
structure, links and documentation exports were validated; it was not run through
another model campaign and is not represented as the treatment that scored 7/7.
No public CLI/MCP schema, compiler behavior, CSS generation, package configuration,
dependency, official skill discovery policy or site layout changed. The skill is
available through the existing installation command; no deployment or release is
claimed by this source commit.

## Validation and archive

- Automated cohort audit found no integrity issues, source/tool drift, missing
  usage, model execution failure, timeout, protected-file violation or inconsistent
  adoption. It reconciled initial/parent/proposed/retained source and CSS hashes,
  completion feedback, complete checks, raw usage and independent final copies.
- The skill creator's `quick_validate.py` passed. The default Python lacked PyYAML;
  validation was rerun in a temporary virtual environment with that dependency.
  Repository dependencies and lockfiles were untouched. Local skill links, anchors
  and the 400-line/48-KiB instruction limits passed.
- Site preparation passed. Site lint completed with **0 errors and 84 unrelated
  warnings**, including raw-value and class-order findings; the log is retained.
  The focused agent-guide export test passed. A direct export check confirmed the
  new sections, coverage fields and limits survive both Markdown and search output.
- AI context and scoped diff checks passed. No package implementation changed;
  earlier focused repair tests were not rerun unnecessarily. No new Reference or
  framework code was introduced, so full Reference/type/build suites were not run.

Usage totaled 2,201,464 input tokens (1,906,176 cached) and 16,539 output tokens.
These are raw counts, not a billing or causal-efficiency estimate.

Archive: `/Users/aron/master-css-evaluations/2026-11-01-final-acceptance` contains
the frozen protocol/sources/tools/skill hashes, original provenance, complete run,
prompts/events, all source snapshots, host checks, automated and manual audits,
validation logs and final delivery hashes. Observations SHA-256:
`8844800bd634deae779da4cc2409d0f106149f2bc87e99761c724084206dc1ef`.

Both agreed closing tasks are complete. This development cycle ends with the
documented delivery and known limitations; no further task or evaluation is
automatically started.
