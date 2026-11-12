# Master UI foundations

Master UI applies this guide through reusable HTML and CSS components, semantic theme values and interaction behaviors. The general guidance remains useful in other brands and frameworks; this page describes the choices specific to Master UI.

## Ownership

| Project | Owns | Does not own |
| --- | --- | --- |
| Master Design | Design principles, usage guidance, foundations, patterns and verification methods | A second runtime stylesheet or component API |
| Master UI | Component contracts, themes, reusable styles, behaviors and implementation examples | Product-specific content, routing or application data |
| Master CSS | Styling syntax, compilation, runtime delivery and general preset primitives | A product's interaction decisions |
| Master | Brand and ecosystem website, shared first-party site shell and publishing infrastructure | A parallel reusable component library |

A consumer uses Master UI for reusable presentation and Master CSS for local composition. The site shell assembles navigation, documentation and site-specific presentation. Design informs these implementations through documentation, not a runtime dependency.

## Native behavior and explicit contracts

Start with native elements and their actual state attributes. Master UI classes describe supported markup; its contracts document the public parts and states. A visual class does not supply missing keyboard behavior. Use the shipped behavior or a complete framework integration when the pattern requires one.

Do not invent modifiers from a similar library. Read the current component contract before writing markup, then run the UI checker and test the rendered interaction. Static checks cannot prove focus, announcements or visual contrast.

## Moonstone and Obsidian

The default material uses **Moonstone** for the light appearance and **Obsidian** for the dark appearance. They share a neutral zinc vocabulary and a consistent imagined light source above and slightly to the left. Moonstone suggests a pale pearl through a restrained change across the face, a fine contour and a short fading shadow. Obsidian separates dark surfaces through fill steps, a controlled highlight and a readable edge; simply inverting Moonstone's colors would lose that separation.

The purpose is to make containment and interaction legible without letting decorative color compete with content. Neutral light and depth identify ordinary surfaces; semantic hues communicate status, and a deliberate brand accent identifies the important moment in a view. These are Master UI defaults, not requirements for another project's identity. A quiet material is successful only when the relevant field, action or layer is still easy to find.

Review a raised button, a field and an open menu on the same page in both appearances. The menu must separate from the content behind it, the field must remain identifiable before focus, and muted text must remain readable on its actual surface. Inspect fine contours at the rendered size and relevant display densities; a decorative edge is not evidence that an essential control boundary meets contrast requirements. The [default theme](https://ui.master.co/guide/theme) owns the executable materials, [line roles](https://ui.master.co/guide/theme#lines) and [text roles](https://ui.master.co/guide/theme#text).

## Choose a role on the material ladder

Choose a surface for what it does, then let the theme resolve its appearance. The ladder expresses relationships rather than a rule that every nested container must become brighter or more elevated.

| Role | Design purpose | Observable review |
| --- | --- | --- |
| Base canvas | Carry the page without enclosing every section | The reading order remains clear when decorative containers are removed |
| Tray | Recess a holder behind related sheets | The holder supports grouping without competing with the sheets it contains |
| Raised sheet | Present a bounded piece of content or an actionable face | Its edge separates from its immediate surroundings without resembling an overlay |
| Inset well | Make an editable field, track or collection region read as contained | The user can find the region before hovering; focus and invalid state remain distinct |
| Floating surface | Separate a menu or popover from the content it overlaps | Its boundary remains readable over both light and dark content and does not clip |
| Inverse ink | Give a primary action or selected mark a strong visual weight | The label and smaller marks retain contrast; several competing ink regions do not obscure the primary task |

A modal also needs its backdrop and platform layering behavior. A shadow does not establish stacking order or block background interaction. Likewise, a raised sheet is not automatically clickable: use semantics, labeling and supported state treatment to communicate an action. Consult the [surface implementation](https://ui.master.co/components/surface), [surface roles](https://ui.master.co/guide/theme#surfaces), [elevation roles](https://ui.master.co/guide/theme#elevation) and [inverse ink](https://ui.master.co/guide/theme#ink) for the current contracts and values.

## Concentric geometry and continuous corners

Nested edges should describe one relationship. A holder derives its corner from the inner control and the space between them; an inset child derives its corner from the enclosing surface. This keeps the gap visually even through the bend. Giving both edges the same radius despite an inset creates a pinched or swollen corner, even if each radius looks acceptable alone.

Master UI applies this relationship to trays and sheets, segmented tracks and their selected option, buttons inside input groups, and media inside cards. Coordinate the inset, corner roles and component size together. Do not repair a mismatched pair by rounding an isolated descendant until a screenshot happens to look right. True circles such as thumbs and avatars keep their own geometry.

Continuous corners soften the transition between straight edge and bend when the browser supports them. The theme coordinates the corner shape and apparent roundness; the circular fallback must still look intentional and preserve the same content bounds. Continuous curvature is a material choice, not a requirement for accessibility or correctness.

Review the gap around a selected segment and an input-group button at each supported size, in both appearances and with the corner fallback. The inset should stay visually even; text and focus indicators must not be clipped. Use the [shape implementation](https://ui.master.co/guide/theme#shape), [segmented control](https://ui.master.co/components/segmented), [input group](https://ui.master.co/components/input) and [card](https://ui.master.co/components/card). For the underlying geometric reasoning, see [geometry](geometry.md).

## State feedback on a stable control

In the default material, rest reads as raised, hover strengthens the face's edge and lift on hover-capable pointers, and a press sinks toward an inset face. The change confirms the input without changing the control's layout footprint. A color change alone should not carry the distinction, and hover must not be the only way to discover an action on touch.

Treat focus, selection, press, validation and availability as separate information. Focus identifies where the next keyboard input goes; a selected segment or checked mark identifies the persistent value. An invalid field can also be focused. A busy action needs explicit progress feedback, and its application integration must prevent unintended repeated submission. A visual disabled treatment alone does not implement disabled behavior.

Review pointer down and release, cancellation, keyboard activation, selected-plus-focused, invalid-plus-focused, disabled and busy states. The user's value and label should remain stable, layout should not jump, and focus must not disappear beneath the material. With reduced motion, the state must remain readable without lift or scale. With forced colors, essential boundaries and selection must survive the loss of decorative shadows. See the [button contract](https://ui.master.co/components/button), [selection controls](https://ui.master.co/components/segmented), [motion implementation](https://ui.master.co/guide/theme#motion) and [behavior ownership](https://ui.master.co/guide/behaviors).

## Paper demonstrates a different material

**Paper** is an alternative theme within the same component contracts. Its warm neutrals, flat faces, ruled edges and tighter circular corners replace the default directional light. Hover and press no longer rise or sink through the shared lift setting; meaningful component movement, such as a switch thumb changing position, remains. Menus and dialogs retain restrained depth cues because a ruled edge alone may not explain overlap.

Paper demonstrates that the reusable component is its structure, behavior and coordinated roles rather than Moonstone's particular finish. Removing gradients and highlights shifts more responsibility to the line and fill differences. Flattening every role to the same face would remove hierarchy rather than create a coherent flat theme.

Compare the same button, field, selected control, inverse sheet and open overlay in Paper and the default theme. Markup, accessible names, value ownership and keyboard behavior should stay the same. Boundaries, focus and concurrent states must remain visible in both of Paper's color schemes; reduced motion and forced colors still apply. The [Paper implementation and preview](https://ui.master.co/guide/theming#paper) and [theme recipes](https://ui.master.co/guide/theming#recipes) are the reference, not a second token table in this guide.

## Customization boundaries

Change a semantic role when the whole material should change, a documented component custom property when one component needs a supported variation, and local composition when only a page's arrangement changes. A complete theme coordinates surfaces, their foreground ink, lines, depth, corners and state treatment. Changing the background in isolation can invalidate all the relationships drawn on it.

A theme supplies tokens and shared material recipes; it should not accumulate selectors that rewrite individual component structures. Paper mostly uses tokens, with a recipe override for a toned control whose face depends on that control's own hue. Tokens can be scoped at runtime; recipe definitions are resolved during compilation and affect the build. This distinction matters when a proposed exception should apply to only one region.

Preserve the published parts and native semantics when customizing. Do not remove focus or selection to obtain a quieter screenshot, use brand color as the only error cue, or assume that a smaller visual control still has an adequate target. Changing corner shape requires its coordinated scale; changing motion must retain understandable state feedback. Applications remain responsible for labels, data, validation and focus flows beyond the component's documented behavior.

Before adopting an override, exercise a representative button, field, nested control and overlay with real content, keyboard input and longer labels. Check both color schemes, increased contrast, reduced motion and forced colors. Consult [customization](https://ui.master.co/guide/customization), [theme rules](https://ui.master.co/guide/theming#rules), [contracts](https://ui.master.co/guide/contracts) and [browser support](https://ui.master.co/guide/browser-support); their current APIs and support limits remain authoritative.

## Components, layouts and blocks

A component earns its shared contract through material, state, platform behavior or geometry its parts must coordinate. A layout arranges regions and scrolling. A block composes components and layout for a concrete stretch of a page.

Do not promote site copy or a one-off hero arrangement into a universal component. Conversely, a reusable dialog, button or field should not acquire a second implementation in the site shell. Keep adapters limited to actual site composition and compatibility needs.

## Guideline to implementation

| Design concern | Master UI reference | Verify in the consumer |
| --- | --- | --- |
| Semantic colors, surfaces and depth | [Default theme](https://ui.master.co/guide/theme) and [theming](https://ui.master.co/guide/theming) | Contrast on actual adjacent surfaces in both themes |
| Type, spacing, dimensions and overrides | [Customization](https://ui.master.co/guide/customization) | Long content, density, text resizing and target bounds |
| Markup, parts and states | [Contracts](https://ui.master.co/guide/contracts) | Native semantics and concurrent states |
| Keyboard, value and focus behavior | [Behaviors](https://ui.master.co/guide/behaviors) | Complete input sequence, teardown and focus return |
| Runtime and fallback requirements | [Browser support](https://ui.master.co/guide/browser-support) | Supported browsers, optional enhancements and usable fallback |
| Framework integration | [Frameworks](https://ui.master.co/guide/frameworks) | Value ownership, lifecycle and duplicate initialization |

These links identify the implementation owner; they are not a claim that every possible composition has been verified. For the current available components and their examples, use the [Master UI catalog](https://ui.master.co/components). Proposed patterns must not appear as supported controls before their contract, behavior and evidence exist.

## Review a change together

Start with the relevant foundation and usage guidance. Change the implementation in Master UI, then verify a representative consumer page. Update documentation when the intended behavior changes. Keep source, examples, contract and tests aligned; record browser and assistive-technology limits rather than turning a screenshot into a blanket accessibility claim.
