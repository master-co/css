# Compose a visual explanation

Start with the question and draw the relationship that answers it. A figure should contribute structure that is cumbersome to recover from prose.

| Reader question | Useful visual structure |
| --- | --- |
| What arrives first, and what happens only later? | Delivery path with a clearly labelled conditional branch |
| What runs where? | Execution boundaries containing their real participants |
| What belongs inside what? | Nested regions or an indented tree |
| What changes between two cases? | Matched before/after composition with the relevant variable isolated |
| Which artifact supplies or consumes this information? | Directed dependencies between distinct artifact shapes |
| What does this CSS look like? | A real demo or shared-data specimen, with inspectable source |

Choose one primary argument per figure. Split an overloaded lifecycle into adjacent figures if its overview and handoff require different detail. Keep each figure next to the prose that uses it.

## Canvas and density

Compose every new or revised figure within the 720 × 480 (landscape 3:2) scene, drawn at the interface's own sizes (see [visual language](visual-language.md#scale)). Padding, arrowheads, labels and shadow clearance belong inside those dimensions; the article caption and HTML text description remain outside the image.

Use moderate whitespace around the composition and between groups to separate stages, clarify relationships and give the eye room to follow the paths. Size objects for their content at interface scale (a titled sheet is 48–132px tall, a chip 32px) and connectors for readable, balanced relationships; canvas coverage is not a target. Do not enlarge objects or spread them to the edges merely to fill the available area.

Plan the relationships for this canvas from the start. If the explanation becomes too dense, remove secondary detail, move qualifications into adjacent prose, or split it into several focused 3:2 figures. Keep labels few and short, since phones scale the whole scene down. Reflow an existing tall composition for the canvas while preserving object proportions, readable type and natural spacing.

## Rendering modes examples

These statements describe the intended lessons; verify current implementation before producing or revising the diagrams.

**Progressive delivery:** the build or server supplies initial CSS with rendered HTML. The browser can use that CSS before runtime startup. With a valid pre-rendered stylesheet and page hydration manifest, the default runtime defers the engine. A newly connected class outside the manifest triggers engine/program loading. The diagram must not suggest that the manifest contains the CSS or that source scanning covers arbitrary dynamic SSR responses.

Use a document containing CSS, a styled browser view, and a conditional path to the engine. Contain runtime and engine work within the browser boundary. State the default assumptions nearby; explicit eager/idle settings and readiness calls need not overload this overview.

**Runtime delivery:** connected DOM class usage feeds rule generation and CSSOM updates. Distinguish usage tracking from cached rules. Do not draw every removed class as an immediate rule deletion, or suggest Rust executes in the browser.

**CSS hydration:** existing CSS and the page manifest meet engine replay and validation. Matching rules are adopted; a mismatch rebuilds CSS. Failure to load or validate a referenced manifest is a startup failure, not an alternative successful hydration path. Show the valid handoff clearly and explain failures without making all paths look equivalent.

## Edit the composition

- Remove a box when it adds no containment, artifact identity, or meaningful comparison.
- Remove an arrow when its direction carries no information. Label necessary ambiguous edges with the transferred artifact or triggering condition.
- Keep independent lifecycles independent; proximity alone must not imply a shared clock or immediate execution.
- Use the same terms as the article and current public interfaces. Reduce wording without hiding prerequisites or strengthening a claim.
- Put mechanism and constraints in surrounding prose; the image should show their relationship, not duplicate whole paragraphs.
- Preserve stable headings and anchors when inserting a figure. Do not use image text as the only explanation of an important condition.

Before rendering, trace the normal path aloud and then each conditional edge. If a reader could infer the wrong owner, order, or trigger, repair the structure before polishing shadows.
