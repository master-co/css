# Public shared 0.2.1 tree icon height: CSS consumer delivery QA

This reviews the CSS delivery budget after consuming the actual published `@master/internal-site@0.2.1`. It does not certify a public Master CSS 2.0 release, hosted Cloudflare output, or a deployment.

The baseline is the frozen `/tmp/master-css-final-a9f4/reference-fixed-out` built from CSS `ae2b6ff79d63bfbff4aa479780a6a684731399de`, public version `2.0.0-rc.88`, commit ref `rc`, and public shared 0.2.0. Root recomputed its report with the unchanged shared auditor at `/tmp/master-css-shared021-integration/frozen-public020-style-delivery.json` and verified deep equality with the retained 384-route/47-asset report. It is a trusted output comparison, **not identical source** to the current build.

The current output is `site/out` at CSS HEAD `68ff72e947fa759ff5e096eb82f34fe96ce9389c` with the pending exact public shared 0.2.1 pin. Its build used `PUBLIC_VERSION=2.0.0`, `PUBLIC_URL=https://css.master.co`, `PUBLIC_COMMIT_REF=main`, and Cloudflare image rewriting disabled. Root completed all 384 HTML routes, postbuild and public asset checks; the old compressed ceilings then failed as expected. Shared 0.2.1's public tarball is byte-identical to its official owning-run archive and reviewed pack: SHA256 `ad2822e230774c72c31f4db8b499665b920ac2d1be9c3255032bdd94a0e509fc`, 755 files, Master publish run `41954232600`, attempt 1, source `6fcc9ac32a6dbbd3eeb98b34a29e15d4487e43b3`.

## Exact output difference

Of 47 CSS assets, 46 are byte-identical. The sole changed asset is:

| Asset | Raw bytes | gzip | Brotli | SHA256 |
| --- | ---: | ---: | ---: | --- |
| `prose.8hJGhFA8.css` | 6792 | 1765 | 1530 | `c29da245403738b9c25255ed45f14fee1eb7b771622161d7bf415f3498e33daf` |
| `prose.JhmmBK84.css` | 6804 | 1771 | 1536 | `bc4e4b3d364c31b76804f4dc4ed2c18ba785f426aea7e8adf61c54161b1fb1f0` |

Replacing this selector once in the old asset reproduces every byte of the new asset:

```diff
-.ui-prose :is(img, video):not(:where(.site-demo *, [data-demo-container] *))
+.ui-prose :is(img, video):not(:where(.site-demo *, [data-demo-container] *, .ui-tree *))
```

Its existing declaration remains `height: auto`. Tree images are now excluded so the existing `.ui-tree img { width: 14px; height: 14px; }` rule controls their height. There are no other declaration, selector, serialization, import, or layer changes in the delivered CSS. The prose filename changes with its content hash.

Across all 384 routes, ordered stylesheet links and asset lists are identical after substituting that one filename. Inline CSS bytes and SHA256, CSS graph depth/file count, style-family flags, exactly one foundation, and layer order `theme,base,defaults,components,utilities` are unchanged. No uncompiled directives appear. The 370 routes loading prose each grow by exactly 12 raw bytes, 6 gzip bytes and 6 Brotli bytes. The 14 homepage, 404 and standalone-example routes are unchanged. The auditor also enforces canonical/localized CSS and inline identity.

## Budget and focused browser checks

The 80 canonical route budgets require exactly 74 gzip ceilings and 74 Brotli ceilings to increase by 6 bytes, each to the measured value. Files, depth, inline ceilings and the other six route budgets remain unchanged. There is no allowance padding or broad percentage increase. Locale routes continue to use their canonical ceilings.

A local Chromium CSS-only check loaded both unchanged output directories at widths 390/1280 and light/dark schemes, with JavaScript disabled: eight profiles. Each actual Monorepo tree's eight existing square icons remained 14×14 in both outputs. An explicitly controlled 10×20 intrinsic SVG image inserted only in the browser DOM demonstrates the boundary: inside the real tree it measures 14×28 before and 14×14 after; an ordinary prose image remains 14×28 in both. This is a controlled cascade check, not a claim that the existing square icons displayed a height difference. No source or output files were modified by the probe. No external requests or page errors occurred; browser and HTTP servers closed.

The scoped existing auditor passed against the updated budget, without rebuilding or writing `site/out`:

```sh
node site/scripts/style-delivery.mjs site/out /tmp/master-css-shared021-style-budget-review/audited-budget-pass.json --budget site/tests/style-delivery.budget.json
```

Evidence is retained under `/tmp/master-css-shared021-style-budget-review/`: `css-delivery-comparison.json` includes every asset/route and all 148 exact ceiling changes; `browser-sizing-proof.json` records the eight profiles; `audit-pass.log` and `audited-budget-pass.json` retain the successful audit. `git diff --check` passes. Root owns the subsequent site lint/full build and final same-source CI. This review does not repeat those gates, the separate full CSS baseline update, or a complete cross-browser visual matrix.
