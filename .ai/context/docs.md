# Docs Pack

Use for public docs, examples, and AI-facing guidance. For wording-only edits, read the affected document and applicable local guidance. For behavior claims, verify the relevant source/tests before writing.

## Relevant Context

- Public content belongs in `site/`; use `site/AI.md` for guide style, examples, demos, and content validation.
- AI architecture/governance belongs in `.ai/`, routing in `.ai/context/`, and package-specific constraints in local `AI.md` files.
- For generated CSS explanations, use [css-output.md](css-output.md).
- For ownership claims, use [package-boundaries.md](package-boundaries.md).
- Directive behavior changes require the guide update specified in `AGENTS.md`. A docs task does not authorize unrelated product code changes.

## Completion

Report the updated guidance and evidence for behavior claims. Run `pnpm run check:ai-context` after AI context structural changes and package lint when a workspace package changed. Run docs/site build checks only when relevant to content or demos; product tests are needed when executable examples or changed fixtures require them.
