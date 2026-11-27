# Typography and visible weight

Preserve the project's typefaces and hierarchy. Wait for the actual font. A computed family name alone does not prove the intended face supplied the glyphs.

## Wrapping

Choose a wrap by how a block is read and how long it can grow, not by its element.

| Block | Wrap | Why |
| --- | --- | --- |
| Seen as one shape: a heading, a title, a label, a caption, and the sentence or two that completes a title, such as a card's or an option's description, a notice's message or the lead under a heading | `balance` | Lines of similar length read as one unit with the title |
| Read line after line, or of unbounded length: paragraphs, list items, messages, comments, field help, an error that quotes input | `pretty` | Full lines carry the reading; only the end needs repair |
| Changing while it is seen: text being typed, a reply that streams in, a live value | `stable` | A word already read stays on its line |

A short block wraps only because its column ran out. Filled lines then read as a full line and a spilled fragment, and a row of sibling cards shows a different fragment in each. Pretty wrapping does not reliably fix this: Chromium moves a word down only when the last line would be a single word, so a two-word fragment such as "a seat." survives. Balanced lines keep the block compact whatever its words.

Do not balance text that can grow long. Engines balance only a few lines (Chromium six, Firefox ten) and silently fall back beyond them, so a slot whose length you cannot bound would balance its short cases and leave its long ones without repair. Balancing a paragraph also shortens every line of the reading measure. Use pretty wrapping there; Safari applies it to the whole paragraph's rag, Chromium to the last few lines.

Balance and pretty re-break earlier lines whenever words are added. In a measured stream of 38 words in a 300px column, an earlier break moved at 6 steps with pretty and 17 with balance, and never with ordinary wrapping. `text-wrap` is inherited, and engines apply it to textareas and editable regions, so set `stable` on the editable or streaming element itself rather than relying on its container. Keep code, identifiers and single-line labels to their own rules.

Center balanced text. A centered block whose first line is full leaves a short centered line under it. Balancing never narrows the box, though: in a box sized by its own words, such as a tooltip, a bubble or a button, balanced lines leave the room they gave up inside the paint at the line end, where it reads as uneven padding. Center the lines in such a box, or keep pretty wrapping. A box sized by the layout, such as a card in a grid, has no such edge.

Compare fixed content at the real font and measure. Algorithms vary by engine and script, and both values are enhancements over ordinary wrapping; do not promise identical breaks. Test real strings, narrow widths and longer translations.

`overflow-wrap: anywhere` and `break-word` both break an unbreakable word that would overflow, but `anywhere` also treats every character as a break opportunity in min-content sizing. A label in a column sized to its content, such as an auto grid track or a flexible stub, can then wrap one letter at a time. Use `break-word` for short labels that may sit in such a column, and keep `anywhere` for long identifiers in fixed-width prose.

## Numbers

Use tabular figures for changing values and aligned numeric columns when supported by the font. Confirm widths actually become equal; keep prose figures proportional where appropriate.

Tabular advances do not necessarily neutralize numeric kerning. If real strings still drift, measure the punctuation and pairs; consider disabling kerning only on that numeric run, then recheck the actual font. Do not disable kerning across ordinary text.

Rendering choices can also affect final advances after kerning is disabled. When actual equal-precision values still drift, compare `text-rendering: geometricPrecision` locally on the numeric run and remeasure both themes and target engines. It resolved a native discrepancy in the Geist specimen; it is not a global font-smoothing rule or a guarantee for another font. If the project's rendering still cannot keep the required alignment, position the integer and fractional parts explicitly.

Equal digit width does not reserve space for more digits. Reserve expected value width or a stable grid column; include signs, grouping characters and units in the maximum-format check.

End alignment plus equal precision aligns decimal points. Mixed precision requires separate integer/decimal positioning or another explicit mechanism. Independent currency/unit columns can keep a stable gap. Use project locale formatting rather than assuming English punctuation.

## Letters and icons

Line boxes include space beyond visible glyphs. Inspect cap height, baseline, descenders and adjacent icons. `text-box: trim-both cap alphabetic` can help a particular Latin label with a normal line-box fallback; it is not a universal CJK or mixed-script centering recipe.

For Canvas measurements, glyph left is origin minus `actualBoundingBoxLeft`; visible width is `actualBoundingBoxLeft + actualBoundingBoxRight`. `measureText().width` is advance width. Derive the DOM baseline rather than guessing offsets.

Inspect icons at final size: stroke, caps, joins and internal space. A stroke on a 24-unit SVG scales at 16px unless compensated. Fix internal drawing before offsetting every wrapper. Optical nudges and icon-side padding corrections belong to the specific pairing.

Compare tracking with the same font, case, size and weight. Small uppercase labels, body text and other scripts need different spacing judgments. Font smoothing is not a platform-independent refinement.

## CJK and mixed scripts

Declare the real content language and region, including local changes inside a passage. Traditional/Simplified Chinese, Japanese and Korean need their own appropriate glyphs and fallback order. Keep the project's fonts; do not replace its brand face with a specimen's Noto family. Inspect the actual loaded glyphs, since one computed family can conceal fallback.

Font size measures a frame, not the visible character face. Compare actual Han, kana, Hangul, Latin letters, digits and punctuation at their intended size and weight. Check line height and neighboring icons together. A Latin cap/alphabetic trim can misrepresent CJK and mixed labels; ideographic edges also depend on the font and engine. Use supported text-box trimming as local enhancement, retain a normal fallback, and inspect marks, descenders and mixed strings. A syntax support query does not prove the result.

Distinguish tracking, inter-script spacing and punctuation-space reduction. `text-autospace: normal` can insert space between adjoining Han/kana and Western letters or numerals without editing the text; existing literal spaces and language conventions still need review. Do not strip content spaces globally or assume Hangul uses the same transitions. `text-spacing-trim` handles CJK punctuation's internal space, not vertical text-box trimming. Apply each mechanism separately and verify the exact value's support. Do not approximate either with global negative tracking or unconditional proportional-punctuation features.

Review literal-format runs such as commands, code, keyboard tokens and samples separately from reading text. Scope inherited spacing/trim enhancements when their painted spacing would misrepresent the literal form, and verify copied text against the original source, including significant whitespace. A visual improvement is not permission to normalize that source.

Keep opening/closing punctuation and long translations in the test strings. Chinese and Japanese commonly wrap between characters subject to punctuation restrictions; inspect locale-appropriate `line-break` settings. Korean can use syllable or word-based wrapping: `word-break: keep-all` is a choice, not a CJK-wide default. Plan for a genuinely long unbreakable name or identifier in a narrow container. Avoid global `break-all`, fixed manual breaks that fail after translation, or copying Latin uppercase tracking into every script.

Check body line spacing, short labels and multi-line headings separately. Compare the same text, font and measure when judging a wrapping rule. Balanced/pretty wrapping cannot guarantee matching results across engines. Recheck real fonts at 200% text size, and preserve readable normal layout when optional CSS is unavailable.

## Inline objects and line boxes

An inline image, icon, badge, code run, superscript or control can change the line's ascent/descent. `vertical-align` applies to inline-level boxes and table cells; flex/grid items use their alignment model instead. `middle` uses the surrounding font's baseline and x-height, not the containing block's geometric center.

A flex or grid box exports the baseline of its first item that has one. A leading icon, a decorative pseudo-element or a replaced element usually has no text baseline, so a box such as an arrow followed by a percentage can export the icon's bottom edge. In a baseline-aligned row, the percentage then sits above its neighbor's baseline. Align the box's own items on the baseline and center the mark separately. Then measure the visible text baselines in the row; the boxes' alignment alone does not prove the result.

Inspect native control padding, border and line-height before compensating. An inline image's baseline can leave descender space; make it block-level inside a dedicated media slot when it is not part of a sentence. Keep genuine inline content inline and test the actual baseline. Font-relative margins can locally reduce an atomic inline's contribution, but the surrounding line box still sets constraints. Do not promise that subtracting two margins produces exactly the text line height in every engine. Translation and relative offsets move the drawing without removing its original contribution. See [mixed-content rows](layout.md#mixed-content-rows) for layout footprints and available space.

## Compare metrics with the actual words

A line box is not the visible glyph bounds. Compare text, an icon and an adjacent control using the actual font and supported scripts, then decide whether the shared alignment should follow the baseline, visual center or container edge. A correction for one glyph must not shift every unrelated icon.

Test numerals with the same signs, precision and units in both samples. Tabular figures stabilize digit widths, while decimal alignment depends on precision and column structure. A changing label needs reserved space or flexible layout; clipping the longer state is not stability.

Inspect fallback loading and mixed-script punctuation at native size. Keep copied code and identifiers exact, and retain a route to full content when truncation is necessary. See [localization](foundations/localization.md) and [typography foundations](foundations/typography.md).

## Correct a specific optical imbalance

First select the reference: baseline for a sentence, a shared edge for a column, or visible center for a compact symbol. Establish geometric alignment, inspect actual ink, compare a small local correction, then recheck other labels and states. A play triangle may need a horizontal adjustment; a balanced symbol or a pre-normalized triangle may not. Latin descenders, CJK glyphs and different fonts prevent a universal upward text shift.

For an icon-label pair, distinguish the asset viewport, its visible drawing, the icon-to-label gap and the outer padding. Prefer the icon family's existing normalization. An asset with extra internal space may justify smaller padding on its side, such as 12 versus 16 in one specimen. A normalized asset may need equal padding. Use logical sides for leading/trailing icons and inspect RTL rather than globally applying a negative margin.

Keep the wrapper and hit target stable when nudging only the drawing. Compare native size with guides hidden as well as shown. Measured bounds establish position; choosing the more balanced result remains a contextual visual judgment.
