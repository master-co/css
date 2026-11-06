# 2.0.1 site CSS baseline review

The reviewed build is `main` at `fc7936bdb` plus this change, with the exact
published `@master/internal-site@0.2.4` (a clean registry copy, not a locally
patched package). It approves the CSS baseline for the 2.0.1 patch release.
Public package delivery and Cloudflare verification remain separate release gates.

## Exact contract and intentional changes

The previous snapshot SHA256 is
`dec12bee3fe254adbc52e9dd4b9c84ffd04e625c7dfcb12dc592ee71826636e2`:
384 routes, 80 contracts and 2,293 exact segments. The new snapshot records
384 routes, 80 contracts and 2,282 segments. No route was added or removed; the
project manifest, semantic and public baselines are equal. 15 route contracts
change, all on pages edited by commits in this release:

- `/` in all five locales: the delivery workbench shows static, prerender and
  runtime (`9cb9d7c8f`). Progressive-only rules (`#home-delivery-progressive`,
  the deferred engine, the late-class add button and its caret/template states,
  `bg-amber-10`) are removed; the prerender switch, the `invisible[data-crowded]`
  and `invisible[data-lifted]` label states and the first-paint preview tokens
  are added. Timeline, template, footer and reduced-motion rules are rewritten
  for three modes.
- `/guide/code-linting` in all five locales: the pre-2.0 class section and its
  example are removed (`a9f52a972`), and the #495 `:class` example is added.
- `/guide/rendering-modes` in all five locales: the prerender section moves after
  static (`9cb9d7c8f`), changing the order of the example CSS it delivers.

31 segments are removed and 20 added; every changed selector belongs to
`.home-delivery*`, the delivery preview tokens or the edited guide examples.
