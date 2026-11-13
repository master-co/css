# Overlays

Use an overlay when it keeps a task in context. Choose the least interruptive pattern that provides enough space and attention: a tooltip explains, a popover exposes nearby content, a menu offers actions and a modal dialog requires a focused decision.

## Choose modality deliberately

A modal is appropriate when the background task cannot meaningfully continue until the decision is resolved. It is not a default container for extra details. Use native dialog and popover behavior where their semantics and browser support fit the task.

Give dialogs a clear title and a visible way to close or cancel when allowed. Keep destructive confirmation copy specific about the affected object and consequence. Avoid a vague “Are you sure?” that makes people reconstruct the action.

## Manage focus and exit

Move focus into a modal to a useful initial location, keep background interaction unavailable and restore focus when it closes. Escape should follow the pattern's expected behavior. If dismissal would discard important work, explain the consequence and offer recovery rather than silently destroying it.

A nonmodal popup should not trap focus. A tooltip must appear for keyboard focus as well as pointer hover and must not contain essential controls that cannot be reached. Keep the trigger's accessible name independent from the tooltip.

## Place and constrain

Keep the surface within the viewport, allow long content to scroll and keep essential actions reachable. Account for zoom, software keyboard and safe areas. Use top-layer capabilities and fallback behavior deliberately; a large z-index does not solve clipping or modality.

## Compare interruption levels

| Need | Pattern | Input consequence |
| --- | --- | --- |
| Brief supplementary explanation | Tooltip | Trigger remains the interaction; no essential controls inside |
| Nearby optional content | Nonmodal popover or disclosure | Background remains usable; no modal focus trap |
| A set of commands | Menu | Expected menu keyboard model and dismissal |
| A decision that blocks continuation | Modal dialog | Focus enters; background is unavailable; exit is explicit |

An overlay's appearance does not decide modality. A small modal can interrupt more than a large nonmodal panel. Prefer in-page content when it benefits from reading, linking or repeated comparison. If a second overlay is necessary, define which closes first and where focus returns at each step.

## Verify

Test open-close-open, Escape, outside interaction, focus return, nested surfaces and narrow screens. Confirm required information remains available without hover. Master UI implementations: [Dialog](https://ui.master.co/components/dialog), [Popover](https://ui.master.co/components/popover), [Menu](https://ui.master.co/components/menu) and [Tooltip](https://ui.master.co/components/tooltip).
