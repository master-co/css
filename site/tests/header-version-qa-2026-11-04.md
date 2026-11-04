# Homepage version visibility baseline — 2026-11-04

The existing, intentional change in `9567e1158` hides the version selector on
the English and Traditional Chinese homepages. This review adopts that behavior
in the exact CSS contract and route budgets; it does not change the page, shared
header API, compiler, tokens, publication state or deployment.

The delivered CSS differs from the recorded contract by exactly one segment:

```css
.home-header .ui-version{display:none}
```

It is inside the existing `components` layer and adds **38 raw bytes** to each
homepage's CSS delivery. Only `/` and `/tw` change contract. All other **153
routes**, the normalized project manifest, hydration metadata and resource order
remain byte-for-byte equal. There are no removed CSS segments or unrelated
snapshot changes. The pre-existing `transitionAtTop` removal in the working tree
is retained; this review does not revert or reimplement it.

## Exact budget attribution

The rule occurs once in the homepage asset
`site-style-4d4882a5aa0ca67eb8dc.css`. With the existing audit's Node default gzip
and Brotli settings, that asset changes from 261,803 to 261,841 raw bytes,
42,374 to 42,392 gzip bytes, and 31,957 to 32,001 Brotli bytes. Removing only the
rule from an in-memory copy reproduces the old route ceilings exactly; the
source and built output were not changed for this measurement.

| Routes | gzip before → after | Brotli before → after | Files / depth | Inline CSS |
| --- | ---: | ---: | --- | ---: |
| `/`, `/tw` | 63,126 → 63,144 (+18) | 49,510 → 49,554 (+44) | 10 / 1, unchanged | 13,266, unchanged |

Only these four compression ceilings are updated. The increase is the reviewed
cost of hiding the homepage version selector, not unexplained growth or a
general budget allowance. Other route budgets remain unchanged.

## Verification

- Exact segment/route comparison confirms the single-rule difference and
  unchanged manifest, hydration metadata and other 153 routes.
- All 155 routes and 44 external CSS assets pass the style-delivery gate with
  the two reviewed ceilings; file counts, import depth, layer order and inline
  bytes are unchanged.
- Chromium and WebKit verify the homepage version selector computes to
  `display: none` on `/` and `/tw` at 390px and 1280px in both themes. Four
  additional desktop Guide checks verify its version selector remains visible:
  **20 checks pass** in total.
- The local static server does not map every clean URL to its `.html` artifact.
  Browser verification therefore requests the generated files explicitly and
  verifies HTTP 200 before checking their content. This is local output QA, not
  production routing or deployment evidence.

Local evidence: `/tmp/master-css-473-contract-current.json`,
`/tmp/master-css-473-header-cost.json`, `/tmp/master-css-473-header-qa.json`, and
`/tmp/master-css-473-style-current.json`. No publication or deployment occurred.
