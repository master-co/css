# Components and states

Selected, pressed, focused and disabled communicate different facts. A tab persists; pressed follows activation; focus identifies keyboard position.

A segmented control has a continuous track and an insert with coherent inset/radius. Account for outside paint when measuring the visible gap. Keep content stable across states.

Shared operations can use a common outer shape and one internal seam, avoiding doubled contours. Inset seam endpoints when appropriate; retain structural dividers where they communicate real organization.

Pressed feedback can change fill/depth while preserving size and content position. Scale is optional and contextual, not a universal fixed percentage. Disabled controls must not respond as activated.

Compute progress against usable interior width. Treat track, fill and end shape together; keep the numeric label stable.

When replacing a drawn control with a real input, button or link, inspect the winning appearance, padding, border, line height and inherited color. Preserve the approved resting paint and alignment while adding real semantics. A native checkbox can keep its behavior with scoped custom paint, provided checked, focus, disabled and forced-colors states are also verified.

Separate visible glyph size from hit area. A 16px glyph inside a 44px target is one specimen; check neighboring targets for overlap. Use an accessible name and native control or established equivalent. Growing the target should not move the visible mark: preserve its center with explicit geometry, and verify actual bounds because flex shrink can silently reduce a declared target.

When local margins reduce the [row footprint](layout.md#mixed-content-rows), the control's border box and target can still extend outside it. Inspect the full clickable bounds and every adjacent row, not just the visible glyph. Keep hover and focus unobstructed; increase row spacing or density size when there is insufficient room.

Focus needs independent strength and must remain identifiable against its surroundings, rather than inheriting the decorative hairline. Check keyboard movement, activation, clipping, disabled state and forced colors. Keep a static text/icon cue alongside motion.

`mask` and `clip-path` cut an element's own outline and outer shadow along with its fill. When a part is drawn with a mask, put the focus indicator on its unmasked container, for example through `:has(:focus-visible)`, and confirm the whole ring is visible while tabbing.

A row in a list or menu answers the pointer at once, with no fade: an eased highlight trails a moving pointer and leaves neighboring rows half lit. Keyboard focus on a row uses a separate indicator, so hover and focus stay different facts; sweep the pointer across rows and arrow through them to check both.

An action revealed by hover still needs a discoverable entry on devices without hover. A code-copy button can stay visible there while using hover/focus revelation on pointer devices. Keep the accessible name and successful/failed feedback; hide an unavailable enhancement when static content already provides the fallback. Test the first touch directly, rather than tapping an unrelated surface to reveal the control before testing it.

## Multiple state cues

Assign distinct cues to distinct facts: selection may use a checkmark and fill, keyboard focus an independent outline, an error a message and boundary treatment, and unavailability a visible reason. Do not rely on hue alone. Match visual cues to native semantics or appropriate accessibility properties; a drawn checkmark alone does not make a control selected.

Check combinations as well as isolated specimens. A selected item may also receive focus; a validation error may remain when its field gains focus. Neither layer should erase the other. Focus cues must remain visible against selected fills, and error explanations should identify the affected input. A disabled explanation should not masquerade as successful feedback.
