# Responsive composition

Adapt the composition to available space and input without changing the task's meaning. Responsive design is more than scaling a desktop screenshot down.

## Prioritize the content

Identify the primary task, essential context and secondary material. Collapse optional regions or move them to a useful disclosure before reducing text and targets. Preserve a coherent reading order in the DOM, not only in the visual arrangement.

Use content-driven breakpoints. A navigation row should change before labels collide; a two-column form should stack before fields become impractical. Device names alone do not establish when the content stops working.

## Let content grow

Allow headings, labels and messages to wrap. Use intrinsic sizes and minimums where practical. Account for long translations, user-generated names, enlarged text and an on-screen keyboard. A fixed-height card must have a clear reason and tested overflow behavior.

For a table that needs two-dimensional comparison, horizontal scrolling can be appropriate. Keep the scroll region and its contents understandable, and avoid making the whole page scroll sideways.

## Respect input and environment

Keep actions reachable without hover. Touch targets can grow independently from their glyphs. Preserve focus indicators at overflow boundaries and account for sticky bars and safe areas. Test both themes and forced colors rather than treating responsive work as geometry alone.

## Acceptance scenario

Complete the primary task at 320 CSS pixels, a representative tablet width and a wide desktop width. Repeat with 200% text, long content, keyboard and touch. Check no loss of content or functionality, meaningful source order and nonoverlapping targets. See [sizing](../foundations/sizing.md) and [spacing](../foundations/spacing.md).
