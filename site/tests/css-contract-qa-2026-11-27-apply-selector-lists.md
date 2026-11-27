# @apply on selector lists site CSS review

The reviewed build is branch `fix/apply-selector-lists` at `733fd3b9c`, built
in a clean worktree after `bun install --frozen-lockfile`. The same worktree at
`main` (`6ddc2ad78`) verified the previous snapshot exactly, so every change
below comes from the branch.

## Exact contract and change

The previous snapshot SHA256 is
`9a94dfd332198dea60d15ecaf0091dc7ccf2bfc8052a48a22aeca92bd504d4d0`
(approved by `css-contract-qa-2026-11-25-ui-2.2.1.md`): 389 routes, 58
contracts and 520 exact segments. The new snapshot records the same routes,
contracts and segment count. The project manifest, semantic and public
baselines are equal.

One segment changed: the shared site header, `b9f8bd1dbffa0a52` →
`0734f58e1e95ff37` (11095 → 11013 bytes), delivered by 385 routes. The cause
is `98f2e12f2` Fix(Compiler): a native rule with a selector list that applies
a mixin no longer puts the list in `:is()`. The header's mobile menu focus rule
applies the focus ring mixin, then sets its own offset and radius:

```css
/* Before */
:is(.ui-mobile-menu-link:focus-visible,.ui-mobile-menu-community>a:focus-visible){outline:2px solid var(--color-focus);outline-offset:2px}
.ui-mobile-menu-link:focus-visible,.ui-mobile-menu-community>a:focus-visible{outline-offset:5px;border-radius:var(--ui-radius-sm)}

/* After */
.ui-mobile-menu-link:focus-visible,.ui-mobile-menu-community>a:focus-visible{outline:2px solid var(--color-focus);outline-offset:2px;outline-offset:5px;border-radius:var(--ui-radius-sm)}
```

No other rule of the 520 segments changed, and the declarations keep their
authored order.

## Rendering

`:is()` gave both branches the highest specificity of its list, (0,2,1). The
mixin's `outline-offset:2px` therefore outranked the authored `outline-offset:5px`
of `.ui-mobile-menu-link:focus-visible`, which is (0,2,0) in the plain list.
The mobile menu links now show the 5px focus offset the stylesheet asks for,
as the community links already did. No other rule in the site output sets
`outline`, `outline-offset` or `border-radius` on these elements, so nothing
else renders differently.
