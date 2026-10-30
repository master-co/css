# Blog: an argument supported by evidence

Help developers understand a problem, method, or feature that deserves attention. Check the [current content policy](../../../../site/AI.md#current-documentation-and-migration-ownership): public articles describe current behavior without introducing retired syntax or version history. Feature introductions can explain present capabilities without inventing a development story.

## Choose a subject and angle

State the audience, problem, and argument in one sentence. If the result is merely “introduce Master CSS features”, narrow it to an angle that helps readers act or understand something differently.

| Article type | Useful sequence | Evidence needed |
| --- | --- | --- |
| Technical explanation | Concrete observation, mechanism, example, boundaries and costs | Implementation, specifications, reproducible output |
| Feature introduction | Reader problem, capability and value, representative use, applicability, next step | Current public API and executable examples; verify release claims separately |
| Implementation case | Context and constraints, choice, implementation, result, transferable lesson | Real case material, code, or measurements; identify illustrative scenarios |

Research existing Guide and Reference content so Blog adds explanation, analysis, or a case study. Retain the short examples needed for the argument and link full setup or lookup to its owner instead of maintaining three copies of the same lesson.

## Develop the argument

Open with a concrete difficulty, a result worth explaining, or a verifiable observation. Promise only what the body answers. Stories, questions, and surprising numbers are optional.

For each section, check the evidence, its contribution to the central argument, and reasonable reader objections. Put relevant costs and counterexamples beside the claim rather than hiding them at the end.

End with a judgment or next step established by the article, such as choosing a rendering mode based on when class names become known. Link to the implementation guide. Add a call to action only when it serves the reader's goal.

## Claims and evidence

| Claim | Required verification |
| --- | --- |
| What a rendering mode produces | Current public interface, source or tests, and actual output |
| Why a mechanism may improve a result | Causal chain and applicability; identify the inference |
| Faster or smaller than an alternative | Comparable workload, versions, environment, baseline, metric, and measurement method |
| Measurements or charts | Data source, units, conditions, and meaningful variation |
| User experience or author story | User-provided material or credible public evidence; never invent a real event |
| Newly released, currently supported, or framework version | Current release evidence or official documentation; a checkout does not establish publication |

When evidence is missing, describe verifiable capabilities and limitations. Do not turn a mechanism into a measured outcome or add arbitrary numbers to sound specific. Cite near the claim and keep conclusions within the evidence. Put authoring status, such as missing user-supplied data, in the delivery note; the article itself retains the measurement conditions that help readers judge applicability.

## Project case: when CSS is generated

The current [Vite article](../../../../site/content/blog/bootstrapping-master-css-with-vite/content.mdx) and [Next.js article](../../../../site/content/blog/master-css-next/content.mdx) locate same-type metadata, article layout, TOC, and technical topics. Existing slogans, time-sensitive wording, and claims still need verification.

For first-page CSS, check current server and integration behavior before choosing the argument. Without benchmarks, an article can explain when rules become available but cannot claim a measured improvement in paint timing.

## Editing example: remove an unsupported performance promise

Draft:

> Progressive rendering makes every page 50% faster and eliminates rendering delays.

After verifying the mechanism, a suitable revision is:

> In progressive mode, pre-rendered HTML includes the CSS generated for that document. The browser can use those rules without waiting for the Master CSS runtime to generate them. The effect on first paint depends on the page's other resources and should be measured in the target application.

This states the mechanism and measurement boundary. Do not use the revision if its mechanism cannot be verified. The draft's `50%` is a hypothetical unsupported claim, not a Master CSS measurement.

## Article integration

- Inspect same-type Blog metadata, page modules, and MDX. Use the article layout and current category flow; do not blindly copy possibly stale configuration from a neighboring page.
- Align titles and summaries with the actual argument. Use known author, date, and publication information. Preserve an existing date rather than implying republication after polishing; identify missing information in the delivery note.
- Code, screenshots, charts, and portable text support the same argument. Retain necessary settings and results. Add visuals when they improve understanding.
- Let the argument determine length. Do not impose word counts, three-part structures, fixed calls to action, or keyword density.

## Common failures

- Unqualified claims of superiority, speed, or universal applicability replace analysis.
- The opening promises a decision but the body only lists features.
- A feature introduction copies an entire Guide and drifts from its authoritative setup.
- Illustrative data, test output, or one measurement becomes a general performance claim.
- The writer invents team experiences, release history, or user stories.

Before delivery, check that readers can identify the argument, evidence, conditions, and next step, then follow the relevant [validation](review-and-validation.md).
