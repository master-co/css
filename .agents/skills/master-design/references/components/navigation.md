# Navigation

Navigation tells people where they are, where they can go and how to return. Choose a pattern that matches the content structure instead of treating every horizontal row as tabs or every popup as a menu.

## Match structure to purpose

Use ordinary links for page destinations, breadcrumbs for a meaningful hierarchy and tabs for closely related panels within one context. A sidebar supports a persistent set of destinations. A menu presents actions with a specific keyboard model; a simple list of links need not become an ARIA menu.

Keep the current destination visible through more than color and expose it with the appropriate current-state semantics. Distinguish current page from a merely expanded group. Expanding a group should not unexpectedly navigate or steal focus from its separate destination link.

## Preserve orientation

Use stable labels and ordering. After navigation, update the document title and place keyboard focus or a meaningful announcement according to the routing model. A client transition must not leave a reader interacting with stale content.

In a long document, a contents rail may track the current section without repeatedly overriding the person's expansion choices. Heading links should lead to a visible, unobscured target and retain a meaningful URL fragment.

## Adapt the shell

On narrow screens, keep navigation reachable with a named control. A modal navigation sheet needs a visible close action, correct focus management and Escape handling. Preserve access to all destinations through the compact structure; hiding the desktop sidebar is not sufficient.

## Verify

Test direct URLs, back/forward, hash links, keyboard entry, focus after navigation and mobile menu exit. Ensure current indicators match the real URL. See [navigation flows](../patterns/navigation.md). Master UI implementations include [Tabs](https://ui.master.co/components/tabs), [Breadcrumb](https://ui.master.co/components/breadcrumb) and [Menu](https://ui.master.co/components/menu).
