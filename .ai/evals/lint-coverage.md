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
