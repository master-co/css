# Data display

Choose a presentation that supports the question people ask of the data. A table helps compare shared attributes; a list supports scanning distinct items; a chart shows a relationship that should remain understandable without color alone.

## Give structure meaning

Use a real table for tabular data, with appropriate headers and a useful caption or nearby title. An interactive grid has a different keyboard model and should be chosen only when the task requires it. Do not give an ordinary table grid semantics to make rows appear interactive.

Align numeric columns consistently and use tabular figures when equal-width digits improve comparison. Explain units, date formats and missing values. A blank cell, zero and unavailable value are different facts.

## Keep actions discoverable

Separate a row's destination from its secondary actions. Avoid nesting interactive controls or making the entire row a disguised button with unreachable children. Keep row actions available on touch and keyboard, even when pointer interfaces reveal them on hover.

Show sorting state on the relevant heading and communicate the resulting order. Pagination and filtering should preserve a clear count and context. Bulk selection must explain its scope.

## Adapt dense content

On narrow screens, prioritize necessary columns, allow deliberate horizontal scrolling where comparison requires it, or offer a coherent list alternative. Do not silently remove data essential to the decision. Keep table headings and scroll affordances clear.

For charts, provide a textual summary and an accessible way to inspect important values. Color differences should have labels, shape or pattern support.

## Verify

Test long names, large numbers, missing data, empty results, sorting, focus and narrow layouts. Check actual number alignment in the loaded font. Master UI includes [Table](https://ui.master.co/components/table), [List](https://ui.master.co/components/list) and [Avatar](https://ui.master.co/components/avatar); application data semantics remain the consumer's responsibility.
