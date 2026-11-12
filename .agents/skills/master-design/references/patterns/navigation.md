# Navigation flows

Design navigation around a stable content structure. The same destination should keep its name and meaning across the header, sidebar, compact menu and breadcrumbs.

## Give each layer a purpose

Primary navigation connects major areas. Local navigation connects pages within one area. A table of contents moves within the current document. Keep these layers distinguishable rather than repeating the same destinations everywhere.

Use progressive disclosure for a large hierarchy, but preserve a visible route to the current page. A person's expanded groups should not repeatedly reset as they scroll. If a destination is unavailable, explain it or omit it from the published navigation; do not ship a working-looking dead end.

## Support real URLs

Every published page should work when loaded directly. Retain meaningful titles, canonical URLs and anchors. When a page moves, redirect to its relevant replacement, not automatically to a broad homepage. Preserve browser back and forward behavior.

Client-side transitions should update focus and document context deliberately. A visual fade cannot replace correct navigation history or a useful reading position.

## Adapt navigation

A narrow layout can replace a persistent sidebar with a disclosure or sheet, but must retain its destinations. Keep a named trigger, visible close control and logical focus return. The contents of the current page should remain readable before enhancement loads.

## Acceptance scenario

Open a deep link, follow an in-page anchor, navigate to a sibling page, return with Back and repeat on a narrow screen. Use only the keyboard for the compact menu. Verify the current indicator, heading target, page title and reachable destinations. See [navigation components](../components/navigation.md).
