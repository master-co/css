# Search and filtering

Keep the query, applied criteria and result state connected. People should understand what they are looking at and how to broaden or refine it.

## Make criteria visible

Use a clear search label and a useful example only when the search scope is unfamiliar. Show active filters even when the options panel is collapsed. Provide specific removal actions and a clear way to reset the criteria without erasing unrelated work.

Choose immediate filtering for responsive local data. For expensive or remote searches, use an explicit submit or a restrained delay with stale-response handling. Do not let an older response replace a newer query's results.

## Preserve context

Keep the query after a failed request. Distinguish no matches from no data and from loading. Offer a practical next step: remove a restrictive filter, revise the phrase or retry the request. Show a result count when it is reliable; do not invent totals for partial data.

When users navigate to a result and return, retain the search state and useful scroll position where the routing model supports it. Put shareable criteria in the URL when sharing or bookmarking the result is part of the task.

## Respect input

Do not submit an unfinished composition during IME input. Keep focus in the search field during ordinary updates. A suggestions popup needs a complete combobox behavior; a list of results below a search form usually does not.

## Acceptance scenario

Search with mixed-script text, combine two filters, remove one, receive no matches, simulate failure and retry. Check browser back, keyboard access, result announcements and narrow layouts. See [selection](../components/selection.md), [data display](../components/data-display.md) and [asynchronous work](async.md).
