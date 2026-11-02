# Guide: complete a task and understand the tradeoffs

Read [Guide and Reference ownership](../../../../site/AI.md#guide-and-reference-ownership) and [Teaching sequence](../../../../site/AI.md#teaching-sequence). Guide retains the examples and visual comparisons needed for a task; Reference owns complete lookup contracts.

## Choose the teaching approach

| Primary need | Structure | Successful result |
| --- | --- | --- |
| Learn a capability for the first time | One guided path; defer alternatives | Readers reproduce the result and understand the new concept |
| Complete an existing task | The shortest complete procedure; branch where needed | Readers apply the procedure to their situation |
| Decide between approaches | Concrete context, comparison, decision criteria, and examples | Readers know when to choose an approach and its costs |

An article can include necessary background while keeping one primary task. When many options exist, offer a conditional default and introduce alternatives where a decision is needed.

## Adaptable article sequence

1. Name the task and show or describe the result.
2. State prerequisites that affect reproduction, such as completed framework setup.
3. Present the main example with its code, explanation, and demo together.
4. Identify what readers should change and how to verify the result.
5. Explain applicability, tradeoffs, common failures, and necessary support or accessibility handling.
6. Link to Reference when a complete lookup is useful.

This is a reading sequence, not six mandatory headings. Setup guides prioritize working configuration; visual topics prioritize observable comparisons. Put restrictions that would break the main example before its instructions.

Integration guides are exempt from the image requirement and use commands, configuration and useful live previews without adding diagram assets by default. Other Guides require at least one explanatory image. Identify the process, hierarchy, scope or comparison readers must understand and use [master-css-doc-illustrations](../../master-css-doc-illustrations/SKILL.md) to produce the figure beside that explanation. Keep useful working demos, code and observable results with the lesson; they complement the image rather than replacing it. A decorative image or a row of prose cards does not satisfy the requirement.

## Project example: container queries

Read the current [Container queries Guide](../../../../site/content/guide/containers/content.mdx), then check the [conditions contract](../../../../site/content/guide/conditional-queries/contract.mdx) and relevant source or tests. These pages provide context rather than permanent gold standards.

A useful task statement:

> Make a card switch to two columns when its parent has enough space.

This teaching markup assumes Master CSS is loaded. Use existing site components to demonstrate the same behavior on a published page:

```html
<section class="(container-type:inline-size)">
  <article class="grid-cols(1) gap-lg grid-cols(2)@container(width>=28rem)">
    <div>
      <h2>Flexible workspace</h2>
      <p>A desk with room for focused work.</p>
    </div>
    <div>
      <p>Available for a full day or an afternoon.</p>
      <p>Natural light and a quiet corner.</p>
    </div>
  </article>
</section>
```

The lesson should establish:

- The query container is an ancestor; the article's two children become columns.
- Observe the same card in narrow and wide parents; check the two-column change at `28rem`.
- `28rem` is this example's content threshold, not the fixed meaning of `--container-md`. Changing a sizing token does not rewrite the literal query.
- Viewport decisions, component queries, and wrapper width caps serve different purposes. Link only to the next steps readers need here.

Explicitly import `Class2CSS` in published MDX and generate inspectable CSS from the same classes. Do not maintain a handwritten copy of generated output.

## Editing example: turn capabilities into a task

Weak opening:

> Container queries provide a powerful and flexible way to create responsive layouts in modern applications.

Better opening:

> A card in a sidebar has less room than the same card in the main content area. Add a query container around it, then switch to two columns when that container reaches `28rem`.

Follow with the example and observation procedure, then explain how to choose a threshold. The broad benefit becomes a task readers can complete.

## Integration and example checks

- Check same-type Guide metadata, page factories, MDX, and categories. Titles and summaries describe reader purposes rather than lists of keywords.
- Keep necessary entrypoints, imports, and filenames for the setup. Do not assume configuration that the reader has not supplied.
- Use `Class2CSS` for default classes. For custom settings, inspect the actual [ConfiguredExample interface](../../../../site/reference/ConfiguredExample.astro).
- Retain teaching scales, palettes, and comparisons. Reuse shared data instead of copying preset values.
- The demo, displayed code, and output must express the same behavior. Internal component wrappers need not appear in framework-neutral examples.
- For a new data-bearing component, locate its search and Markdown adapter and preserve text equivalents according to [Reference maintenance](../../../../site/reference/MAINTENANCE.md).

## Common failures

- Several sections introduce terminology and options before showing a working result.
- An incomplete snippet substitutes for a complete task, omitting ancestors, imports, settings, or actual content.
- Repeated demos and syntax add no new lesson.
- Design advice is presented as a fixed token or tool contract.
- Useful visual comparisons are removed for brevity, or readers must visit Reference before they can understand the main example.

Before delivery, answer “What do I change?”, “How do I know it worked?”, and “When should I choose another method?” from the article, then run the relevant [validation](review-and-validation.md).
