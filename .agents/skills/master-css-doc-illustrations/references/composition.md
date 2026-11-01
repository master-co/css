# Compose a visual explanation

Start with the question and draw the relationship that answers it. A figure should contribute structure that is cumbersome to recover from prose.

| Reader question | Useful visual structure | Misreading to prevent |
| --- | --- | --- |
| Which part means what? | Anatomy: one intact subject with exact ranges and direct annotations | Labels attached to a surrounding card instead of the relevant fragment |
| What arrives first, and what happens only later? | Sequence: matched stages with a labelled conditional branch where needed | A time axis or a mandatory step implied by unrelated spatial distance |
| What runs where? | Execution boundaries containing their real participants | Data passing through a place mistaken for execution there |
| What belongs inside what? | Nested regions or an indented tree | Mere adjacency implying containment or ownership |
| What changes between two cases? | Matched comparison with the relevant variable isolated | Unrelated changes in scale, position or material distracting from the comparison |
| How do these representations correspond? | Aligned source/result views with precise mappings | A correspondence arrow mistaken for time or execution |
| How does a change produce an outcome? | Mechanism: show the relevant intermediate operation and its result | Naming a process without exposing what it does |
| What does this CSS look like? | An annotated specimen derived from a working example | Inspection overlays mistaken for actual generated styling |

Choose one primary argument per figure. Split an overloaded lifecycle into adjacent figures if its overview and handoff require different detail. Keep each figure next to the prose that uses it.

## Choose fidelity and evidence

Choose detail by its contribution to the inference, not by a universal preference for realism or minimalism:

- **Exact evidence:** retain class punctuation, token names, code that proves a mapping, measured spacing and relevant UI states. A syntax figure cannot replace its class with placeholder bars.
- **Recognizable context:** preserve enough of a file tree, browser or control to identify the subject. Simplify unrelated labels and content into a few well-proportioned shapes when their identities do not matter.
- **Conceptual structure:** use abstract boundaries, paths or stages when they explain something the interface cannot show. Label their meaning; do not suggest that they are literal screens or physical objects.

These levels can coexist. A simplified page can contain an exact highlighted region, but every increase in detail should earn its place. Avoid decorating placeholders into a miniature product mockup. In a zoomed detail, show the actual evidence the zoom promises, with a clear connection to its location in the overview.

For initial design or a substantial redesign, inspect published references that share the reader task, not just the palette. Compare the role of their shapes, repeated objects, annotations and omissions. Transfer the reasoning into Master CSS's language; do not copy brand tokens, aspect ratios, or a background grid.

## Build a coherent visual grammar

Position, proximity, similarity and common boundaries all encode relationships. Reserve a line for a connection that needs one, an arrow for a direction with meaning, and a bracket for an exact extent. Explain ambiguous relationships with a short verb or label. Decorative lines can create false dependencies; removing every line can also make a real dependency disappear.

Use selective emphasis to establish a focal subject, then the relationship, then qualifications. Keep supporting context quieter. Place a label beside the region it explains, reducing back-and-forth lookup; a directly labelled range often needs no separate legend. When categories recur far apart, use a compact legend and preserve its mapping throughout. Do not confuse syntax highlighting with the literal colour that a CSS declaration will produce.

For sequences and matched comparisons, retain the same object's identity, orientation, baseline and scale. Previously rendered content stays present unless the lesson explicitly removes it. Change only the relevant state; do not make readers rediscover the entire scene at each step. Use spatial separation to distinguish alternatives from successive moments, and label the distinction when needed.

For anatomy, keep the source intact and legible. Bracket exactly the relevant substring or region, including meaningful punctuation. Derive the bracket from its content bounds and attach a leader there; route it through a clear corridor to the explanation. Avoid exploded layouts that accidentally teach spaces, separators or ordering absent from the real syntax.

## Make the subject carry the explanation

Decide what the reader must notice before choosing cards, arrows or icons. Useful subjects include the actual control being styled, a fragment of markup, a boundary around its real contents, or a repeated artifact whose identity survives a transformation. A literal specimen often communicates a visual property better than a metaphor; an abstract diagram is useful when the relationship itself is invisible. Avoid decorative metaphors that introduce a second concept the reader must learn.

For a comparison, preserve the invariant visibly and isolate the changing property. Keep labels, baseline, scale, material and unrelated geometry matched. A changed padding value should change the drawn padding, not merely the caption beneath identical cards. A shared definition should have one recognizable identity across its uses. A scope boundary should surround the affected content; a leader explaining a substring should attach to that substring, not to an arbitrary point on its surrounding card.

When replacing a weak figure, consider genuinely different ways to explain it before choosing one. Do not mistake variants of the same box arrangement for different concepts. Choose the structure that makes the reader's intended inference easiest; this is not a requirement to publish multiple candidates or request a preference each time.

**Reusing styles study:** four text cards and connecting arrows stated that `.action` was shared and `px-lg` was local, but the two output cards concealed the only visible change. One definition feeding two matched button specimens makes the common identity visible; dimension marks expose the two horizontal padding values, with a restrained accent identifying the local override. This is a worked example of reasoning from the subject, not a template for other articles. The live demo still owns hover and focus behavior; the static figure does not pretend to demonstrate those states.

Use two quick critiques while composing:

- Mentally hide the explanatory notes. Does the figure still reveal its important relationship or difference? Exact identifiers may remain necessary; the aim is not a wordless puzzle.
- Mentally remove the accent colour. Do position, geometry, boundaries or labels still identify the relationship? Colour should reduce effort without becoming the only evidence.

Prefer concrete, visible distinctions over more callouts. When the figure needs a paragraph to explain why two identical shapes differ, change the shapes or choose a better subject.

## Canvas and density

Compose every new or revised figure within the 720 × 480 (landscape 3:2) scene, drawn at the interface's own sizes (see [visual language](visual-language.md#scale)). Padding, arrowheads, labels and shadow clearance belong inside those dimensions; the article caption and HTML text description remain outside the image.

Use moderate whitespace around the composition and between groups to separate stages, clarify relationships and give the eye room to follow the paths. Size objects for their content at interface scale and connectors for readable, balanced relationships; canvas coverage is not a target. A sheet's height follows its rows, gaps and padding. Controls may retain the design system's minimum height while growing with their contents. Do not enlarge objects or spread them to the edges merely to fill the available area.

Keep content, padding and composition spacing separate. Prefer intrinsic widths and automatic heights; apply a maximum width when prose needs to wrap, and retain unbroken identifiers only when they fit. Equal dimensions need a semantic purpose, such as isolating a variable in a comparison or representing the same viewport. The fixed 3:2 canvas does not imply fixed rectangles inside it. After changing labels or contents, remeasure object bounds and move attached leaders and adjacent objects; do not squeeze the text to preserve old coordinates.

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
- Give dimension marks, cutaways and inspection overlays an explicit meaning. They must correspond to actual geometry and remain distinguishable from the UI or CSS being taught. Do not exaggerate a quantitative difference silently.
- Preserve stable headings and anchors when inserting a figure. Do not use image text as the only explanation of an important condition.

Before rendering, trace the normal path aloud and then each conditional edge. If a reader could infer the wrong owner, order, or trigger, repair the structure before polishing shadows.
