# Reference API index removal site CSS review

The reviewed build is `chore/remove-api-index` on `main` at `5d3d3a567`, with
`@master/internal-site` 0.3.0 and `@master/ui` unchanged. `ReferenceBody.astro`
no longer imports `DocumentAPIIndex`, so the Reference routes stop importing
`@master/internal-site/styles/system/index.ts` and, through it,
`@master/ui/components/card.css`.

## Exact contract and intentional change

The previous snapshot SHA256 is
`2a3148255da55087ef7c5e27a2eb34af1b7f8a698ea78bb816624184bde09532`
(approved by `css-contract-qa-2026-11-17-sublayers.md`): 389 routes, 58
contracts and 512 exact segments. The new snapshot records 389 routes, 58
contracts and 511 segments. No route was added or removed, and the project
manifest, semantic and public baselines are equal.

Three segments left and two took their place:

| Segment | Change |
| --- | --- |
| `fad887ca7dc12c71` → `ffd36cf65d080256` | The six `.ui-index` rules at the head of the Reference stylesheet are gone. Every following rule, from `.ref-table table` to the end, is byte-identical. |
| `6832bc5ca8e78487` | The Master UI card stylesheet is no longer delivered. It reached the 160 Reference routes only through the index import. |
| `cac33c7bb99665ac` → `74c50711590f99c2` | The theme entry stops emitting `--color-line-image`, which only the card used. No other declaration changed. |

All 389 routes record a new contract because they share the theme entry.

## Rendered effect

None. No built page contains a `.ui-index` or `.card` element: the last table
with the linked-identifier shape that selected the API index left the package
Reference, and `home-bento-card-*` on the homepage are the site's own classes.
