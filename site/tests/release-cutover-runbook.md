# Website release cutover and recovery

This is a reviewable procedure for #472 and #473. It does not authorize publication, deployment, DNS changes or a rollback. The current hold remains in effect. Local candidate checks do not establish that either public domain serves this candidate.

## Routing and artifact contract

| Surface | Intended source | Canonical origin | Cutover condition |
| --- | --- | --- | --- |
| Stable documentation | Approved stable release commit on `main` | `https://css.master.co` | Matching public package set is available; exact artifact and live checks pass |
| RC documentation | Approved prerelease commit on `rc` | `https://rc.css.master.co` | Matching RC packages and the RC artifact pass independently |
| Private candidate preview | The same immutable commit and built output intended for the target surface | Keep the intended stable or RC canonical origin | Require preview `X-Robots-Tag: noindex`; do not promote a moving branch alias as proof |
| Existing v1 site | Retained previous production deployment | Its existing origin until an approved cutover | Record a rollback target before replacing the stable domain |

The site reads `PUBLIC_COMMIT_REF`, `PUBLIC_VERSION` and `PUBLIC_URL`. Set them explicitly in release CI. Stable `main` defaults to the stable origin, including when a hosting provider supplies its own preview URL; RC defaults to the RC origin. An explicit `PUBLIC_URL` overrides either default. Local development continues to use localhost.

`PUBLIC_VERSION=2.0.0` is suitable for a local stable-metadata rehearsal only. It does not prove that version exists in npm. A release job must obtain the real version from its release result and bind the checked-out commit, build report, artifact digest and uploaded deployment to the same revision. Do not use a branch-head deploy hook to claim exact-commit deployment.

The release workflow checks out `github.sha`, validates and retains the generated site artifact, then uploads that same `site/out` with Wrangler's `--branch "$PUBLIC_COMMIT_REF"` and `--commit-hash "$GITHUB_SHA"`. Before enabling this path, configure the scoped `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets and the `CLOUDFLARE_PAGES_STABLE_PROJECT` / `CLOUDFLARE_PAGES_RC_PROJECT` variables. Their values belong only in private settings. The read-only target preflight must confirm the selected project, production branch and domain; do not send `main` to an RC-only project. These new settings are a remaining deployment prerequisite, not something established by the local build or an existing RC hook.

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

These steps remain pending while deployment is prohibited.

1. Stage the exact verified output with its commit identity. Confirm the preview has `X-Robots-Tag: noindex`; Pages preview aliases can move, so retain the immutable deployment URL. [Preview deployment documentation](https://developers.cloudflare.com/pages/configuration/preview-deployments/)
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
