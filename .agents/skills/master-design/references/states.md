# Components and states

Selected, pressed, focused and disabled communicate different facts. A tab persists; pressed follows activation; focus identifies keyboard position.

A segmented control has a continuous track and an insert with coherent inset/radius. Account for outside paint when measuring the visible gap. Keep content stable across states.

Shared operations can use a common outer shape and one internal seam, avoiding doubled contours. Inset seam endpoints when appropriate; retain structural dividers where they communicate real organization.

Pressed feedback can change fill/depth while preserving size and content position. Scale is optional and contextual, not a universal fixed percentage. Disabled controls must not respond as activated.

Compute progress against usable interior width. Treat track, fill and end shape together; keep the numeric label stable.

When replacing a drawn control with a real input, button or link, inspect the winning appearance, padding, border, line height and inherited color. Preserve the approved resting paint and alignment while adding real semantics. A native checkbox can keep its behavior with scoped custom paint, provided checked, focus, disabled and forced-colors states are also verified.

Separate visible glyph size from hit area. A 16px glyph inside a 44px target is one specimen; check neighboring targets for overlap. Use an accessible name and native control or established equivalent. Growing the target should not move the visible mark: preserve its center with explicit geometry, and verify actual bounds because flex shrink can silently reduce a declared target.

Focus needs independent strength and must remain identifiable against its surroundings, rather than inheriting the decorative hairline. Check keyboard movement, activation, clipping, disabled state and forced colors. Keep a static text/icon cue alongside motion.
