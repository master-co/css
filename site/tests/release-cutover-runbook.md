# Website release cutover and recovery

This is a reviewable procedure for #472 and #473. Execution remains subject to the owner's release authorization and completion of the agreed readiness and MDX/translation work. This document does not itself authorize publication, deployment, DNS changes or rollback. Local candidate checks do not establish that either public domain serves this candidate.

## Routing and artifact contract

| Surface | Intended source | Canonical origin | Cutover condition |
| --- | --- | --- | --- |
| Stable documentation | Approved stable release commit on `main` | `https://css.master.co` | Matching public package set is available; exact artifact and live checks pass |
| RC documentation | Approved prerelease commit on `rc` | `https://rc.css.master.co` | Matching RC packages and the RC artifact pass independently |
| Private candidate preview | The same immutable commit and built output intended for the target surface | Keep the intended stable or RC canonical origin | Require preview `X-Robots-Tag: noindex`; do not promote a moving branch alias as proof |
| Existing v1 site | Retained previous production deployment | Its existing origin until an approved cutover | Record a rollback target before replacing the stable domain |

The site reads `PUBLIC_COMMIT_REF`, `PUBLIC_VERSION` and `PUBLIC_URL`. Set them explicitly in release CI. Stable `main` defaults to the stable origin, including when a hosting provider supplies its own preview URL; RC defaults to the RC origin. An explicit `PUBLIC_URL` overrides either default. Local development continues to use localhost.

`PUBLIC_VERSION=2.0.0` is suitable for a local stable-metadata rehearsal only. It does not prove that version exists in npm. A release job must obtain the real version from its release result and bind the checked-out commit, build report, artifact digest and uploaded deployment to the same revision. Do not use a branch-head deploy hook to claim exact-commit deployment.

The release workflow uses the existing Cloudflare GitHub App. The site does not wait for a package release. After required validation succeeds, `deploy-site` plans the delivery (`node scripts/pages-site-release.mjs plan`):

- A release push delivers with its own version, after the complete actual npm release and any required editor publication succeed.
- A push without a release delivers with the channel's newest release tag, whatever files it changed: commits that release nothing (README, package metadata, tests, refactors, CI) leave what users install unchanged, so the site documents that release. Registry evidence comes from npm itself (that version, its tagged `gitHead`, and the channel dist-tag still pointing at it), and the manifest is attached to that existing release as `site-<channel>-<site revision>.manifest.json`.
- Only a pending release, whose releasing commits are not yet published (for example after a failed release), defers the site so it never documents behavior users cannot install yet. The job logs a notice naming the pending release type.

Either way the workflow builds the exact source, runs browser verification, publishes the public output manifest and advances the corresponding delivery ref to that same commit. It never creates a delivery commit or force-updates a ref. The manifest and public identity record both `revision` (the site source) and `releaseRevision` (the documented release's tagged source); they are equal for a release push.

| Logical release channel | Pages production Git branch | Canonical origin |
| --- | --- | --- |
| `main` | `codex/pages-stable` | `https://css.master.co` |
| `rc` | `codex/pages-rc` | `https://rc.css.master.co` |

This deliberately separates source/release branches from deployment triggers. `PUBLIC_COMMIT_REF` remains the logical channel; it is not the Pages delivery branch. A branch-head deploy hook must not replace the exact-source handoff.

The operator's strict target check in `scripts/pages-release-target.mjs` still requires the selected project, its corresponding production delivery branch and its canonical hostname. It never accepts a different hostname for bootstrap. The automated Git flow does not claim to have performed this API check: no Cloudflare token is required or created by it. Inspect these fields through the authenticated dashboard before the domain cutover; if an independently supplied read credential is available, the helper can perform the same strict read-only assertion.

## Git App configuration

Configure these repository variables for each `STABLE` and `RC` surface:

| Repository variable | Value |
| --- | --- |
| `CLOUDFLARE_PAGES_STABLE_PROJECT` / `CLOUDFLARE_PAGES_RC_PROJECT` | Actual Pages project name |
| `CLOUDFLARE_PAGES_STABLE_SUBDOMAIN` / `CLOUDFLARE_PAGES_RC_SUBDOMAIN` | Actual `<assigned-name>.pages.dev` subdomain, without scheme or path; do not infer it from the project name |
| `CLOUDFLARE_PAGES_STABLE_MODE` / `CLOUDFLARE_PAGES_RC_MODE` | Explicitly `bootstrap` or `production`; missing/other values fail |

The workflow uses its existing repository `GITHUB_TOKEN` only for immutable release-asset creation, fast-forward Git ref updates and reading official Pages checks. It does not expose that write token during dependency builds. The selected project and public subdomain appear in public release evidence; account identifiers, API tokens, hook URLs and full Cloudflare deployment identifiers do not.

For each Pages Git source, use the matching production delivery branch, disable all preview branch builds, retain all build watch paths (`*`, no exclusions), set the repository root as the build root, set build command `bun run build:site:cloudflare-pages`, and output directory `site/out`. Configure these build variables:

| Cloudflare build variable | Value |
| --- | --- |
| `NODE_VERSION` | `26.13.0` for the current stable source, matching its Node 26 toolchain |
| `BUN_VERSION` | `1.4.4` |
| `SKIP_DEPENDENCY_INSTALL` | `1`; the hosted script runs the frozen install itself |
| `MASTER_CSS_PAGES_PROJECT` | That project's actual name |
| `MASTER_CSS_PAGES_SUBDOMAIN` | That project's actual `pages.dev` subdomain |
| `MASTER_CSS_IMAGE_TRANSFORMATIONS` | `false`, identical to release CI |

Leave `PUBLIC_VERSION` unset in hosting settings. The helper resolves the unique actual release tag that points to `CF_PAGES_COMMIT_SHA`; for a site-only commit it uses the channel's newest release tag, whose release must already carry the manifest CI published for this exact commit. It maps `CF_PAGES_BRANCH` to the logical channel and sets the canonical origin. Any explicit `PUBLIC_VERSION`, `PUBLIC_COMMIT_REF` or `PUBLIC_URL` must agree. `git HEAD`, the exact release tag, Pages commit SHA, delivery branch, configured project and actual immutable Pages URL must all match the manifest.

The 2026-11-12 ownership migration updates stable only. RC retains its previous deployment and disabled production builds; its Node 24 setting remains unchanged until an independently verified RC source update. Preparing a future RC legacy-route flag does not deploy or certify that older surface.

Current Cloudflare documentation says Direct Upload projects cannot switch to Git integration. An empty project's dashboard may present a newer **Connect** path; inspect it without saving or deploying before deciding whether attachment is supported. A button alone is not successful source attachment. Do not delete/recreate the empty stable project automatically. Keep both automatic build controls held until the source, guarded build command, release handoff and owner prerequisites are ready. [Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/), [Direct Upload limitation](https://developers.cloudflare.com/pages/get-started/direct-upload/)

## Exact output evidence

CI creates `site/out/site-release.json` before browser verification. Its payload digest covers every other output file; it does not contain its own hash or the enclosing manifest hash. The external `site-<logical-channel>-<full-revision>.manifest.json` GitHub release asset then records the size and SHA-256 of **every final output file**, including `site-release.json`. No output file is excluded from that final inventory. The manifest also binds the exact source/tag/version, channel, delivery branch, project/subdomain, canonical origin, portable-image flag, public package integrity cohort and successful three-browser report digest.

An existing asset name must have identical downloaded bytes. The workflow never replaces or deletes it. Public registry versions, archive integrities and provenance are checked before delivery. The Cloudflare source build downloads that exact version/revision asset, checks the actual registry cohort again, builds without browser dependencies, reproduces the public identity and compares the complete output inventory before its build can succeed. Missing, extra, renamed, changed or symlinked files fail. A differing build cannot be deployed by accepting a new baseline.

This is a write-once contract enforced by the release code, independently of GitHub's optional **immutable releases** setting. If that platform setting is enabled, all assets must be attached before publishing the draft GitHub release; the present post-release manifest step fails rather than disabling immutability or replacing an asset. Reconcile that release ordering before enabling such a policy. [GitHub immutable releases](https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases)

Both builders clear only the known generated `site/.cache` before building so its previous contents cannot change Reference source-state metadata. The browser report retains its actual source-status entries; the expected generated untracked cache is disclosed rather than described as a wholly clean porcelain result.

The workflow waits for the official Cloudflare Pages App check on this exact source and project, then reads the immutable deployment's public identity. The release concurrency remains held during this wait. A missing/skipped check, failed build, wrong source or timeout fails delivery. Cloudflare documents a 20-minute build limit; the external check wait is bounded to 45 minutes to include queue time. A cold hosted build must fit the platform limit. [Build limits](https://developers.cloudflare.com/pages/platform/limits/)

## Non-deploying preparation

1. Finish the required CI checks on the intended commit, including Windows and native consumer checks. Preserve the existing production deployment.
2. Complete the registry readiness inventory: every required package and native/Wasm dependency must resolve at the release version and channel. Test a clean installer run and the documented framework/manual installation paths. Build success from workspace dependencies is not registry installation proof.
3. Check the public Installation availability notice and CDN `VERSION` template. Remove the pending-release notice only after the matching package set exists. Keep RC instructions on the RC surface; before stable cutover, change stable installer and manual-install examples together to the verified stable channel/version. Keep the runtime script, program and preset from one version.
4. Keep public Migration content about converting external styling systems. Historical package incidents belong in their issues and maintainer release records; do not add retired APIs to the current Guide. The release announcement belongs to the organization site. Verify its destination and actual publication date before linking it; do not invent a release post or date here.
5. Build and verify the target metadata without deploying:

   ```sh
   PUBLIC_COMMIT_REF=main PUBLIC_VERSION=2.0.0 PUBLIC_URL=https://css.master.co bun run build:site
   node --test site/scripts/verify-release-site.test.mjs
   bun run --filter site test:public-env
   bun run --filter site test:llms
   bun run --filter site test:docs-examples
   bun run --filter site test:reference
   bun run --filter site test:css-contract
   bun run --filter site lint
   bun run --filter site type-check
   node site/scripts/verify-release-site.mjs --out site/out --origin https://css.master.co --report /tmp/master-css-site-proof.json
   ```

   Install Playwright's Chromium, Firefox and WebKit browsers first in CI. The verifier owns an ephemeral loopback server and closes it afterward. It checks the existing build, every HTML route's local links/anchors and canonical metadata, sitemap/portable origins, redirect chains and their local destinations/anchors, and representative theme/viewport/browser profiles with automated accessibility rules and keyboard search. The loopback server follows the generated redirect rules and checks `/en`; external HTTPS destinations are recorded without claiming their live availability. It does not emulate Cloudflare's edge, certify all editorial content, or replace a screen-reader review. Its report records the build digest and dirty working-copy status; a dirty local rehearsal cannot certify a clean release commit.

## Private deployment worksheet

Before any authorized cutover, record these fields in a private operator record, not this repository or public issues:

- Owning account/project, production branch and domain mappings for stable and RC.
- Current successful production deployment identifier, commit, artifact digest and tested recovery URL.
- Candidate deployment identifier, exact commit and artifact digest; intended release version/channel.
- Current DNS values, proxy mode, cache configuration and any separately managed redirect rules that would change.
- Responsible operator, release authorization, cutover time and rollback decision owner.

The previous successful production deployment must remain available. A preview deployment is not a Pages rollback target. [Cloudflare Pages rollback documentation](https://developers.cloudflare.com/pages/configuration/rollbacks/)

## Authorized staging and cutover

These steps run only when the owner's release prerequisites have been satisfied.

For a new stable project, start with mode `bootstrap`. Inspect the project and source/delivery branch before staging. If the project still has no Git source, attach it only after the public manifest and exact delivery ref exist; the first **Connect** may trigger a build and must not be treated as configuration-only. The Git App may stage and verify the exact artifact on its immutable `pages.dev` URL while the existing v1 project and stable domain remain intact. A successful bootstrap explicitly records `canonicalVerified: false`; it does not satisfy the stable-domain acceptance gate. After the separately authorized domain association/DNS cutover, verify the strict project/production-branch/canonical-hostname target contract and record an independent canonical proof without republishing npm:

```sh
node scripts/pages-site-release.mjs canonical release-artifacts/site.manifest.json
```

This command verifies the retained manifest against its exact public release asset, source tag, public registry cohort and canonical public site identity, then writes `release-artifacts/site-canonical.json`. Set the surface's mode to `production` after cutover; future deliveries must also verify the canonical identity. Mode is absent from immutable output/manifest bytes, so cutover does not create a conflicting asset for the same revision.

If a failed site job is rerun, it downloads the npm evidence artifact named by the original completed release job, even when the workflow attempt number changes. If its delivery ref already selects this SHA, no new push or synthetic commit is made. Inspect or retry that exact Pages deployment through the authorized dashboard when appropriate; do not force a ref, move a version tag or republish npm to obtain a site retry. A new publication manifest with different bytes requires reconciliation, never `--clobber`.

Pages reconstructs the site from the same source and lockfile, then `hosted-verify` compares every output file with the immutable CI manifest before deployment. It does not directly upload the CI archive. After that comparison and the delivery-ref check succeed, `hosted-verify` atomically updates the build-local `wrangler.jsonc` with seven controlled plaintext build inputs: the actual Node version, repository-pinned Bun version, `SKIP_DEPENDENCY_INSTALL=1`, and the verified project, subdomain, portable-image and legacy-cutover values. This configuration is outside `site/out`; neither public output nor the CI manifest changes. Existing runtime variables, bindings and other configuration remain intact, and production variables keep Wrangler's non-inheritance semantics. Arbitrary process variables and dashboard secrets are never copied.

This synchronization is required on every Worker deployment: [Wrangler configuration is the Pages source of truth](https://developers.cloudflare.com/pages/functions/wrangler-configuration/), so an empty source `vars` map can replace dashboard plaintext build values. Verify the seven build inputs after delivery, including the actual channel's project and subdomain. Keep four explicit prefixes on each surface's Pages build command: `MASTER_CSS_PAGES_PROJECT`, `MASTER_CSS_PAGES_SUBDOMAIN`, `MASTER_CSS_IMAGE_TRANSFORMATIONS=false` and `MASTER_LEGACY_DESIGN_CUTOVER` aligned with its GitHub variable. Use that surface's real project/subdomain, including RC. Pages can apply source configuration before the hosted shell runs, so dashboard-only identity values are insufficient. A failed metadata, registry, output or delivery-ref check must leave the configuration untouched.

`release-artifacts/site-delivery.json` records the source, actual version, logical channel, delivery ref, project, mode and owning GitHub run/attempt before any asset/ref write. Each external write records its intent and acknowledged, rejected or unknown response outcome; asset/ref verification is recorded separately. A lost response can leave a successful remote write with an `unknown` outcome. A failed CLI status never means that no write occurred or that Cloudflare rolled back. Inspect the retained receipt and authoritative asset/ref state before retrying. Retries with an existing local receipt append an attempt without replacing its history; separate workflow attempts retain separate artifacts. Immutable-host and canonical verification flags become true only after their respective live checks complete. Failure receipts contain fixed phase/error codes, never raw responses, credentials or private dashboard identifiers.

1. Stage the exact verified output with its commit identity. A private preview and the new project's production `pages.dev` bootstrap are distinct deployment environments. Require the real `X-Robots-Tag: noindex` response on either Pages-hosted surface; do not assume a production bootstrap inherits preview defaults. The Git delivery watcher explicitly checks the immutable identity response header. Retain the immutable deployment URL because branch aliases can move. These Pages-host rules do not impose a separate JSON SEO requirement on the canonical domain. [Preview deployment documentation](https://developers.cloudflare.com/pages/configuration/preview-deployments/)
2. Verify `/`, `/tw`, Installation, Migration, a generated Reference page, search JSON, `llms.txt`, `llms-full.txt`, sitemap, one hashed JS/CSS asset and one image/font. Verify real HTTPS responses, MIME types, caching and canonical URLs. Run the browser matrix against the deployed artifact, including Firefox, and manually exercise keyboard focus and screen-reader navigation.
3. Verify `/en` and `/en/*` normalization, organization redirects for Blog/Brand/Design System, the `/cdn/*` destination, and unknown route 404 behavior. The generated `_redirects` applies to Pages static responses, not arbitrary Functions routes. [Redirect documentation](https://developers.cloudflare.com/pages/configuration/redirects/)
4. Do not redirect all old documentation URLs to unrelated new pages. The existing product policy deliberately retires removed Reference routes. Preserve committed brand download URLs. Decide any separate legacy-site hostname only after an operator verifies its hosting and recovery plan; this runbook reserves no new domain.
5. Confirm the matching packages, installer and editor extension are publicly available. Promote the stable domain only after those checks and release authorization. RC remains a separate prerelease surface; do not silently redirect it to stable.
6. Repeat the HTTP, asset, canonical, search and critical-browser checks on the public domain. Save exact responses, the deployed commit/digest and the time checked. A WAF challenge must be recorded as an access limitation and verified with an authorized browser; it is not proof of an unavailable site.

## Rollback

Rollback is an externally visible deployment change and requires the operator's authorization.

1. Stop further release/deployment attempts and record the failed candidate identifier and failure evidence.
2. For the same Pages production project, select the retained successful production deployment and use **Rollback to this deployment**. Verify the selected identifier against the private worksheet before confirming. If domain/DNS mapping changed separately, restore its recorded values through the owning platform; a Pages deployment rollback alone does not reverse unrelated configuration.
3. Recheck the stable domain, critical routes, canonical origin, search and referenced assets. Keep immutable assets available to readers of the previous HTML; do not delete old generations during recovery.
4. Record the active recovered deployment, results and unresolved issue. Rollback of the website does not unpublish npm versions or retract a Marketplace release; handle any affected packages as separate release incidents.

## Conditions still required to close the issues

- #472: the exact candidate must be staged and deployed with authorization, live routes/assets/headers and domain mapping verified, and the private rollback worksheet completed.
- #473: the final registry-backed installation instructions must work, the actual release announcement/version must be reconciled, and final deployed browser/accessibility checks must pass. Passing local automated rules does not certify full assistive-technology conformance.

No item in this runbook grants permission to lift the publication/deployment hold.

## Retired organization design routes

The default build leaves `MASTER_LEGACY_DESIGN_CUTOVER` off. Before changing it, publish the required UI and shared packages, deploy Master UI and Master Design, and verify every exact 301 destination in `@master/internal-site/data/legacy-design-routes.json` on its canonical domain. Design currently publishes English only, so incoming localized routes use the exact English destination. Only an explicit, verified `localizedDestinations` entry may override it; never construct destination paths from the source locale. Markdown variants use the explicit `markdownDestination`: Design exports live under `/guidelines/*.md`, not the HTML path plus `.md`. Exercise all source locales, including the `/en` alias. A local candidate or Pages preview does not establish canonical-domain readiness.

For a target surface, set the GitHub repository variable `MASTER_LEGACY_DESIGN_CUTOVER_STABLE=1` (or `_RC=1`) and set `MASTER_LEGACY_DESIGN_CUTOVER=1` in that surface's Cloudflare Pages Git build environment. Then deliver a **new source commit** on `main` (or `rc`): an already published manifest for the same source revision is immutable and must not be replaced just to change this setting. Keep both settings absent or `0` until destinations are ready. Master organization's deployment must independently receive the same opt-in flag after the same destination checks.

For API changes, PATCH only the named `MASTER_LEGACY_DESIGN_CUTOVER` entry under each environment's `env_vars`, together with its current `wrangler_config_hash` when present. This matches the audited Wrangler 4.129.0 `pages secret put` request shape. Never resend masked `secret_text` values from a GET response: existing RC secrets are returned with empty values. Compare all other environment keys/visible fields and the canonical deployment identity before and after; retain RC Node 24 and do not redeploy its held source. The [Pages update API](https://developers.cloudflare.com/api/resources/pages/subresources/projects/methods/edit/) requires explicit `null` to delete an environment variable.

Validation, deployment and the hosted build bind the boolean `legacyDesignCutover` into `site-release.json` and the immutable output manifest. Both `_worker.js` and `_routes.json` must exist exactly when it is enabled; a missing worker, a stale worker in an off build, an earlier validation artifact, or inconsistent GitHub/Pages settings fails closed. The hosted shell explicitly exports the verified flag before building. Worker and route bytes remain covered by the same exact inventory and browser proof as all other output.

After delivery, check representative localized `.html`, `.md` and slash variants: moved documents return 301 with the expected destination and query; private review routes return 410 and noindex; unknown retired paths remain 404; current CSS guides still return 200. In Pages advanced mode the worker handles redirects as well as 410 responses, since `_redirects` is not applied to worker-handled requests. Rollback uses the recorded prior deployment; a subsequent Git delivery that disables the flag also needs a new source commit and matching settings on both builders.
