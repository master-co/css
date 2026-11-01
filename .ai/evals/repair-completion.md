# Complete repairs beyond matching appearance

The [seven-case guarded cohort](guarded-cohort.md) left `seed-05-gpt-6-luna-b`
unresolved. Its last proposal passed browser comparisons, but left the obsolete
`hover:bg-blue-700` class and omitted the required explanation of retained CSS.
The unchanged adoption policy rejected the new reporting failure and preserved
the original source. Improving that proposal requires complete task fulfillment,
not a lower threshold for adopting it.

## Workflow

Each host checkpoint now includes a source-bound `completion` section in
`repair-feedback.json` and the retained checkpoint embedded in guarded prompts.
It lists unresolved classes from the existing evaluator, all remaining check IDs,
and reporting obligations even when the preceding answer passed them. Missing
class evidence is explicitly unverified. It does not validate CSS independently,
infer valid syntax, alter the scorer or give a new edit the preceding pass status.

The guarded prompt asks the model to correlate unresolved classes with the current
markup, preserve their behavior when replacing them with native CSS, and inspect
the final markup again before class lint/build. It asks for a fresh factual
explanation of retained CSS and dependencies, class changes, checks actually run
and remaining uncertainty. Rejected patches remain evidence rather than the next
workspace. Browser verification stays host-owned and all previous regression
guards still apply. The requirements are guidance; unchanged host checks enforce
adoption, and no extra model calls or hidden cleanup edits are added.

Reporting descriptions express the task requirements rather than revealing
scoring regular expressions. The existing reporting scorer is keyword-based;
passing it alone is not proof of a truthful, complete explanation. Audit must
read the actual answer and diff. The official skill, compiler and public CLI/MCP
interfaces are unchanged; this remains an internal opt-in repair workflow.

## Fixed validation protocol

Freeze implementation, scripts, built tools, client/browser and model arguments
before a fresh targeted run. Use the same original `checkpoint-0.work` from the
historical recheck, `seed-05-gpt-6-luna-b`, Luna low reasoning, at most two sequential
120-second attempts. Use cohort-case mode to enforce byte-identical initial
sources and scored checks, without replaying historical proposals as new calls:

```sh
node --import tsx scripts/ai-authoring/trials/guarded-run.mjs --source /absolute/prior-recheck-run --case seed-05-gpt-6-luna-b --cohort-case --attempts 2
```

After the bounded run, independently copy, rebuild and check the final retained
source using its actual retained answer. Compare with the initial checkpoint for
new property, class or check failures. Audit parent snapshots, rejection decisions,
protected files, evidence freshness, actual commands/answers and usage. Archive
all proposals including rejected or unsuccessful ones. Do not rerun to select a
pass, reuse the previous successful targeted repair, or combine this targeted
outcome with the earlier cohort to claim a new seven-case success rate.

Focused tests must show that matching browser output still exposes an obsolete
class and a missing report, that the regression gate rejects the omission, and
that a complete repair passes without weakening checks. Run scoped script ESLint,
`check:ai-context` and diff checks. Keep evaluator and color-comparison hashes
identical to the historical run.

## Recorded result — 2026-11-01

Frozen implementation: `68a0b9df8`. Client `codex-cli 0.166.0-alpha.5.1`, Chromium
`156.0.8078.4`, `gpt-6-luna` with low reasoning and the unchanged two-attempt cap.
All 422 tracked tool artifacts matched the original recheck run. Initial editable
sources and scored checks were identical to its original failed checkpoint.

The first proposal passed all task checks and was adopted. Independent rebuilding
of a separate retained-source copy with the actual model answer also passed.
Six original failed checks became zero, with zero new failure atoms in both the
proposal and independently verified retained output. There was one model call,
no rejection, no historical replay and three host assessments: initial source,
proposal and independent final verification. The unused second attempt was not
spent. This is a new targeted observation, not a revised seven-case campaign or
proof that the workflow alone caused the improvement.

The repair replaced `hover:bg-blue-700` with the project-defined
`button-hover-blue-700` utility. Its `@utility` body nests `&:hover` inside
`@media (hover: hover)` and uses the existing blue-700 token. The resting
`bg-blue-600`, geometry, reset, focus-visible and disabled rules remain. The new
utility emits in utilities and overrides the resting color in the intended state.
Host checks verified both themes and viewports, resting/hover/focus/disabled
states, touch, class recognition and the original nonvisual requirements.

The model visibly read the current completion feedback and final edited files,
ran class lint and build successfully, and explained retained reset, palette
tokens and native focus/disabled CSS in its final answer. It correctly described
host browser verification as pending at the time of that answer. Manual review
of the diff, commands and answer confirmed these claims; the reporting pass was
not accepted as sole evidence of explanation quality.

Audit recomputed adoption and verified original and parent copies, source/CSS
hashes, protected files, current completion sections in feedback/prompts,
unchanged source/tool artifacts and raw usage. It found no integrity issues,
model failures, timeouts, guard violations or missing usage. Input totaled
266,777 tokens, including 248,960 cached input tokens; output totaled 1,906 tokens.
No causal token-savings claim follows from this single run.

All ten distinct focused tests passed after correcting the new test fixture:
its first spelling was already backed by native CSS in the positive control,
so the fixture now uses a genuinely unresolved token spelling. The two new tests
were rerun successfully; the eight existing tests had passed unchanged. The
archive retains both test logs. Scoped script ESLint, `check:ai-context` and diff
checks passed. No workspace package code changed, so no package lint was needed.

Remaining limits: this targeted run did not retest all seven cases with the new
guidance or exercise a new rejection/retry branch. Existing regression tests and
the prior cohort cover those paths. The unchanged reporting scorer still uses
keywords, and measured states do not prove correctness outside their coverage.
The result supports a broader fixed-cohort replication before claiming a general
repair improvement or promoting the instructions into the official skill.

Archive: `/Users/aron/master-css-evaluations/2026-11-01-repair-completion`.
It contains frozen sources/tools, original provenance, prompts/events, proposed
and retained snapshots, final verification, decisions, audits and test logs.
Result SHA-256:
`f7782061b5ecea6b601d511e06f137f7fc8ccce722bfdb54db824489c29d8357`.

The subsequent [full-cohort replication](completion-cohort.md) passed all seven
original failures in eight calls. One touch regression was rejected before a
successful retry; retained outputs had no new measured failures. It also exposed
misinterpretation of lint's diagnostic-file count in several model answers.
See that report for the distinction between measured repair success and reporting
quality; neither run establishes a general repeated-run success rate.
