# A data workspace

Review collection controls, row identity, editing and bulk recovery together. A dense interface can support expert work while keeping scope and consequences explicit.

## Establish the collection

Use stable record identities and derive counts from the same records as the display. Give sorting a visible and programmatic state. Keep a record's destination separate from its selection checkbox and secondary actions.

State whether selection covers visible results or a wider collection. In a specimen that clears selection when criteria change, explain that behavior near the controls and announce the reset. Another product may preserve it with an explicit hidden-selection count; neither choice is a universal rule.

## Edit and operate

Keep a draft separate from the confirmed record. Save updates the identified record; Cancel discards only the uncommitted draft. If saving can overlap later edits, associate acknowledgements with their submitted version.

For bulk work, show per-item outcomes and retry only failed items. Completed items must not be processed again. A reversible archive can offer undo through a durable action in the task region. A real destructive operation needs its own consequence and recovery policy.

## Acceptance walkthrough

1. Search and sort, select a subset, then change criteria. Verify the documented selection behavior and count.
2. Edit a record, cancel and confirm the original remains. Edit again and save; check identity after sorting.
3. Select several records and simulate one failed archive. Confirm the successful and failed sets are distinct.
4. Retry only failures, then undo the reversible batch. Confirm restored records and counts agree.
5. Complete the flow by keyboard and touch at narrow width. Check mixed selection, focus when rows disappear, long names and durable feedback.

See [collections](../patterns/collections.md), [editing](../patterns/editing.md), [data display](../components/data-display.md) and [recovery](../patterns/recovery.md). A teaching workspace uses local fixtures; it does not claim remote persistence.

## A larger collection

Use a separate 24-record collection to check page/append scope, partial loading failure, optional summary failure and removal from the last page. The original four-record workspace remains available above. See [large collections](../patterns/large-collections.md).
