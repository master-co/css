# Elevation and surfaces

Use surface treatment to distinguish regions and layers. A shadow, fill change or edge should explain containment, interaction or overlap rather than merely make every element appear raised.

## Establish a surface ladder

Separate the base canvas, grouped content, interactive faces, recessed inputs and overlays. Reuse these roles across the interface. A large content section can be grouped through spacing; it does not always need a card.

In light appearances, a restrained shadow and edge can define a raised face. In dark appearances, controlled fill differences and directional edges often carry more information than shadow alone. Keep the hierarchy readable without requiring a bright outline around everything.

## Keep layers distinct

Visual depth and stacking order are different decisions. A strongly shadowed card should not cover a dialog. Use native top-layer behavior where appropriate, and document which overlays may coexist. Check a tooltip, menu and modal together instead of assigning ever-larger z-index values.

Keep active, pressed and selected behavior stable. A pressed face may reduce depth without moving its label or changing the control's footprint. Functional input boundaries and focus indicators need their own contrast, separate from decorative hairlines.

## Review

Check adjacent surfaces, scrolling and overlay clipping in both themes and forced colors. Remove shadows temporarily to see whether essential boundaries still exist. See [surfaces](../surfaces.md), [materials](../materials.md) and [overlays](../components/overlays.md).
