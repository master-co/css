# Lint v5 in the complete guarded repair workflow

This returns the [lint coverage report](lint-coverage.md) to the seven original
failed snapshots used by the [completion cohort](completion-cohort.md). The
report-only 16/16 result is not treated as evidence of successful autonomous repair.

## Fixed protocol

```sh
node --import tsx scripts/ai-authoring/trials/guarded-cohort-run.mjs --source /absolute/prior-recheck-run --attempts 2
```

Run all seven original `checkpoint-0.work` snapshots once, using the existing
completion prompt, official skill, Luna low reasoning, two attempts of at most
120 seconds each and sequential execution. Do not add a coverage quiz or give
feedback about the preceding report-comprehension experiments. Do not replace
failed cases or extend their budget after seeing outcomes.

Freeze scripts, source/tool artifacts, browser/client and model arguments. Require
identical initial editable sources and scored checks. Before starting, verify
the actual tools match the final lint-comprehension run; changes relative to the
previous repair cohort should be confined to CLI/MCP lint reporting artifacts.

The unchanged host gate rejects new property/class/check failures and uncertain
coverage. After every case, independently copy, rebuild and recheck the retained
implementation using its retained answer. Keep original failures, rejected
proposals, unverified outcomes and missing coverage explicit. Archive both the
accepted and rejected source copies, diffs, command outputs and usage.

## Lint interpretation audit

For every model turn, inspect actual completed command output, including complete
v5 JSON reports, rather than infer coverage from the command's exit code. Reconcile
checked paths/counts, files with diagnostics, coverage status and diagnostic/error
totals. Check the final answer against the reports and final source changes.

Separate three observations: whether the model actually received a v5 report,
whether its stated scope is accurate, and whether it explicitly distinguishes
checked inputs from diagnostic files. A generic “lint passed” may be consistent
but is not proof of full coverage understanding. Record absent/unreadable reports
as unobserved and contradictory claims as errors. Do not count silence as an
explicitly correct explanation or turn model claims into browser evidence.

Manually check descriptions of manifest entries, no-input runs, buffers and browser
verification when they occur. This cohort may not exercise every v5 status; the
eight-scenario comprehension experiment and package tests cover those separately.
Lint presentation must not alter the unchanged repair grading or cause retained
source regressions. Report the two outcomes separately.

Compare only descriptively with the preceding 7/7 completion cohort. Fresh model
sampling can change attempts and edits; one run per snapshot does not establish
a general reliability rate or a causal effect of lint v5. No implementation or
public documentation changes are needed for this evaluation. Reuse passing checks
for the hash-identical implementation, run AI context and diff checks for this
internal report, and retain the known limitations in the prior validation record.

## Result — 2026-11-01

The complete run finished **6/7 passed, 1/7 failed, none unverified**, using eight
model calls. Two proposals introduced regressions and were rejected; independently
rechecked retained implementations had **zero new failure atoms**. The remaining
case keeps its original six failed checks. This is regression containment, not a
claim that every proposed fix was safe or that the remaining case was repaired.

| Original snapshot | Calls | Rejected proposals | Final retained result |
| --- | ---: | ---: | --- |
| `seed-03-gpt-6-luna-b` | 1 | 0 | Passed |
| `seed-05-gpt-6-luna-a` | 1 | 0 | Passed |
| `seed-05-gpt-6-luna-b` | 2 | 2 | Failed; original failures retained |
| `seed-06-gpt-6-luna-b` | 1 | 0 | Passed |
| `seed-07-gpt-6-luna-b` | 1 | 0 | Passed |
| `seed-08-gpt-6-luna-a` | 1 | 0 | Passed |
| `seed-08-gpt-6-luna-b` | 1 | 0 | Passed |

There were 22 host assessments: seven initial, eight proposed and seven final
retained copies. Adoption, source hashes, protected files, generated CSS, coverage,
completion feedback and usage were independently audited with no inconsistencies.
No case, proposal or usage record was missing; no model execution timed out.

### What the model understood about lint

All eight turns received real v5 reports: 17 reports in total. Checked paths,
checked-file counts, files-with-diagnostics counts and diagnostic totals reconciled
with the raw command output. All observed reports had `complete` status; this
repair run did not exercise no-input, manifest-blocked or buffer reports.

Manual review of the eight final answers, including rejected proposals, found:

- Five accurately described the selected input scope. These were seed 03-b,
  both seed 05-b attempts, seed 08-a and seed 08-b.
- Two were consistent but insufficiently explicit: seed 06-b and seed 07-b said
  lint had zero diagnostics without identifying the checked input set.
- One overstated scope: seed 05-a called `lint index.html app.css app.js` a
  “whole-project lint.” It correctly separated the clean files from the existing
  `app.js` error, but no unrestricted project scan supported that scope claim.
- None repeated the earlier zero-diagnostics/empty-files-means-no-checks mistake.
  None claimed host browser verification had already occurred. None explicitly
  stated both file counts, so silence cannot establish complete understanding of
  the distinction between checked inputs and diagnostic files.

The report-only 16/16 comprehension result therefore does not transfer to an
unqualified seven-case understanding claim. Scope wording still needs to stay
tied to `coverage.checkedFiles`; selected files do not establish project coverage.

### Why the remaining repair failed

In seed 05-b, the first proposal replaced unresolved `hover:bg-blue-700` with
`bg-blue-700:hover`. Desktop hover improved, but the proposal introduced a new
touch-tap background-color failure. Its answer incorrectly claimed the generated
hover rule was guarded by hover capability. The gate rejected the proposal.

The second attempt started again from the retained original snapshot. It added a
native hover-capability rule but also replaced working classes with unsupported
`h-10 px-4 rounded-lg text-white`. The resulting proposal introduced 96 new failure
atoms, including all four unresolved classes and property failures across states.
The gate rejected it, leaving the original snapshot and its failures intact.

The model had run `inspect index.html app.css`, which returned `UNKNOWN_TOKEN`
evidence for `h-10`, `px-4` and `text-white`, yet its answer claimed the replacement
classes were registered and dimensions preserved. The host class check additionally
identified `rounded-lg`. Clean lint on `index.html` was correctly reported, but
could not substantiate those class-registration claims. The broader three-input
lint also exposed an existing dynamic `w(` error in `app.js`, which was disclosed.

This reflects the existing lint policy: `crates/mastercss-lint/src/session.rs`
suppresses unknown-token diagnostics unless `disallow_unknown_class` is enabled;
`unknown_named_prefixes_follow_the_unknown_class_policy` tests that behavior in
the same crate. Tooling forwards the option, while this CLI invocation does not
enable it. Ordinary authored CSS class names must remain allowed. Neither v5 nor
this evaluation changes that policy. The next targeted improvement is to reconcile
class-recognition and inspection evidence before declaring replacement classes
valid, while keeping lint coverage and browser verification distinct.

### Comparison, validation and evidence

The immediately preceding completion cohort passed 7/7 with eight calls and one
rejected proposal; this run passed 6/7 with eight calls and two rejections. Repair
success is therefore not yet stable across these runs. Fresh sampling and one run
per snapshot prevent attributing the difference to v5. The raw runner's
`priorPassed: 6` refers to the older source campaign, not the preceding 7/7
completion cohort; both historical records remain unchanged.

Frozen source revision: `8eba78e48a418f6e5e06fef87506c1e173b22abd`. The 422 tracked
artifacts match the final lint-comprehension implementation; only four artifacts
differ from the previous repair tools: CLI `dist/lint.js` and MCP `dist/lint.js`,
`dist/output-schema.js`, `dist/source-schema.js`. Repair prompts/scripts, official
skill, scorer and gate remained unchanged. Client `codex-cli 0.166.0-alpha.5.1`,
browser `156.0.8078.4`, Luna low reasoning and the two-attempt budget were retained.

Usage was 1,463,295 input tokens (1,275,648 cached) and 10,287 output tokens.
These are usage totals, not a billing estimate. The automated audits found no
issues; the manual scope overstatement and erroneous repair claims above remain
failures of model reasoning, not audit inconsistencies.

This change adds evaluation records only. AI context and scoped diff checks pass.
Package checks were not rerun for unchanged code; passing checks and unrelated
type-check/Reference failures remain documented in the [lint validation record](lint-coverage.md#checks-and-known-unrelated-failures).
No public API, CSS output, lint policy, dependency or official skill changed.

Archive: `/Users/aron/master-css-evaluations/2026-11-01-lint-repair-cohort` contains
frozen source/tools, original source provenance, prompts/events, accepted and
rejected workspaces, host assessments, audits and per-turn manual classifications.
Observations SHA-256:
`fcc9f452cdb590d031c8f77122729b1b2c028c26954ba8a65eba1c1f133de6ab`.

The subsequent [inspection reconciliation evaluation](inspect-reconciliation.md)
adds explicit class-evidence review and repeats the remaining case twice. Both
retained results resolve class recognition without new failures, but only one
fully repairs hover. The other retains four cascade failures; this does not revise
the seven-case result above.
