# Spacing

Space expresses relationships. People should recognize which label belongs to which field, which items form a group and where a new section begins before reading every word.

## Establish a rhythm

Use a small spacing scale and reuse it for recurring relationships. Keep within-group gaps smaller than between-group gaps. Choose the scale against actual content and density; neither an eight-pixel grid nor any other numeric base is a universal requirement.

Align related text starts and controls to shared edges. Optical correction may improve a particular icon or glyph, but should not replace a coherent layout model. Padding belongs to a container's internal relationship; margins and layout gaps separate siblings.

## Preserve relationships at different sizes

When space narrows, collapse optional columns or change the composition before compressing all gaps. Keep a field's label, help and error together. Make room for wrapped text instead of fixing a row height that clips it.

Distinguish the visual footprint from the interaction target. A compact icon can keep a generous hit area, but that area must not overlap neighboring rows. Treat any negative margin as local geometry and verify the complete clickable bounds.

## Read the grouping before the numbers

Consider two fields, each with a label and help text. If the gap from a label to its input is larger than the gap to the previous field, the layout suggests the wrong association. A shared spacing scale does not prevent this: the relationship between the chosen values matters.

Use a controlled comparison that keeps text, font and container width identical. Compare equal gaps with smaller within-field and larger between-field gaps. For a particular specimen, 8 and 24 CSS pixels can illustrate the relationship; they are not a universal scale or a substitute for the project's tokens.

## Reconcile enclosure and rhythm

Container padding belongs to the boundary-to-content relationship. Adding the same amount as both child margin and parent padding can produce an unintended double gap. Inspect the first and last child as well as the repeated middle rhythm.

Keep error messages and wrapped help inside their field group. Let vertical space grow when content grows instead of absolutely positioning a message into the next target. The test is whether people can still identify the associations after wrapping, not whether every row preserves its original height.

## Review

Compare the same content with only the named spacing variable changed. Inspect edges, nested enclosure, focus rings and the longest state. At 320 CSS pixels and with enlarged text, the grouping should remain recognizable. See [layout craft](../layout.md) and [nested geometry](../geometry.md).

## Distinguish three distances

Within-group gaps connect related siblings; enclosure padding separates content from its boundary; between-group separation distinguishes groups. Compare related quantities before applying a ratio. Label-to-input spacing usually needs to be tighter than separation from the next field, but a card with 24px padding, 8px internal gaps and a 12px external gutter can remain well grouped by its enclosure.

These values are specimens. Read labels and fields without their borders, then with them. If a label seems closer to the wrong input, repair that relationship. Do not reject a valid card simply because its padding exceeds the gutter. Keep content and typography fixed when comparing grouping. See [geometry](../geometry.md) for painted inset measurement.
