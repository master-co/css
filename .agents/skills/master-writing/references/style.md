# Writing style and editing

Use for drafting, polishing, titles, summaries, and translation. The consuming repository’s site instructions own content placement, current-version policy, examples, and locales. This reference addresses how the writing helps readers understand.

## Readers, focus, and paragraphs

- A common starting audience is developers who know HTML and CSS and have a specific task. Adjust prerequisites for the article; do not treat everyone as a beginner or an internal contributor.
- Open with the problem and result. Show the outcome or establish a concrete situation; remove empty announcements such as “In this article, we will explore.”
- Advance one idea per paragraph. Follow a claim with its reason, mechanism, or example. Connect the next paragraph through established terms and causal relationships instead of empty transitions.
- Put conditions that affect an instruction before the action, then explain the observable result. Do not hide a critical prerequisite after the step it governs.
- Explain only the part of a new term needed for the task. Preserve technical names rather than replacing them with conversational wording that means something else.
- A conclusion is optional. A tutorial may end with verification and a useful next step; a Blog ending should complete the argument without repeating every section.

## Titles and summaries

Help readers predict the content. Guide sections name actions or decisions; Reference sections use stable contract names; Blog titles state a supported argument or problem. Use sentence case for new English headings, preserving identifiers and proper names. Keep local heading edits within their requested scope.

| Context | Weak wording | Better direction |
| --- | --- | --- |
| Guide section | Advanced responsive configuration | Choose a container threshold |
| Reference section | Unlock powerful conditional styling | Container queries |
| Blog title | Revolutionary styling for every project | Choosing where CSS is generated |
| Summary | Discover the power of Master CSS | Choose a rendering mode based on when your application knows its class names. |

A summary adds audience, purpose, or boundaries rather than repeating the title or listing the entire contents. Use official names and reader vocabulary naturally; do not add empty sections or repeated synonyms for SEO.

## Sentences and credibility

Use concrete subjects and verbs: “The compiler emits…”, “The browser evaluates…”, “Add…”. Distinguish who does what and when, especially compiler, runtime, server, and browser responsibilities.

- Prefer familiar words while keeping necessary terminology. Do not strengthen or weaken `must`, `may`, defaults, or conditions during polishing.
- Describe effects and conditions. Claims such as “best”, “effortless”, or “blazing-fast” need evidence.
- Avoid “simply” and “obviously” as judgments about what readers should find easy. Explain necessary complexity clearly.
- Look for empty contrasts, three-part slogans, repetitive question-and-answer framing, and mechanical summaries. Judge whether they convey information rather than banning a sentence because it contains a particular word.
- Keep a natural rhythm: short sentences for actions and longer ones for relationships and conditions. Avoid both disconnected fragments and sentences overloaded with caveats.
- Preserve an original voice and a clear viewpoint. Do not add personal experiences, customer quotes, or feelings the author did not provide.

### Editing example: explain the mechanism

Original:

> Master CSS makes responsive design effortless with powerful container queries.

Revision:

> Use a container query when a card's layout should follow the width of its parent. The same card can use one column in a sidebar and two columns in a wider content area.

The revision names a decision and an observable result without claiming to solve every responsive design problem. If a threshold follows, identify it as a design choice for that example.

## Examples, links, and visuals

Size an example to the point it must demonstrate. A main example that readers reproduce needs its configuration, content, and result. A short syntax fragment can omit context only when that context is clear. Never hide a necessary ancestor element or setting behind an ellipsis.

Introduce the purpose before code, then explain the few lines that matter and their result. Avoid narrating every token. Follow the project's preference for visible HTML, CSS, and JavaScript; expose framework code when teaching that integration.

Use descriptive link text, such as “container query contract”, rather than “here”. Cite external facts beside their claims and link internal material to its actual owner and useful anchor.

Retain comparisons that help readers make visual decisions. Charts identify subjects, units, and conditions; images have appropriate alternative text. Label conceptual diagrams as illustrative rather than measured. Meaningful information must not depend solely on color, animation, or imagery.

Use tables for comparable fields and paragraphs for connected reasoning. Number sequential steps; do not make lists the default form for all prose.

## Translation and Traditional Chinese

Translate meaning rather than English sentence structure, preserving behavior, strength, and scope. Use natural technical Traditional Chinese and consistent existing terminology; include the English term at first use when useful.

Preserve identifiers, classes, package names, setting keys, URLs, and code. If the user explicitly requests localized example content, change only visible text and verify the same behavior. Keep explicit heading IDs when translating headings.

English:

> Changing `--container-md` does not change the query threshold.

Traditional Chinese:

> 修改 `--container-md` 不會改變查詢門檻。

Do not translate this as “修改容器寬度不會影響查詢”: that confuses a token with the actual container size. Do not label English fallback prose as a completed translation.

## Local editing

Identify whether the request concerns one sentence, a paragraph, structure, or a full rewrite. Preserve explicit anchors when changing headings. Do not restyle an entire article while fixing one paragraph. Report technical errors outside the requested edit separately.

When a draft has a clear voice, keep its argument, vocabulary, and rhythm. Change what obstructs understanding, lacks evidence, or conflicts with the request. Explain the improvement in terms of reader understanding rather than calling it “more professional” or “more engaging”.
