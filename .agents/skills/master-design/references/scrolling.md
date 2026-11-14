# Scrolling and overflow craft

Define which region scrolls and why. A page, a long table and a modal body may each need different behavior, but people must be able to reach all content and controls without guessing which surface owns movement.

## Choose the scroll owner

Prefer the document scroll for ordinary content. Use a local scroll region when preserving adjacent context materially helps, such as a wide comparison table or a long overlay. Give important independently scrollable regions a meaningful name and keyboard access where native behavior does not already provide it.

Avoid several small vertical scroll panes when a single flowing page would do. An apparent clipped panel needs a discoverable continuation; fading the edge must not hide the last row or its action.

## Keep destinations visible

Sticky headers and action bars occupy space over content. Account for them when scrolling to headings, errors or focused controls. Use appropriate scroll offsets and inspect the actual result at zoom; a hard-coded header height may be wrong after text wraps.

Keep focus indicators inside a visible painted region. An element can be technically scrolled into view while its ring is clipped or its label is covered. Test both forward and backward navigation at the first and last items.

## Handle two dimensions deliberately

A table may require horizontal scrolling to retain comparison. Keep that scrolling local rather than widening the whole page. Label the region and retain useful headers. If columns are hidden, provide a way to access information needed for the decision.

Do not set global overflow hiding to conceal an overflowing layout. It can remove access to real content. Investigate minimum sizes, unbreakable strings, transformed footprints and image dimensions instead.

## Restore context

Returning from a detail view should restore a useful position when the navigation model supports it. Reconcile restoration with loading: scrolling before the target content exists can land at the wrong place. A changed filter or a removed item may require a logical replacement rather than an obsolete pixel offset.

Allow people to interrupt programmatic movement. Reduced motion should remove unnecessary smooth travel while preserving the destination. Do not continuously override a person's scroll because an active-section tracker wants a different position.

## Verify

Follow a deep heading link, tab through a sticky layout, open a long dialog, inspect a wide table and return from a detail page. Repeat at narrow width, with 200% text and reduced motion. Check reachable last items, focus visibility and absence of accidental page-wide horizontal scrolling. See [responsive composition](patterns/responsive.md) and [focus](focus.md).

For unmounted records and growing feeds, explicitly address [find, print, focus and return context](patterns/large-collections.md).
