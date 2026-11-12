# Design principles

Make the task clear, keep people in control, and make every detail support the result. These principles guide a web interface in its own brand and framework.

## Start with purpose

Name the person, the task and the useful outcome before choosing a component. Give the primary task a clear place and remove controls that have no working behavior. A quiet screen can still be complex to use; fewer visible elements are not a success if essential information becomes difficult to find.

For a search page, the goal is finding a useful result. Keep the query, applied filters, result status and a clear route back together. An elaborate search animation is secondary to those relationships.

## Preserve agency

Show what an action will do and communicate its result. Preserve entered data after validation fails. Provide a way to cancel a long operation when cancellation is possible, and explain what remains after it stops. Prefer reversible actions over repeated confirmations; confirm an irreversible consequence at the point where it happens.

Keep focus and context stable during updates. A completed task should not make a person's next control move without an understandable reason. See [recovery](patterns/recovery.md) and [asynchronous work](patterns/async.md).

## Build on familiar behavior

Use a link to navigate and a button to act. Keep native field semantics and expected keyboard interactions. Distinguish navigation tabs from panels switched in place. Use one meaning for each visual state throughout the product; selected, pressed, focused and unavailable convey different facts.

A familiar appearance does not excuse incomplete behavior. A menu needs its keyboard model; a styled list of links usually remains ordinary navigation.

## Establish hierarchy

Let content, grouping and sequence explain the interface before decoration does. Use a restrained set of type roles and space related items more closely than unrelated groups. Give one action clear emphasis within a decision, while keeping alternatives readable and available.

Reveal advanced options when needed without concealing consequential settings or the state of the task. See [layout craft](layout.md).

## Adapt without losing meaning

Design for keyboard, touch, pointer, zoom, long text and different scripts from the beginning. A compact desktop control can have a larger touch target without an oversized icon. Narrow layouts should preserve reading order and the primary task, not simply shrink every region.

Accessibility is part of the design brief. Use the [web accessibility baseline](accessibility.md) to turn intent into checks.

## Make craft earn its place

Tune edges, surfaces, geometry, typography and motion where they clarify boundaries or improve feedback. Decorative contours must not substitute for a visible focus ring or a necessary input boundary. Keep motion interruptible and preserve information with reduced motion.

Use actual content and rendered evidence. Separate measured geometry from visual judgment. Test a complete interaction, not just its attractive resting state.

## Reference and interpretation

These are original web-oriented guidelines informed by [Apple's design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles) and [Spectrum's inclusive design guidance](https://spectrum.adobe.com/foundations/inclusivity/inclusive-design). They do not import either product's visual styling, platform dimensions or component APIs.
