# Review and validation

Editorial review checks whether an article is reliable and useful; executable checks validate examples and integration. Neither replaces the other. Select checks from [site/AI.md](../../../../site/AI.md#validation), [Reference maintenance](../../../../site/reference/MAINTENANCE.md), and the current [site/package.json](../../../../site/package.json). A small edit does not require every site test.

## Review by impact

Read the change to understand its purpose before checking relevant evidence. Report issues affecting facts, task completion, lookup, or understanding. Stylistic preference does not override the author's intent.

| Dimension | Passing condition |
| --- | --- |
| Technical accuracy | Behavior has source or test evidence; the claim is no stronger than that evidence |
| Reader task | Prerequisites, actions, or decision criteria are sufficient and the result is recognizable |
| Ownership | Teaching and contracts have appropriate owners without duplicate fact sources |
| Argument and voice | Sections support the subject, paragraphs connect, and explanation replaces empty slogans |
| Examples and visuals | Articles outside the Integrations category include at least one authored explanatory image; visible settings, code and results agree; figures show the relevant relationships and remain readable in both themes and narrow columns |
| Demo design | Preview contents match the relevant system component; each optional preview control produces an observation the section actually teaches |
| Integration and exports | Links, anchors, and MDX imports work; meaningful content survives the relevant output paths |

Incorrect syntax, invented data, missing necessary steps, and incorrect ownership must be resolved rather than averaged away by other strengths. For a small edit, review the dimensions it affects.

Present findings as severity, file and line, reader impact, evidence, and a concrete correction. If there are no material findings, say so and identify unperformed validation. Review-only requests receive findings; tool availability does not authorize publishing GitHub comments or editing articles.

## Reader checks

Ask practical questions based on the purpose and answer using only the article and its stated prerequisites:

- Guide: What do I change? How do I know it worked? When do I need another approach?
- Reference: What inputs are accepted? What is the output or scope? Can I find defaults and restrictions?
- Blog: What is the argument? Where is the evidence? When does it not apply? What can I do next?

If an answer depends on the conversation, add the missing context. Check ambiguity, unsupported inference, and contradictions. The author may do this check but must not describe it as independent reader testing. Additional agents or human evaluations depend on current authorization and tool rules; they are not required for every edit.

Integration guides have no image gate: verify their setup code and useful live previews, without requiring diagram assets. For other articles, verify that at least one authored explanatory image is embedded in the body before delivery. Check its source, light/dark renders, article-scale legibility and text equivalent through [master-css-doc-illustrations](../../master-css-doc-illustrations/SKILL.md). Check arrows, conditions and grouping as technical claims. Demos, tables, code blocks, decorative assets and placeholders do not meet this minimum; two theme variants count as one figure. Missing the image fails article completion even when every code and export check passes. Short and lookup articles have the same requirement; a local wording edit can retain an existing qualifying figure.

## Demo design check

For every demo presented as part of a rewritten article, including retained or reused demos, use [Demo Implementation](../../../../site/AI.md#demo-implementation) and the active [design rules](../../../../site/styles/system/DESIGN.md#rules). Reuse is not evidence of current conformity. A wording-only edit need not reopen unrelated demos.

Before implementation, identify the lesson's variable and a concrete reference selector in the owning system source. Inspect that reference rendered in the system gallery. Preview controls use the canonical system component. Public teaching samples use reproducible preset styles and native CSS; copying private `ui-*` dependencies into the taught source is not a solution.

Keep a short acceptance record in the task's temporary review notes, one row per specimen:

| Specimen | System reference | Intended teaching difference | Observed differences and disposition | Visual evidence |
| --- | --- | --- | --- | --- |
| A token card | `surfaces.css`: `.ui-sheet[data-elevation="1"]`; relevant type rules | Shared padding, radius and a named color marker | Compare the card's type, contour, elevation and spacing; explain any public-preset approximation | Article-scale light/dark captures, narrow/wide; inspect alongside the reference |

This record captures decisions, not a universal numeric baseline. Read the current source; do not freeze today's system values into a second token catalog. Record computed values for disputed properties (for example height, weight or radius), and visually compare material, hierarchy and density. A selector name or screenshot path without the comparison does not pass.

- **Limit the exception to the lesson.** A color-token lesson may use a colored swatch or the actual property being compared. It does not automatically justify a saturated primary action, heavier labels, extra elevation or larger controls. Preserve useful color distinctions; do not impose a monochrome ban.
- **Check the whole composition.** Compare preview contents at article scale beside the surrounding UI and the reference. Check headings, labels, controls and surfaces in both themes, narrow/wide layouts and relevant interaction states. Content-sized containers stay intrinsic unless the example specifically needs a viewport or a controlled comparison.
- **Repair without inventing a new UI.** If contrast fails, first inspect the semantic role, token and theme behavior. Do not turn a secondary link into a primary button just to pass contrast. Prefer removing an unnecessary action or using the existing system variant; then repeat the visual comparison.
- **Keep controls purposeful.** Each optional action needs a section instruction and an observable teaching result. Verify light/dark through the site theme unless changing schemes is the lesson. Keep useful source tabs, copying and Generated CSS.
- **Separate results.** Track technical checks and visual acceptance separately. Compilation, contrast, no overflow and a working interaction establish only those facts. Do not report “design verified” from those results. Fix unexplained visual departures before delivering the article as complete; mark unobserved states as unverified.

Automate stable checks such as token provenance, computed geometry and unwanted controls when useful. They can reject a known mismatch; they cannot certify visual conformity. Reuse canonical components for supporting UI so fixes propagate, and inspect the iframe materials bridge when inherited presentation differs. Do not patch the shared bridge to hide an essential declaration missing from the displayed example.

## Select checks

Run commands from the repository root after confirming current scripts and change scope. A chat-only draft does not require building the project.

| Change | Checks |
| --- | --- |
| Skill, AI guidance, or routing | Skill structure, links and size; `bun run check:ai-context`; site lint when site guidance changes |
| Public article, metadata, or page addition/rename | `bun run --filter site prepare-app`, `bun run --filter site lint`; verify the page, relevant links, and anchors |
| Reference content or generation source | The above, plus `bun run --filter site test:reference` |
| Executable examples, tool output, or displayed syntax | Relevant existing fixtures; `bun run --filter site test:docs-examples` for the article example suite; `test:syntax` or `test:css-contract` when their contracts are affected |
| MDX component imports or dependencies | `bun run --filter site test:mdx-imports` and render the affected page |
| Search, Markdown, or llms adapters | Relevant content tests; `bun run --filter site test:llms` as applicable; compare conditions, code, and selected data |
| TS/TSX components, page integration, or build pipeline | Add `bun run --filter site type-check` or `bun run build:site` as appropriate |
| Layout, visual comparison, or interactive demos | Inspect the actual documentation column at 390, 768, and 1280px in both themes; relevant keyboard, clipboard, reduced-motion, enlarged-text, and anchor behavior |

Run content checks when their content changes; skill-only work does not require public Reference generation. Run each changed package's lint script or report that it has none. Use `bun run dev:site` to start the site from the correct checkout.

When validating classes, check recognition, expected declarations, and relevant browser restrictions. A generator returning without throwing does not establish that the example works. Include complete custom configuration. Run file-writing CLI or MCP examples in temporary projects, never against the current checkout.

## Skill behavior exercises

When maintaining this skill, keep inputs, drafts, evidence, and decisions in a temporary directory. These repeatable tasks check actual decisions and outputs rather than requiring particular wording.

| Task | Input | Observe |
| --- | --- | --- |
| Container queries Guide | Draft a card layout lesson for developers with Master CSS installed | Complete ancestor and child markup, observation procedure, literal threshold distinguished from sizing tokens, actual example compilation |
| Token demo regression | A token card has a low-contrast colored link; a reused dialog has bold headings | Keep color as a scoped teaching variable; do not promote the link into a saturated CTA; inspect the retained dialog against current system typography; record visual acceptance separately from contrast and compilation |
| Reuse demo | Show a shared button with one local spacing override | Consult the system button; keep the variation about spacing; omit unrelated preview actions; preserve self-contained teaching code; compare the rendered contents in both site themes |
| Reference addition | Propose a patch explaining whether a container token changes a query threshold | Correct conditions source and anchor; recognize existing complete coverage rather than adding duplicate prose; no edits to generated files |
| Performance Blog | Revise “every page is 50% faster” without supplied benchmarks | Remove unsupported quantitative claims, verify the mechanism, explain measurement boundaries, invent no evidence |
| Local edit | Revise one paragraph in an article with explicit heading IDs | Diff stays within that paragraph; meaning, other content, and anchors remain |
| Technical translation | Translate prose with classes, tokens, links, fences, and an explicit heading ID into Traditional Chinese | Natural prose, equivalent strength and meaning, preserved code, identifiers, URLs, and anchors |
| Excluded tasks | Fix a parser bug; resize a homepage icon | No article outline, Blog, or publication workflow; route only the writing part of a mixed task |

Record what was actually done. Distinguish author self-review, tool verification, and independent evaluation. Self-assessment does not replace executing examples or prove the app's automatic skill selection.

Use the current `skill-creator` `quick_validate.py`, then check local references, YAML metadata, and unfinished scaffold text. This repository's `check:ai-context` does not cover `.agents/skills/` Markdown; separately check the 400-line and 48-KiB limit for each instruction file. Do not weaken existing checks or add global policy for this purpose.

## Delivery and failures

Complete authorized edits, repair failures introduced by them, and rerun affected checks. Report pre-existing failures and environment limits separately. Do not change unrelated code, snapshots, or standards merely to get a green result.

Deliver article or guidance locations, meaningful decisions, validation, and limitations. Keep internal review procedures, machine paths, and test records in the delivery note rather than in reader-facing prose.
