# Collections and bulk actions

Keep the displayed records, applied criteria, selected items and action scope understandable together. A bulk operation is safe to understand only when people can tell which objects it will affect.

## Define selection scope

State whether Select all means visible rows, the current page or every matching result. If selection extends beyond the visible page, show its count and provide a way to review or clear it. A header checkbox should reflect the scope it controls, including a mixed state when only some items are selected.

Choose deliberately whether filtering preserves selection. Clearing it can be appropriate for a small task; retaining it can support cross-page work. Either behavior needs visible feedback. Never silently apply a destructive operation to hidden selections the person cannot account for.

## Keep navigation and actions separate

Use a link for a record's destination and separate controls for selection or row actions. Do not nest controls inside a link or make pointer-only row activation the only route. Keep actions discoverable with touch and keyboard.

Sorting changes visual order, not object identity. Use stable item identifiers so a pending edit or selection does not move to a different record after sorting. Return focus to a logical remaining item if its previous target is removed.

## Represent partial outcomes

| Outcome | What remains available |
| --- | --- |
| All complete | Result count and any supported undo |
| Some fail | Per-item result and retry scoped to failures |
| Cancelled partway | Completed items distinguished from untouched items |
| Result unknown | A status check before repeating consequential work |

Keep a durable record of failed items long enough to recover. Do not replace a partial failure with a generic success toast, and do not rerun completed destructive operations when retrying the rest.

## Acceptance scenario

Select two rows, filter until one is hidden, inspect the selection scope and sort. Run a batch with one simulated failure, retry only that item and undo a reversible result. Check counts, stable identity, mixed checkbox state, focus and announcements. See [selection](../components/selection.md), [data display](../components/data-display.md) and [recovery](recovery.md).
