# Typography

Use type to establish reading order and distinguish information roles. Choose a small, coherent set of heading, body, label, supporting and code styles. A role is more useful than a list of unrelated font sizes.

## Set a readable hierarchy

Begin with the body text in its actual measure. Establish line height for the font and scripts the product supports, then set headings that make sections easy to find. Labels should remain readable at the control's intended density. Small supporting text is still content, not decoration.

Use real copy to judge hierarchy. A long translated heading, mixed-script name or two-line label reveals constraints that a short English specimen hides. Avoid fixed manual line breaks unless the content is intentionally authored as a fixed composition.

## Respect the font

A font's visible size, weight and metrics matter more than its nominal size alone. Load the actual font before measuring alignment. Keep project fonts and fallback behavior unless changing them is part of the brief. Review CJK glyph shapes, punctuation, mixed Latin runs and regional font selection together.

Use tabular numerals where values must align, not throughout all prose. Keep literal code and commands intact; typography enhancement must not change copied text or significant whitespace.

## Scale and wrap

Allow text to resize and controls to grow. Test 200% text, long unbreakable identifiers and narrow layouts. Use wrapping that respects language and punctuation; global break-all and negative tracking can hide layout problems while damaging reading.

## Separate reading from scanning

A long article needs a sustained reading measure and paragraph rhythm; a dense record list needs clear labels and aligned values. They can share a family without sharing every size or line-height. Judge a scale with a complete article and a complete task region, not a stack of isolated headings.

Hierarchy can come from position, spacing, weight and wording as well as size. If each nested heading becomes dramatically smaller, deep content may become unreadable. A larger heading that wraps into six lines may dominate the task accidentally; change the composition or wording before shrinking the entire page.

## Preserve exact content

Use tabular figures for changing totals and aligned comparisons where the font provides them. Right alignment alone does not align decimal points when precision varies; normalize meaningful precision or separate the number and unit columns. Missing values must not look like zeros.

Test delayed fonts, fallback glyphs, long identifiers, text-spacing overrides and copied code. Truncation needs a route to the full value when it affects identification. A tooltip available only on hover is insufficient for a long filename on touch. See [localization](localization.md) and [data display](../components/data-display.md).

## Review

Read a full paragraph and scan a complete form or list at native size. Check headings, captions, links, numbers and controls in both themes. Verify font loading does not move the primary action unexpectedly. See [typographic craft](../typography.md) for glyph edges, line boxes, numbers and CJK mechanisms.
