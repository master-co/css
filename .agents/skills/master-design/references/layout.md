# Layout and rhythm

Find shared alignment edges. A label, supporting copy and separator may share a text start while an icon occupies its own region. Establish this relationship before adding lines.

Space expresses grouping. Keep related items close and allow a larger interval between groups. Internal 8px / inter-group 24px is one example, not a universal scale. Preserve project density and tokens.

Inspect navigation pitch, control height, section gaps, headers and table rows together. Compact navigation and spacious content can coexist when each role has coherent rhythm. Equal gaps everywhere can obscure hierarchy.

Adapt narrow layouts where content stops fitting. Preserve reading order, labels, actionable targets and important values. Options include collapsed navigation, stacked independent panels and labeled table records. Avoid shrinking an entire desktop canvas or clipping required values.

Test real content and longer translations. Inspect min-width, wrapping, focus clipping and sticky controls covering content.

Clarify whether a summary covers the workspace or filtered rows. Put visible result counts near filtered content. Selection scope must remain understandable after filtering; avoid silent actions on invisible records.

## Mixed-content rows

Separate three bounds: the footprint used by layout, the painted content/contour, and the actionable target. Fonts, avatars, thumbnails, icons, badges, counts and native controls can each determine the row's size. A shadow or outline can paint outside without changing layout; padding, borders, intrinsic media size and control minimums can increase the footprint. Center alignment arranges boxes inside the row; it does not remove their size contribution.

Establish the row's role and density, choose appropriate component sizes, then inspect spacing and alignment before using a local margin adjustment. Preserve real image proportions and target sizes. A tall field may warrant a taller row; multiple lines of text may need top/first-line alignment rather than centering an avatar against the whole paragraph. Reflow if the content cannot fit.

Negative margins can compensate for padding or let an auxiliary element bleed into surrounding whitespace while retaining its border box. With an auto-sized horizontal flex row, a 36px control with -6px block margins can contribute 24px, while its actual target remains 36px high. This is a specimen, not a formula for every layout. Reserve enough unblocked surrounding space, and inspect neighboring targets, focus, hover, clipping and wrapped text. Translation or relative positioning alone moves the visible element but keeps its original layout contribution.

Vertical rhythm names the repeated spacing relationship; baseline alignment and optical alignment name different alignment decisions. Bleed describes controlled extension. “Negative-margin compensation” describes the implementation, not a single formal technique covering all these cases. Prefer logical margin/padding properties, and keep adjustments tied to the specific component pairing and density.

## Table actions and inline contents

Native table row heights accommodate their cells' content and alignment; a declared row height cannot force a larger control to shrink. For a 24px text line with 8px block padding, a 40px row can also hold a 36px control when its action cell has 2px block padding. Keep the control unchanged and adjust the action cell independently. Text may wrap and grow the row; fixed heights and negative margins on table rows/cells do not replace the table sizing model.

If a control needs a dedicated wrapper, let that wrapper provide alignment without changing the table cell's display semantics. Directly subtracting margins from an inline control can retain extra baseline/line-box space that differs by font and engine. See [inline objects](typography.md#inline-objects-and-line-boxes). Verify the actual rendered row rather than generalizing a flex measurement to a table or sentence.

Use [target and focus guidance](states.md) when extending actionable bounds. The compact visual specimen must not make adjacent targets overlap; grow touch rows when the target needs more room. At larger text sizes, allow rows and controls to grow instead of maintaining a fixed pixel silhouette.

## Reading controls

A short linked heading can keep its natural line height while an absolutely positioned anchor extends into reserved surrounding whitespace. Derive any extension from the actual line height, keep the anchor's minimum target size on the anchor itself, and let wrapped or enlarged text grow. Measure the clickable box in the target engines: fractional layout can round a calculated target just below its intended minimum. Check the neighboring paragraph, independent inline links and focus outline for obstruction.

For an arrow beside a wrapping result title, a separate icon column can retain a shared edge and first-line alignment. Keep the text column shrinkable and allow long strings to wrap. Compare this with an inline arrow using identical content; the separate column costs some text width, so it is a contextual choice rather than a default for every link.

## Grouping, explanation and hierarchy

A common region should express a relationship, not put a separate card around every field. Compare the same labels, values and positions before deciding whether a shared boundary clarifies the group. Give the group a real layout container with its own padding; an absolutely positioned decorative outline must still reserve and respect the space it paints. Let the outer surface grow with the contents. Equal card dimensions alone do not prove balanced inner spacing.

Keep an explanation near the object it explains. In forms, associate messages with their fields programmatically; local feedback can coexist with an overall error summary. For a controlled diagram, reserve the same message slots in both variants so moving a message does not also move the fields. In a real form, choose reserved space or natural flow according to its validation behavior, rather than retaining empty slots solely to match the diagram.

Give the current task a clear visual priority through typography, contrast and action emphasis. A primary action, current state and supplementary timestamp need not carry the same weight. Keep the content and placement fixed when comparing emphasis, and keep secondary information readable.

## Controls and progressive disclosure

Place a control near the scope it affects and name that scope. A per-row toggle can make its relationship clearer than a detached bank of toggles. A global action belongs with the whole group; do not duplicate it per row merely to achieve proximity. Preserve ordering, labels and states when comparing the two arrangements.

Disclose advanced or infrequent options on demand while keeping the primary task and necessary conditions visible. After collapse, retain a concise summary of consequential applied settings. Keep the disclosure trigger separate from links that navigate elsewhere. For a nested contents list, update the current section without repeatedly changing the reader's expansion choices or keyboard focus. For filters, keep applied criteria, removal actions and result status visible even when the option list is collapsed.

These are contextual design judgments, not measured improvements in task success. See [verification](evidence.md) for comparison controls and [state distinctions](states.md#multiple-state-cues) for concurrent state feedback.
