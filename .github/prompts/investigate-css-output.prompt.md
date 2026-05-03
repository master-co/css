# Investigate CSS Output

## Goal

Explain why a class or config produces specific CSS output, or why output changed.

## Read Before Starting

- `AGENTS.md`
- `.ai/data-flows.md`
- `.ai/testing-policy.md`
- `packages/core/AI.md`

## Trace

1. Start at the class string and config.
2. Identify the matching `DefinedRule`.
3. Trace `SyntaxRule` parsing of value, variables, selector, mode, and at-rules.
4. Check declarations, transformer, and declarer.
5. Check priority and target layer.
6. Check final `css.text`.
7. If runtime/server/extractor is involved, trace that outer flow too.

## Editing Rules

- Do not change code unless the investigation reveals a confirmed bug and the task asks for a fix.
- Any output change must have a focused test.

## Validation

- Prefer a targeted core test or package fixture.
- Run the affected package test.

## Completion Output

Report:

- Input class/config
- Matched rule and package files
- Output explanation
- Risks or suspected bug
- Tests or commands run

