---
name: master-design
description: "Design and refine web interfaces: principles, foundations, accessible interactions, component choices and complete task flows, with implementation and visual verification. Use Master UI foundations when working in the Master ecosystem; preserve other projects' own brands and frameworks."
license: MIT
metadata:
  author: master-co
  version: "0.3.0"
---

# Master Design

Start with the person, task and useful outcome. Establish hierarchy, interaction and accessibility before refining surfaces and geometry. Keep the project's brand, framework and density unless the task asks to change them.

## Establish the target

Read the relevant project instructions, component and styling sources. Identify its framework, tokens, fonts, density, themes and affected states. For new interfaces, establish content, primary tasks and visual direction. Preserve existing conventions unless the user requests a change.

Use the provided URL, image or code as evidence. A screenshot permits a reconstruction, not an exact source-value claim. Separate measured values, deductions and visual judgments using [evidence and verification](references/evidence.md).

For review-only requests, report observations and proposed fixes. For implementation requests, carry fixes through the actual code and verify them. Polish does not authorize replacing the framework, fonts, library or brand.

## Choose the relevant guidance

Read only the layers needed for the task. General guidance is portable; the Master UI page describes a specific implementation, not a mandatory style for other projects.

| Decision | Reference |
| --- | --- |
| Purpose, hierarchy, agency and design tradeoffs | [Principles](references/principles.md) |
| Semantics, keyboard, contrast, targets, reflow and announcements | [Accessibility](references/accessibility.md) |
| Visual roles and consistent dimensions | [Color](references/foundations/color.md), [typography](references/foundations/typography.md), [spacing](references/foundations/spacing.md), [sizing](references/foundations/sizing.md) |
| Containment, layering, symbols and movement | [Shape](references/foundations/shape.md), [elevation](references/foundations/elevation.md), [icons](references/foundations/icons.md), [motion](references/foundations/motion.md) |
| Choosing a control and its behavior | [Actions](references/components/actions.md), [fields](references/components/forms.md), [selection](references/components/selection.md), [navigation](references/components/navigation.md), [overlays](references/components/overlays.md), [feedback](references/components/feedback.md), [data display](references/components/data-display.md) |
| A complete task across states | [Form flows](references/patterns/forms.md), [search](references/patterns/search.md), [navigation flows](references/patterns/navigation.md), [asynchronous work](references/patterns/async.md), [recovery](references/patterns/recovery.md), [responsive composition](references/patterns/responsive.md) |
| Applying the guide to Master UI | [Master UI foundations](references/master-ui.md) |

## Refine the relevant detail

Use these craft references when the visible mechanism needs closer inspection:

| Work | Reference |
| --- | --- |
| Rings, hairlines, layered shadows and dark surfaces | [Surfaces](references/surfaces.md) |
| Insets, painted boundaries, nested and continuous corners | [Geometry](references/geometry.md) |
| Image outlines, crop, container edges and avatar stacks | [Images](references/images.md) |
| CJK and mixed scripts, wrapping, figures, visible glyphs and icons | [Typography](references/typography.md) |
| Grouping, hierarchy, disclosure, mixed-content rows and narrow layouts | [Layout](references/layout.md) |
| Segments, shared seams, concurrent states, targets and focus | [States](references/states.md) |
| State swaps, interruptions and entrance/exit timing | [Motion](references/motion.md) |
| Glass, directional edges, masks and falloff | [Materials](references/materials.md) |

## Refine the implementation

Start with an observable problem: an unclear action, lost input, missing keyboard behavior, misleading grouping, doubled seam or moving label. Preserve what works. Keep contour, depth and state independently adjustable; strengthen functional boundaries when identification requires it.

Inspect every affected state. Use semantic native controls or established accessible equivalents. Distinguish selected, pressed, focused and disabled. Real controls need local behavior, a valid destination, or an explicit unavailable state.

Use the project's styling system and tools. Translate the mechanisms in these references into that system without adding dependencies for small effects.

## Verify at the right scale

When making an approved static design interactive, retain a matched baseline and compare every affected component, including those outside the primary change. Native element defaults and broad CSS resets can alter paint and alignment even when behavior passes.

Check actual rendered size first. Enlargement explains construction but cannot prove native pixel quality. Fractional edges warrant relevant device densities and fractional scales. Type requires the real font and strings. Check affected themes and adjacent surfaces.

For interaction changes, check reversal, keyboard, touch, reduced motion and initial state. For layout, check narrow widths and longer content in relevant scripts. Keep readable static content when enhancement is unavailable.

Use the browser tools available in the environment. Browser access is not an installation prerequisite. If unavailable, inspect code/state coverage and mark visual checks unverified; do not claim a pixel-level result.

## Deliver a reviewable result

Explain the concrete change, visible purpose, checks and unresolved conditions. Preserve useful before/after evidence. Isolate the named variable in comparison diagrams. Full interfaces may combine changes; record the relationships adjusted.

This folder is the complete installed skill. Companion articles and repository examples illustrate it; neither is required to use it.
