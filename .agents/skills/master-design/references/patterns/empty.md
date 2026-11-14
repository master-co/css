# Empty and unavailable states

An empty region is an explanation of the current context. No records, no matching results, unavailable access and failed loading are different facts and need different next actions.

## Diagnose before drawing

| State | Explain | Useful next action |
| --- | --- | --- |
| First use | No content has been created yet | Create or import, with a short explanation |
| No matches | Current criteria exclude the available content | Change or clear criteria |
| No permission | Content is not available to this identity | Request access or change context |
| Failed loading | The result could not be obtained | Retry while preserving criteria |
| Offline with cached data | Displayed content may be stale | Explain freshness and supported work |
| Completed collection | Nothing remains to do | Confirm completion or view history |

Do not show No results while a request is still pending. A familiar illustration can support tone, but must not displace the explanation or recovery action.

## Preserve useful structure

Keep the region title, relevant filters and navigation. Remove controls that have no meaningful use in this state, or explain their unavailability. An empty table can retain column context when it helps explain what will appear, but should not display fake records as if they were real.

Reserve enough space to avoid a severe jump when content arrives, while allowing long messages to wrap. Never use a fixed empty-state height that hides its action at zoom or narrow widths.

## Recover in place

Keep query and filter values after a failure. Clearing filters should affect only the criteria, not unrelated edits. A new content action should return to the collection with the result recognizable; avoid an empty page that requires a manual refresh after successful creation.

## Acceptance scenario

Visit a fresh collection, create one item, filter it out, simulate a failed reload and remove permission. Confirm each state has truthful wording and the appropriate action. Check keyboard focus, status announcements and readable fallback without illustrations. See [search](search.md), [onboarding](onboarding.md) and [content design](../foundations/content.md).

A failed optional panel can coexist with useful primary work. Keep [failure scoped to that region](async.md#limit-failure-to-its-actual-scope), rather than declaring the entire task empty.
