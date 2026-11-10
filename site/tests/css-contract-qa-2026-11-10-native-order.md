# Native declaration order site CSS review

The reviewed build is branch `worktree-fix-integration-audit` on `main` at
`c00fc5c02`. It approves one intentional CSS change; nothing else in the site
output moved.

## Exact contract and intentional change

The previous snapshot SHA256 is
`d267d72bf70db46271b672e5e2931aa5bfa687f8c7be51534922c288a233d5e3`
(approved by `css-contract-qa-2026-11-09-star.md`): 389 routes, 54 contracts
and 2,186 exact segments. The new snapshot records 389 routes, 54 contracts and
2,187 segments. No route or contract was added or removed; the project
manifest, semantic and public baselines are equal, and every contract keeps its
byte count (`/` stays at 258,624 bytes).

Seven routes change: `/`, `/tw`, `/ja`, `/ko`, `/cn`,
`/examples/article-transitions` and `/examples/view-transitions`. The cause is
`f63ca27c4` Fix(Compiler): native CSS in Master CSS stylesheets is no longer
passed through lightningcss `minify()` without browser targets, which merged
same-property declarations into the last one, dropping vendor pairs and
fallbacks such as `height:100vh;height:100dvh`. Without that pass, Vite's own
minifier keeps the authored declaration order.

## Attribution

One segment changed and one segment was split out:

- `.home-palette-inspector` (`site/content/components/design-system.css`):
  `inset-inline:1.5rem` moves from after `pointer-events` to the first
  declaration, its authored position.
- `.ui-expand[data-expanded=false]>.ui-expand-control` now has its own segment
  with `inset-inline:0` first, as authored.

Per route, joining the contract segments of both snapshots and sorting the
declarations inside each block (and dropping `@layer` statements) gives
identical CSS for all seven routes. In both blocks the moved `inset-inline`
does not overlap any other declaration of the block (`bottom`, `position`,
`background`, `padding-top`), so the cascade and rendering are unchanged.
