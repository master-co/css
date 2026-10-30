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
| Examples and visuals | Visible settings, code, and results agree; comparisons aid understanding and work as described |
| Integration and exports | Links, anchors, and MDX imports work; meaningful content survives the relevant output paths |

Incorrect syntax, invented data, missing necessary steps, and incorrect ownership must be resolved rather than averaged away by other strengths. For a small edit, review the dimensions it affects.

Present findings as severity, file and line, reader impact, evidence, and a concrete correction. If there are no material findings, say so and identify unperformed validation. Review-only requests receive findings; tool availability does not authorize publishing GitHub comments or editing articles.

## Reader checks

Ask practical questions based on the purpose and answer using only the article and its stated prerequisites:

- Guide: What do I change? How do I know it worked? When do I need another approach?
- Reference: What inputs are accepted? What is the output or scope? Can I find defaults and restrictions?
- Blog: What is the argument? Where is the evidence? When does it not apply? What can I do next?

If an answer depends on the conversation, add the missing context. Check ambiguity, unsupported inference, and contradictions. The author may do this check but must not describe it as independent reader testing. Additional agents or human evaluations depend on current authorization and tool rules; they are not required for every edit.

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

When maintaining this skill, keep inputs, drafts, evidence, and decisions in a temporary directory. These six repeatable tasks check actual decisions and outputs rather than requiring particular wording.

| Task | Input | Observe |
| --- | --- | --- |
| Container queries Guide | Draft a card layout lesson for developers with Master CSS installed | Complete ancestor and child markup, observation procedure, literal threshold distinguished from sizing tokens, actual example compilation |
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
