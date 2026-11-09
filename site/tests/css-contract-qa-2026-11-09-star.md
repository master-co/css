# Star invitation CSS baseline review

The reviewed build is local `main` after `09a6d7744` with the homepage's closing
call to action gaining a "Star us on GitHub" link (`CTASection.astro`,
`content/components/cta.css`). It approves the CSS that link adds.

## Exact contract and intentional change

The previous snapshot SHA256 is
`f88e52c73207fc76907da9036757a30c42479fe8e5923c7d0ff1db7c8902e855`
(approved by `css-contract-qa-2026-11-09-film.md`): 389 routes, 54 contracts and
2,185 segments. The new snapshot records 389 routes, 54 contracts and 2,186
segments. No route was added or removed; the project manifest, semantic and
public baselines are equal.

Five routes change: `/` in each of the five locales. Each gains one 491-byte
segment, `ffffe679bd722e9b`: the `.home-cta-star` rule with its `> svg`,
`:hover` and `:focus-visible` nesting. Delivered CSS for `/` grows from 258,133
to 258,624 bytes; hydration and class names are unchanged.

## Attribution

For each changed route, removing `ffffe679bd722e9b` from the new segment list
gives the old list exactly, in order. The other 384 routes and their contracts
are unchanged. No existing selector, declaration or value changes.
`bun run --filter site build` passes the style-delivery budget (389 routes,
46 CSS assets audited) and public asset verification.
