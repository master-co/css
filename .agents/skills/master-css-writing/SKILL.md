---
name: master-css-writing
description: "Research, write, edit, translate, and review Master CSS Guide, Reference, and Blog articles. Organize content around reader tasks, verify technical claims and examples, and follow the project's content ownership and export conventions. Use for public technical articles and their titles or summaries; exclude standalone code fixes, homepage marketing copy, and standalone visual design."
---

# Master CSS writing

Help readers complete a task, find a reliable contract, or understand a technical argument supported by evidence. Match depth and effort to the request while preserving the author's useful ideas and voice.

## Choose the work

For Integrations-category articles and their dual-brand covers, use [master-css-integrations](../master-css-integrations/SKILL.md) for the specialized workflow; retain this skill's shared editorial methods. Integration covers are decorative and do not introduce a technical-diagram requirement.

Read the requested article, nearby examples, and the applicable [site/AI.md](../../../site/AI.md). Do not reread unchanged guidance already in context. That file owns content policy; this skill supplies editorial methods.

| Reader need | Guidance |
| --- | --- |
| Learn an operation, complete a task, or understand design tradeoffs | [Guide](references/guide.md) |
| Look up syntax, values, inputs, outputs, defaults, or restrictions | [Reference](references/reference.md) |
| Understand a technical problem, feature, or implementation argument | [Blog](references/blog.md) |
| Revise wording, paragraphs, titles, summaries, or translations | [Writing style](references/writing-style.md); load the article-type guidance if its structure needs work |
| Review claims, check examples, or validate a finished change | [Review and validation](references/review-and-validation.md) |

Choose the primary reader need before drafting. Different articles may cover the same topic, but each needs a distinct purpose and an authoritative source for its facts. Guide can include necessary explanation and visual comparisons; Blog does not replace a Reference contract.

Do not apply the article workflow to standalone code fixes, homepage marketing copy, or standalone visual design. Articles outside the Integrations category require at least one explanatory image: use [master-css-doc-illustrations](../master-css-doc-illustrations/SKILL.md) to produce it. For mixed requests, apply the writing workflow only to the article portion. Make small edits directly without requiring a research report, outline, or complete rewrite.

## Research and define the purpose

Infer the audience, prior knowledge, intended decision or action, and edit scope from the request and existing content. A new article can start with a one-sentence purpose:

> Help developers make a reusable card respond to its parent width and choose a useful container threshold.

Check whether existing content already meets that need before adding, extending, or reorganizing an article. A topic does not automatically need a new URL. Deliver an outline, draft, or review when that is requested; edit repository sources when the user requests a repository change.

- Verify Master CSS behavior against the current checkout's source, tests, and public interfaces. Documentation helps locate evidence but cannot establish semantics by itself. Contracts remain with their existing owners.
- Consult official documentation or standards for external specifications, framework integrations, compatibility, and changing facts. Place citations beside the claims they support; search snippets are not sufficient evidence.
- Performance, adoption, and comparison claims need traceable evidence and conditions. Distinguish measurement, inference from a mechanism, and design advice. Narrow or remove unsupported claims instead of inventing numbers.
- For substantial articles, keep brief working notes mapping claims to evidence and limitations. Do not create a permanent report for every edit. Public prose links to reader-accessible sources; local machine paths belong in the delivery note.
- When documentation and implementation disagree, investigate and report differences relevant to the article. Writing work does not automatically authorize engine or public API changes.

Discover what you can before asking questions. Ask only about missing information that changes the article, such as unavailable measurements or a private case study; continue independent work while waiting. Remove unresolved placeholders before delivering a complete article and identify unsupported points separately.

## Draft and edit

For new articles or substantial restructuring, make a short outline connecting each reader question to its answer and evidence or example. Follow [site content policy](../../../site/AI.md): integration guides use commands, configuration and live previews without adding explanatory image assets by default. For other articles, including short and lookup articles, plan at least one explanatory image. Identify the sequence, conditional branch, hierarchy, scope or visual difference it will explain, then produce and embed it beside that explanation using [master-css-doc-illustrations](../master-css-doc-illustrations/SKILL.md). Keep useful working demos as complementary teaching; they do not replace the required image. A placeholder, decorative cover or uniform prose cards do not satisfy the requirement. For articles subject to the image requirement, do not deliver them as complete without their image; retain an existing qualifying figure when revising rather than producing another for every wording edit.

Edit ordinary revisions directly. Choose the sequence for the article type rather than imposing an introduction, three body sections, and a conclusion.

1. **Check claims and sequence.** Give each section a purpose, introduce prerequisites before they are needed, and remove irrelevant, repeated, or unsupported arguments.
2. **Make the content usable.** Instructions include necessary setup and observable results; contracts explain conditions and failure; Blog supports its argument with examples and tradeoffs.
3. **Edit the sentences.** Use the shared style guidance to clarify subjects, causes, and conditions. Connect paragraphs naturally. Preserve essential restrictions instead of shortening indiscriminately or turning every paragraph into a list.
4. **Check reader understanding.** Can someone answer the intended questions and complete the example using only the article and its stated prerequisites? Repair ambiguous references and missing context, then run relevant checks.

Complete authorized writing without waiting for approval at every paragraph. For local edits, preserve unrelated content, stable anchors, and the author's position. Review-only requests receive evidence with file and line locations; do not silently edit or publish review comments.

## Integrate with the project

- Default to English articles and English skill instructions. Follow an explicitly requested output language. Translation preserves identifiers, code, links, and semantic anchors through the existing locale workflow.
- Before adding a page, inspect same-type `metadata.ts`, `page.tsx`, MDX, and category data. Do not copy Guide configuration blindly into Blog. Author, date, and publication status need a known source.
- Edit authored Reference sources. The [maintenance guide](../../../site/reference/MAINTENANCE.md) explains generation, search, and exports. Import custom MDX components explicitly and retain a text equivalent for meaningful content.
- Verify examples through public compilation or tooling capabilities. Use `Class2CSS` for default classes and `ConfiguredExample` for custom configuration. Existing components own generated-CSS disclosures.
- When adding or changing a demo, or retaining one in a rewritten article, follow [Demo Implementation](../../../site/AI.md#demo-implementation) before choosing its styling or controls. Identify the system component used as the visual reference and the variable readers should manipulate. Review the rendered preview contents through the [demo design check](references/review-and-validation.md#demo-design-check); record the actual comparison, intended teaching differences and remaining mismatches separately from technical test results. A shared wrapper and passing code checks are not visual approval. Use `master-design` when the demo needs interface refinement.
- Keep article work within scope. A prose change does not imply visual redesign, a site-wide rewrite, or publication. Reuse existing policy, package scripts, and data flows instead of adding another generation or validation framework.

## Finish

Use [review and validation](references/review-and-validation.md) to select checks and fix failures introduced by the change. Deliver the article or source locations with a brief account of meaningful editorial decisions, claim verification, and unresolved limitations. Report pre-existing failures separately. A draft request receives the complete draft, not an outline or a workflow explanation.

Read [research sources](references/research.md) only when maintaining the skill or examining the reasons behind its design.
