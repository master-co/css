# Help and support

Make help available where uncertainty occurs and keep it connected to the task. Better labels and instructions often remove the need for a separate help surface.

## Choose the level

Use nearby instructions for necessary constraints, a disclosure for optional explanation, and a dedicated page for longer procedures. A tooltip can clarify a short term but cannot be the only source of essential guidance or contain unreachable controls.

Use the same names in help and the interface. Link to the relevant section rather than a broad documentation homepage. Explain prerequisites before steps and show the expected result so people can tell whether they succeeded.

## Preserve the task

Opening help should not discard a draft or hide the control being explained. If a side panel reduces the work area, test that both remain usable at narrow widths. Provide a clear route back and logical focus return when help closes.

Keep consistently placed help mechanisms in a consistent relative order across repeated pages. The [WCAG consistent-help criterion](https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html) describes its applicable scope; it does not require every interface to add a support widget.

## Escalate usefully

When self-service cannot resolve a problem, provide a real support route with relevant context. Make diagnostic identifiers copyable, but keep sensitive information out of automatically shared details. State what the support route can actually do and when a response can be expected if that information is known.

Avoid circular recovery: an access error should not link only to a help page requiring the same inaccessible account. Service-unavailable help needs an alternative that remains reachable under that condition.

## Acceptance scenario

Encounter an unfamiliar field, open relevant help, return without losing input, then follow the escalation route for a simulated service problem. Check keyboard access, focus return, narrow layouts and a useful path when authentication is unavailable. See [content design](../foundations/content.md), [overlays](../components/overlays.md) and [access](access.md).
