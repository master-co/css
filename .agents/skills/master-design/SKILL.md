---
name: master-design
description: Build and refine web interface details in the project's existing design language. Use for surfaces, images and avatars, typography, spacing, icons, component states, responsive layouts and interaction polish, with implementation and visual verification.
license: MIT
metadata:
  author: master-co
  version: "0.1.0"
---

# Master Design

Make relationships deliberate: an edge against its background, an insert inside its track, letters inside a control, and feedback following the user's next action.

## Establish the target

Read the relevant project instructions, component and styling sources. Identify its framework, tokens, fonts, density, themes and affected states. For new interfaces, establish content, primary tasks and visual direction. Preserve existing conventions unless the user requests a change.

Use the provided URL, image or code as evidence. A screenshot permits a reconstruction, not an exact source-value claim. Separate measured values, deductions and visual judgments using [evidence and verification](references/evidence.md).

For review-only requests, report observations and proposed fixes. For implementation requests, carry fixes through the actual code and verify them. Polish does not authorize replacing the framework, fonts, library or brand.

## Load the relevant detail

Read only the references needed for this task:

| Work | Reference |
| --- | --- |
| Rings, hairlines, layered shadows and dark surfaces | [Surfaces](references/surfaces.md) |
| Insets, painted boundaries, nested and continuous corners | [Geometry](references/geometry.md) |
| Image outlines, crop, container edges and avatar stacks | [Images](references/images.md) |
| Wrapping, figures, visible glyphs, icon weight and tracking | [Typography](references/typography.md) |
| Grouping, alignment, density and narrow layouts | [Layout](references/layout.md) |
| Segments, shared seams, pressed state, targets and focus | [States](references/states.md) |
| State swaps, interruptions and entrance/exit timing | [Motion](references/motion.md) |
| Glass, directional edges, masks and falloff | [Materials](references/materials.md) |

**Aron preferences are opt-in.** Read [Aron preferences](references/aron-preferences.md) when explicitly requested or selected by project instructions. Its palette, radii and numeric recipes are specimen starting points, not the default for every polish task.

## Refine the implementation

Start with a visible failure: a doubled seam, moving label, weak control edge, or misleading grouping. Preserve what works. Keep contour, depth and state independently adjustable; strengthen functional boundaries when identification requires it.

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
