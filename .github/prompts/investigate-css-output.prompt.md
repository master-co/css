# Investigate CSS Output

## Goal

Explain why a class or config produces specific CSS output, or why output changed.

## Read Before Starting

- `AGENTS.md`
- `.ai/context/index.md`
- `.ai/context/css-output.md`
- `.ai/context/accuracy-guardrails.md`
- The affected package `package.json`
- The affected package `AI.md`, if present

## Trace

1. Start at the class string and config.
2. Identify the matching manifest utility or native namespace.
3. Trace value parsing, variables, functions, selectors, modes, and at-rules.
4. Check declarations, transforms, priority, and target layer.
5. Check final `css.text`.
6. If runtime/server/extractor/language/ESLint behavior is involved, trace that outer flow too.

## Editing Rules

- Do not change code unless the investigation reveals a confirmed bug and the task asks for a fix.
- Any output change must have a focused test or fixture.

## Validation

- Prefer a targeted core test or package fixture.
- Run the affected package test.
- Run affected package lint if code changed and the package defines `lint`.

## Completion Output

Report:

- Input class/config
- Matched rule and package files
- Output explanation
- Risks or suspected bug
- Tests or commands run
