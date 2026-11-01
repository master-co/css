# Make lint coverage explicit and measure report comprehension

The [completion cohort](completion-cohort.md) exposed four final answers that
mistook `summary.files: 0` for no lint execution. In v4 CLI/project reports, the
host filtered clean results before summarizing, while MCP content kept them.
The same count therefore could not consistently describe checked inputs.

## Report contract

CLI lint and MCP lint payloads now use version 5 (the MCP outer envelope remains
version 3). `coverage.checkedFiles` lists inputs actually passed to source lint,
including clean files and virtual stdin/buffer paths. `summary.checkedFiles` and
`summary.filesWithDiagnostics` replace the ambiguous `summary.files`. The `files`
array remains diagnostic results only, consistently including MCP content.
CLI manifest error records remain in `files`, but do not count as checked source
files or source files with diagnostics. Diagnostic/error totals still include them.

`coverage.status` distinguishes `complete`, `no-inputs` and CLI `not-run` for
manifest failure. MCP manifest errors remain error envelopes rather than fabricated
successful lint reports. CLI stylish output now states coverage on stderr, even
when clean or empty. Exit behavior is unchanged; a no-input run can exit zero.
With `--fix`, coverage remains the input set while diagnostics describe rechecked
content. The scope is selected inputs and enabled rules, not browser verification.
`coverage.description` explains what ran and states that `manifest.entries` lists
stylesheet entries rather than source inputs, while `files` lists diagnostics.

This changes host reporting, not Rust lint, extraction, CSS or autofix semantics.
The existing tooling summarizer and package boundaries are unchanged. Reference
documents describe the v4-to-v5 field migration and the coverage limits.

## Validation and experiment protocol

CLI/MCP tests cover clean and mixed inputs, explicit/default paths, no matches,
manifest failure, clean stdin/virtual content, post-fix results and transport
schema validation. Run package tests, lint, type checks and builds plus Reference
preparation/tests, site lint and AI context checks. Record unrelated failures.

```sh
node --import tsx scripts/ai-authoring/trials/lint-coverage-run.mjs --prepare-only
node --import tsx scripts/ai-authoring/trials/lint-coverage-run.mjs
```

The prepare-only command validates report fixtures without invoking a model.

Generate eight real reports from the built CLI/MCP: clean file, mixed files,
unmatched pattern, manifest-blocked CLI, clean stdin, successful fix, clean MCP
project and clean MCP buffer. Assert coverage against the fixture inputs before
any model call. Canonicalize temporary path prefixes only. Preserve fixture files,
full reports and command exits; no synthetic success reports or omitted errors.

Use two fresh independent interpretations per scenario, Luna low reasoning,
read-only sandbox, 120 seconds per call, sequentially. The model receives only
the actual command/tool report and a request for structured counts, paths, status,
errors, browser/project-verification limits and a short explanation. No skills,
schema tutorial, expected answers, repair feedback or tool use is permitted.
Freeze source/artifact hashes, client and model arguments before the calls.
Do not retry or exclude failures; stop on unverified execution with missing
coverage explicit. Exact-field grading rejects confusion between diagnostic
files and checked inputs, no-input versus complete, or lint versus browser proof.
Manually review prose for contradictions that structured grading cannot detect.

This tests report comprehension, not seven-case repair behavior or causal
improvement over v4. Two calls per scenario do not establish a general reliability
rate. Keep raw events, prompts, outputs, usage, fixture provenance and audit outside
the repository; add the observed result without regrading historical campaigns.

## First campaign and bounded follow-up

The first frozen campaign (`6a0bb5250`) completed all sixteen calls: ten passed,
six failed, none unverified. Every count, checked path, error flag and verification
limit was correct. The six failures were `sourceCheck`: both clean-file calls,
one fixed-file call, both MCP project calls and one MCP buffer call. Their prose
contradicted the correct counts, treating empty manifest entries or diagnostic
results as absent source checks. This result is retained without regrading.

The follow-up adds a self-contained `coverage.description` to the real reports,
including the distinction between manifest stylesheet entries and lint inputs.
Freeze that change, then run the same eight fixtures twice with the same prompt,
model, budget and grading. Do not inject corrective feedback from the first
campaign into the model calls. This is a separate development iteration; the
first campaign's failures remain part of the record. A successful follow-up would
support comprehension of the final report, not a randomized causal comparison.

Before the first campaign, the initial artifact collector incorrectly assumed
the preset had a `dist` directory and exited before any model invocation. It was
corrected to hash the actual preset source, native binding and downstream artifacts;
prepare-only validation then passed before freezing the first campaign.

## Final result — 2026-11-01

The follow-up frozen at `c395f5af1` completed **16/16 correct interpretations**,
with no unverified calls. Client `codex-cli 0.166.0-alpha.5.1`, `gpt-6-luna` low
reasoning, the prompt, grader, two-repeat schedule and 120-second limit matched
the first campaign. Only the lint report implementation/schema artifacts changed;
the scripts, fixtures and scoring expectations were unchanged.

| Actual report scenario | First campaign | With coverage description |
| --- | ---: | ---: |
| Clean CLI file | 0/2 | 2/2 |
| Mixed clean/invalid CLI files | 2/2 | 2/2 |
| Unmatched CLI pattern | 2/2 | 2/2 |
| Manifest-blocked CLI | 2/2 | 2/2 |
| Clean stdin | 2/2 | 2/2 |
| Successful CLI fix | 1/2 | 2/2 |
| Clean MCP project | 0/2 | 2/2 |
| Clean MCP buffer | 1/2 | 2/2 |

All final answers correctly separated checked inputs from files with diagnostics,
identified the reported paths and execution status, and declined browser or
whole-project verification. Manual review of all sixteen explanations found no
contradictions with these fields or the real reports. The first campaign's six
failed explanations remain archived; none were replaced by a successful retry.

Independent audit regraded the exact fields from raw final messages, verified
protocol/report hashes and all 463 frozen artifacts, reconciled usage and the
complete call set, and found no issues. Neither campaign used tools during model
interpretation, timed out, or had model execution failures. The first used 168,046
input tokens (118,528 cached) and 1,507 output tokens; the follow-up used 168,846
input tokens (139,904 cached) and 1,406 output tokens. These are raw usage counts,
not a billing or causal-efficiency comparison.

The result supports the final report's readability for these eight scenarios.
It does not prove a universal success rate: questions explicitly requested
structured coverage fields, reports were read in isolation, and each scenario had
only two calls. At this stage, the full seven-case repair cohort had not been rerun
with these binaries. The subsequent [full repair evaluation](lint-repair-cohort.md)
records 6/7 repaired cases, no retained regressions and one scope overstatement;
it does not establish stable repair success or complete scope understanding.
The semantic linter, CSS output and adoption gate were not modified.

## Checks and known unrelated failures

- CLI's full suite passed 89 tests; MCP's full suite passed 52. After adding the
  description, CLI core's 13 tests and MCP core/schema's 13 tests passed again.
- The exact-field grader test passed. CLI/MCP builds and package lint passed.
  Direct package type checks (`tsc -p ... --noEmit`) passed after the final edits.
- Standard CLI/MCP `type-check` scripts remain blocked by the existing compiler
  test at `packages/compiler/tests/bug-hunt-output-source-maps.test.ts:96`, which
  accesses `nativeMappings` absent from `MasterCSSDirectiveCompilation`. That
  source and compiler behavior were not changed here.
- Site preparation and lint passed. Full Reference validation passed 22 of 24:
  unrelated layer-example and Syntax Tutorial export assertions failed at
  `site/reference/reference.test.ts:184` and `:327` (17 examples versus 19).
  Tool catalog validation passed, including a focused rerun after final docs.
- `check:ai-context` and diff checks passed. No dependencies, package/release
  configuration, Rust semantics or official skill changed.

Public compatibility changes are deliberate: CLI/MCP lint payload v5 removes
`summary.files` in favor of the two explicit counts; clean MCP buffers now return
an empty diagnostic `files` array plus explicit checked coverage. Stylish CLI
output now includes a coverage line even for clean or no-input runs. MCP outer
envelope v3, lint rules, fixes, source selection and diagnostic exit codes remain
unchanged. Consumers must read the v5 fields instead of inferring coverage from
diagnostic records.

Archive: `/Users/aron/master-css-evaluations/2026-11-01-lint-coverage`, with separate
`first` and `followup` frozen sources/tools, real fixture reports, prompts/events,
answers, grades, usage, automated audit and final manual review. Validation logs
also preserve the initial pre-model setup failure and unrelated check failures.
Follow-up observations SHA-256:
`aef4412513ef2db38f53b8e757905e5e8c4eca9ab947c383f283bdc7c531594d`.
