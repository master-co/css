# Typography and visible weight

Preserve the project's typefaces and hierarchy. Wait for the actual font. A computed family name alone does not prove the intended face supplied the glyphs.

## Wrapping

Use balanced wrapping where a short heading benefits from more even lines. Pretty wrapping can improve an isolated last line in prose. Compare fixed content and measure. Algorithms vary by engine and script; do not promise identical breaks or globally balance paragraphs. Test real strings, narrow widths and longer translations.

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

Inspect native control padding, border and line-height before compensating. An inline image's baseline can leave descender space; make it block-level inside a dedicated media slot when it is not part of a sentence. Keep genuine inline content inline and test the actual baseline. Font-relative margins can locally reduce an atomic inline's contribution, but the surrounding line box still sets constraints. Do not promise that subtracting two margins produces exactly the text line height in every engine. Translation and relative offsets move the drawing without removing its original contribution. See [mixed-content rows](layout.md#mixed-content-rows) for layout footprints and available space.
