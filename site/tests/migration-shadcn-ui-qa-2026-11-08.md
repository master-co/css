# shadcn/ui migration guide CSS review

The reviewed build is `main` at `7012340fd` plus this change: a new
`/guide/migration/shadcn-ui` guide in five locales, the Tailwind CSS guide's
coexistence update, and the `cn` default class helper. `@master/internal-site`
is the installed 0.2.5 package.

## CSS contract

The previous snapshot SHA256 is
`8d0ae7d9753a1684570d5a4cbcaa8d4188656f4136623e9e792073edb4ecd23d`: 384 routes,
52 contracts and 2,260 exact segments. The new snapshot records 389 routes,
53 contracts and 2,260 segments. No segment is added, removed or changed, and no
existing route changes its contract.

The five added routes, `/guide/migration/shadcn-ui` and its `tw`, `ja`, `ko` and
`cn` editions, share one new contract. It is the other migration guides'
contract without five segments: `.block`, `.w-full`, `.h-full`, `.max-w-full`
and `.max-h-full`. Those classes belong to the article header's brand icon,
which this page does not render because the shared brand registry has no
shadcn/ui mark yet. The migration catalog shows a local mark instead.

## Style delivery budget

All five routes load the same 20 stylesheets as the other migration guides, at
depth 1: 30,176 gzip bytes, 25,596 Brotli bytes and 1,940 inline CSS bytes. The
localized routes match the English route's assets and inline CSS exactly. The
budget entry reuses the other migration guides' ceilings (22 files, 32,339 gzip
bytes, 27,436 Brotli bytes, 2,055 inline bytes).
