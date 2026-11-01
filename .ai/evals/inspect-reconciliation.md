# Reconcile repair conclusions with class inspection

The [lint v5 repair cohort](lint-repair-cohort.md) left `seed-05-gpt-6-luna-b`
unrepaired. Its second proposal reported clean markup lint but ignored inspection
evidence for unsupported replacement classes. Both regressive proposals were
rejected; the original six failed checks remained. Lint coverage was mostly
understood, but class-recognition claims were not supported by the actual reports.

## Workflow change

The internal completion prompt and source-bound class checklist now explicitly
separate lint, class recognition and browser behavior. The model must inspect the
final edited markup with the current project stylesheets, reconcile per-file
discovered classes, requested missing-CSS evidence and diagnostics, and rerun
inspection after markup/stylesheet edits including lint autofix. A zero-diagnostic
lint report or successful build cannot establish class registration.

The conclusion must connect added/replaced classes to evidence: generated utility
or native declaration, real native CSS selector, or unresolved/unchecked spelling.
It must disclose conflicting or missing evidence instead of claiming a familiar
Tailwind spelling is registered. Native selectors must retain real behavior and
dependencies; adding dummy selectors or removing working hooks to silence a report
is not a repair. Recognition still does not establish cascade winners or state
behavior. Lint scope must name checked inputs and distinguish diagnostic counts.

Inspection's `discovered.invalid` and `discovered.usedNative` are not disjoint:
a class may be unrecognized as a generated utility but backed by native CSS.
The workflow therefore requires correlation with actual source occurrences and
native rules, rather than treating every aggregate candidate or invalid entry as
an unsupported markup class. Empty `missingCSS.checked` is not proof of coverage.

This changes guidance only. The host checker, reporting scorer, regression gate,
official skill, public tools and lint policy remain unchanged. The workflow does
not introduce a TypeScript CSS validator or accept model claims as host evidence.

## Fixed targeted validation

Before model calls, freeze sources, tool artifacts, client/browser and model
arguments. Run **two independent replications**, each starting from the same
original failed `checkpoint-0.work`, with Luna low reasoning and at most two
120-second attempts. Run sequentially, without feedback between replications.
Do not extend the budget or replace failures after seeing outcomes.

```sh
node --import tsx scripts/ai-authoring/trials/guarded-run.mjs --source /absolute/prior-recheck-run --case seed-05-gpt-6-luna-b --cohort-case --attempts 2 --output /absolute/new-run
```

Cohort-case mode checks identical initial sources and scored checks and omits
historical replay. Each proposal still faces every task check and the unchanged
no-new-failures gate. Independently copy, rebuild and recheck each final retained
implementation with its actual retained answer. Audit source/CSS hashes, parent
copies, protected files, decisions, feedback freshness, command outputs and usage.

Manually compare each final answer with final markup inspection, lint coverage,
source edits and host results. Record whether inspection occurred after the last
edit, whether changed spellings have generated/native evidence, and whether the
answer contradicts diagnostics or claims browser verification prematurely.
Retain generic or absent explanations as insufficient evidence, not correct
interpretations. Do not silently revise keyword-based repair scores based on
this separate reporting audit.

A focused integration test must reproduce zero-diagnostic lint alongside actual
invalid classes, preserve a genuine native CSS hook, and show that unchanged host
checks reject unsupported names even when browser appearance matches. Correcting
the markup must pass fresh inspection and host checks. Run the completion,
checkpoint and regression tests, scoped script ESLint, AI context and diff checks.

This targeted result cannot be combined with earlier cohort passes to claim a
new 7/7 outcome. Two fresh samples do not establish general reliability or isolate
the causal effect of revised guidance. Preserve failed calls and audit findings.
