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
