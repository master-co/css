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
