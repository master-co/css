# Master UI 0.0.11 and shared site 0.2.18 site CSS review

The reviewed build is `main` at `b0ee0a605` with `@master/ui` raised from 0.0.5
to 0.0.11 and `@master/internal-site` from 0.2.16 to 0.2.18. The base build at
the same revision verifies against the previous snapshot.

## Exact contract and intentional change

The previous snapshot SHA256 is
`157233c7c4a6999b3ba5912640932edc6d5cc8444cb5cf7397aa3d6a6a9b248e`
(approved by `css-contract-qa-2026-11-17.md`): 389 routes, 58 contracts and
2,212 exact segments. The new snapshot records 389 routes, 58 contracts and 512
segments. No route or contract was added or removed, and the project manifest,
semantic and public baselines are equal.

All 389 routes change, and their delivered CSS grows from 50,904,147 to
57,796,759 bytes in total:

- Master UI keeps every component rule in `@layer components.ui` since 0.0.11,
  and its six releases since 0.0.5 changed and added component rules.
- Shared site 0.2.18 keeps its rules in `@layer components.site` and declares
  `@layer components.ui, components.site;` in the document head.
- This site's 34 `@layer components` blocks move to `@layer components.site`
  too. Its home page and Reference styles are written against the shared
  site's selectors, by specificity and order; in a layer of their own they
  would win over the shared site's contextual rules (the hero's pill command,
  the Chinese heading tracking, a Reference cell's alignment).

Whole layer blocks now carry different names and contents, so the segments do
not pair up between the two snapshots; the review compares rendering instead.

## Rendering

Every element's computed style, custom properties excluded, was compared
between the base and the reviewed build in Chromium: 29 English routes with
`/tw` at 1280 px, 14 at 600 px, and rest, hover and keyboard-focus styles of
the first forty interactive elements on seven routes.

The only differences are Master UI's own since 0.0.5: a button and an
accordion trigger distribute their height through padding instead of a minimum
height, an alert's rows stand 16px apart instead of 10px, and a sheet declares
`min-width: 0`. No box changes size at 1280 px; the alert's gap changes the
height of five boxes on one route at 600 px.
