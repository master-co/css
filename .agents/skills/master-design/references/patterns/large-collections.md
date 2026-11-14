# Large collections

Choose how records arrive and how people return to them. Selection, loading and URL state must describe the same collection. Adding virtualization for speed does not create feed or grid semantics.

## Choose a retrieval model

| Model | Useful when | Cost to resolve |
| --- | --- | --- |
| Pagination | People need bounded sets, positions or direct return | Stable URL/page state and useful last-page recovery |
| Explicit load more | People scan progressively while retaining earlier records | Retry without duplicates and a reachable end |
| Continuous feed | Continuous discovery is the task | Footer reach, interruptions, focus and position restoration |
| Virtualization | Measured rendering cost warrants unmounting records | Browser find, printing, focus and assistive-technology access |

A small list may need none of these. Provide a finite alternative or export when unmounted records must be searched/printed as a whole. APG's [feed pattern](https://www.w3.org/WAI/ARIA/apg/patterns/feed/) is an interaction contract, not a generic infinite-scroll decoration.

## Preserve scope and context

Keep query, filters, sort, page/cursor and selected identities connected. Show whether totals are known, estimated or unavailable. “Select all” names current-page or whole-result scope. On return from a detail, restore a meaningful location and focus without silently reapplying an obsolete filter.

For pagination, reflect navigable state in a suitable URL and support Back/direct loading. For append, keep focus on the initiating action or use an explicit move-to-new-results operation; routine results must not steal focus. Announce a concise result count rather than rereading the whole list.

## Recover a failed chunk

Retain already loaded records when the next chunk fails. Retry the failed request without appending duplicate IDs. Keep a request's identity separate from a newer query or sort. Deleting the last record on a page needs a useful surviving page and focus destination; an empty last page is not proof that the collection is empty.

An optional summary can fail without blocking primary records. Label stale data and scope its retry; see [regional failure](async.md#limit-failure-to-its-actual-scope). A true permission loss may instead require stopping an affected operation.

## Acceptance scenario

Load a second chunk, fail it, retry, open a record and return with Back. Change a filter while waiting, remove a last-page item and check selected identities. Try keyboard, first touch, browser find and print. Record unavailable unmounted content explicitly instead of claiming that visually smooth scrolling proves complete access.
