# AI authoring evaluation

Run `node scripts/ai-authoring/evaluate.mjs --list` for the 12 task prompts and
acceptance criteria. This corpus measures observed agent behavior; unit tests and
browser fixtures verify tooling but do not establish model success rates.

## Component smoke test

After building the native binding, workspace packages and MCP executable, run
`node --import tsx scripts/ai-authoring/component-smoke.mjs` from the checkout.
It uses the installed Playwright Chromium and Tailwind toolchain; no dependency
or browser downloads are performed by the script.

The smoke test makes the site's existing `checkedSelector` card denser and imports
the benchmark dashboard's Export button. The button receives explicit pilot
hover/focus/disabled/motion variants before its Tailwind baseline is compiled.
It calls the real MCP server with isolated project roots, retains source CSS
dependencies, and compares 128 combinations of viewport, theme, pointer capability,
motion preference and control state. Resting Tailwind screenshots must also match.

The script prints an external artifact directory containing source/target HTML,
compiled CSS, screenshots, MCP responses and `report.json`. A failure returns a
nonzero exit code and preserves evidence. These deterministic cases are a workflow
smoke test, not independent model trials; do not feed them to `evaluate.mjs` as
model-success observations. Chromium and keyboard behavior checks are not a full
cross-browser or accessibility audit.

## Controlled runs

- Freeze a corpus commit containing all task fixtures, package versions, two model versions, client,
  tools, time budget and a maximum of two repair requests. Keep all attempts,
  including errors/timeouts. Start each run in a fresh copy of the fixture.
- Use two repetitions per task/model for each arm: existing instructions only,
  official skill only, existing MCP only, and skill plus existing MCP. The bridge
  arm adds `mastercss_suggest_classes` to the last arm. Disable the new tool in
  baseline MCP arms so the ablation measures the intended change.
- Give all arms the same source, task and design requirements. Do not provide
  expected class spellings or a successful solution. Inspect functionality,
  styling and accessibility with the task's rubric before scoring.
- Keep source/target reset, fonts and viewport fixed for visual comparisons.
  Check focus, disabled, themes, hover capability and reduced motion as relevant.
  Missing browser access records `not-checked`, not a pass.
- Skill installation smoke tests use an isolated project and the local repository:
  `npx skills add /absolute/path/to/checkout --skill master-css -a codex`, then
  repeat for `claude-code` and `cursor`. Test discovery and an actual UI task in
  each available client. Installation alone is not a behavioral evaluation.
- Also check unrelated requests do not trigger a styling migration; mismatched
  language versions, absent MCP and broken manifests must follow the documented
  fallback/error workflow.

## Observations

Keep run artifacts outside the repository. Record one JSON object per line with:

```json
{"task":"settings-card","arm":"skill-mcp","model":"exact-version","client":"client-version","fixtureRevision":"commit","toolVersion":"package-version","repeat":0,"repairRounds":0,"invalidClasses":0,"toolCalls":0,"inputTokens":0,"outputTokens":0,"durationMs":0,"functional":false,"styling":false,"accessibility":false,"browser":"not-checked"}
```

The values above illustrate the record shape, not a measured result. Replace every
metric with observed values; do not substitute zero for unavailable token counts.
Use `node scripts/ai-authoring/evaluate.mjs --summarize /path/to/results.jsonl`.
The report separates versions/clients and reports missing task coverage. Compare
only groups with the same tasks, repetitions and environment. Publish transcripts
and failure categories alongside aggregate rates, not selected successful runs.

Targets from the product plan are hypotheses: 90% success within two repairs,
50% fewer invalid classes, and 80% onboarding within ten minutes. Recruit 10–20
voluntary testers after the controlled runs; record setup, first useful UI,
second-change success and subsequent reuse. No automatic telemetry or outreach
is part of the tools. Do not publish improvement claims before observations exist.
