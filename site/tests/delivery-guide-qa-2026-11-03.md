# Optimizing CSS delivery — local verification

This change adds the maintained Build and delivery Guide at `/guide/optimizing-css-delivery`, four explanatory figures, a public-package reproduction and an on-demand workflow in `skills/master-css`. It does not add a Blog, compiler option, runtime mode, MCP tool or budget API. Publication, deployment, push and merge remain out of scope.

## Editorial ownership

The English source follows one Overview/Reports example: establish delivered assets, move the report import to its owner, evaluate native pruning, distinguish rendering behavior, then compare output and interactions before setting budgets. Global styles and Reusing styles retain design decisions; Route-level styles retains local delivery/reference/scope; Scanning and pruning retains syntax and source policy; Rendering modes retains hydration and adapter support; AI coding retains setup, repair and token inspection. Each gets a short contextual link rather than a copy of the new procedure. Existing URLs and anchors remain.

The example contains all eight runnable project files, uses public preset tokens and public `@master/css`, `@master/css-vite` and CLI packages, and does not import `@master/internal-site`. Site presentation uses the established document components. The fixture lives outside the site's source root, so its full CSS entry cannot accidentally join the site's project graph.

English remains the authored source. The Traditional Chinese title and summary use the existing dictionary; body content follows the site's existing English fallback. The existing translation collector was run and its pending segments retained locally. This is not claimed as a completed body translation, and no external translation batch was submitted.

## Claims and evidence

- `packages/vite/src/plugins/local-styles.ts` passes definition context to the local transform without a class usage set. The public Vite reproduction confirms that the locally imported report stylesheet retains `.report-debug` despite its opt-in marker. The article explicitly documents this limitation instead of claiming directive presence proves pruning.
- The matching public CLI `generate` command, run in a disposable check directory with the report HTML and full literal state map, removes `.report-debug`, retains idle/ready, attribute/focus selectors and the spacing dependency, retains an exact external safelist, and preserves the unknown CMS stylesheet. This verifies that path; it does not silently substitute its output into Vite.
- `packages/compiler/src/stylesheet/index.ts` and the directives contract establish root usage scope and class-branch filtering. `packages/vite/src/options.ts` supplies the preservation default. The existing shared `native-pruning.test.ts` was rerun through the public compiler/scanner APIs and passes package opt-in, media/container/data/ARIA/pseudo states, variable and keyframe dependencies. No compiler semantics were changed.
- The public progressive example verifies inline initial `p-lg` CSS before JavaScript. A separate fresh Reports load has no program request initially; adding a valid utility absent from its hydration manifest loads the deferred program and produces the rule in CSSOM. Native ready/focus behavior is checked independently. Runtime support is never presented as recovery for deleted arbitrary native selectors.
- Chrome Network/Coverage documentation supports request inspection and the limits of coverage; Vite's current public multi-page/build documentation supports the example's two HTML inputs and Rolldown configuration. Links are beside the relevant reader instructions. Source/manifest evidence, assets, transfer size and observed behavior are distinguished throughout.

## Figure design and review

All scenes are editable TypeScript under `site/assets/images/optimizing-css-delivery/source`. The shared renderer produces 1440 × 960 light/dark PNGs from one 720 × 480 scene. It uses the existing interface fonts, tokens and illustration primitives, with no new drawing dependency or browser diagram runtime.

| Figure | Geometry and inference | Misreading prevented |
| --- | --- | --- |
| Ownership | Matched before/after import graphs repeat navigation and report rule identities on two page artifacts. The local report module has its own path to Reports. | Delivery membership is not selector scope, module execution order or a byte measurement. |
| Evidence | A bounded source/map lane filters into retained selector states; an unbounded CMS lane bypasses filtering through preservation. | Initial DOM absence is not proof of unreachable state; unknown source is not inferred safe. |
| Dimensions | Rows compare static/progressive; columns compare native preserve/prune. Runtime capability appears in both progressive cells, while unused native membership changes in both pruning cells. | Pruning does not imply a mode switch or guarantee every integration supplies usage. |
| Verification | Asset evidence and user-state evidence converge before one budget gate. | Fewer bytes alone cannot establish correct behavior or faster paint. |

Render bounds/fonts/dimensions pass. Light/dark pixels and actual article crops were inspected. The 390px composition remains the same proportional image; its fine labels become small, so an independent readable caption and expandable HTML description carry the complete lesson. The image and export descriptions share `illustrations.ts`. This is author inspection, not observed novice research.

## Reproduction and measurements

Run `node site/tests/css-delivery-example.mjs` from the repository root. It builds before/after fixtures, traces browser-requested CSS, exercises refresh/focus, verifies progressive initial/new-utility behavior and runs the public CLI pruning probe. Temporary builds reuse the checkout's public package builds through dependency links; this is not a fresh published-registry installation. Tested with Node 24.22.1, Vite 8.3.5, Manifest v6 and language v18; source identity and logs accompany the evidence.

The deliberately small fixture shows an ownership improvement with a tradeoff:

| Route | External files | Raw CSS bytes | Gzip bytes | Brotli bytes |
| --- | ---: | ---: | ---: | ---: |
| Overview | 16 → 14 | 4,437 → 3,925 | 2,318 → 2,005 | 1,788 → 1,572 |
| Reports | 16 → 19 | 4,437 → 4,536 | 2,318 → 2,476 | 1,788 → 1,925 |

These sum distinct fetched CSS asset contents using Node compression defaults, not HTTP transfer bytes or timings. Overview no longer receives report rules; Reports pays for additional local fragments. The article explicitly cautions that narrower ownership is not a performance win for every route and does not offer a universal percentage/KB target. No claim of accelerated paint is made.

## Verification results

- Public example: before/after production builds, direct and subsequent navigation, ready/focus states, initial CSS, deferred program and newly generated utility pass. CLI complete-map/safelist/preservation assertions pass.
- Shared package pruning fixture passes. Site type checks report no errors/warnings (existing Astro hints remain); lint, MDX import checks, atomic authoring checks and AI context budget pass. Skill Creator's validator passes in a disposable Python environment with PyYAML.
- Portable content tests: 38 pass, including all four figure descriptions, complete runnable files, preserved limitation text, search equality and no leaked custom MDX tags.
- Packed site builds 155 routes. The previous 153 routes have identical exact CSS/hydration contracts and unchanged project manifest. Only the new English and `/tw` routes are added to the exact snapshot and delivery budgets; there are no existing-route budget increases.
- The document sweep covers eight affected routes in six theme/width profiles each (48 profiles). It retains the known shell SVG gradient duplicate-ID baseline; the new routes inherit the same exact ID/count pattern as the existing route-level guide. Default duplicate-ID checking still reports that pre-existing platform issue.
- Dedicated article checks cover Chromium 390/768/1440px and WebKit 390/1440px in both themes, all four figures, proportional bounds, text descriptions, 200% root text, manual preference-handler image selection, links/anchors and the Chinese title. Preference-handler testing does not claim that a hidden footer control is reachable; general menu interaction was covered by the prior platform work.

## Public skill scenario review

This is a manual routing review, not a separate-agent benchmark:

| Request | Expected bounded workflow | Evidence/report boundary |
| --- | --- | --- |
| Adjust one button's spacing | Existing authoring workflow, local owner and affected-state checks | Does not trigger whole-site delivery audit or change modes. |
| Reduce CSS on Overview and Reports | Read `references/delivery.md`; confirm versions/entry/mode/policy/checks; baseline → ownership/pruning decision → output and behavior comparison | Source inspection is not substituted for production/browser evidence; report the Reports fragment increase. |
| Report ready state has missing CSS | Start with the selector, source/scan policy and delivered file; read delivery reference only for a delivery-related cause | Check safelist/preservation if usage is unknown; do not assume progressive restores arbitrary native rules; return to cascade troubleshooting when rules are present. |

The skill keeps runtime/progressive dynamic utilities valid, refines complete-name guidance for static extraction/native pruning, and keeps local changes small. It adds one conditional reference rather than a new skill or a blanket audit policy.

Local evidence is retained under `/Users/aron/master-css/.cache/delivery-guide-2026-11-03/`: build/test logs, public example output, figure/article screenshots, translation collection, exact contract comparison and source hashes. The site was validated with the existing actual shared-package tarball in an isolated consumer; the registry pin/lockfile is unchanged. The disposable consumer has no `.git`, so content preparation prints a git metadata warning while completing successfully; Guide content and exports are verified separately. No new publication or deployment occurred.
