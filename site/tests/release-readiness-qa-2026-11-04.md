# Website release preparation QA — 2026-11-04

This is local preparation for #472 and #473, not a deployment or public release verification. The publication/deployment hold remains in force. Follow [the cutover and recovery runbook](release-cutover-runbook.md) for remaining operator checks.

## Candidate and changes

The local working copy was based on `3fc239c6ca2b790a399600c9bfaa599595e07420` with uncommitted work. It is not an immutable release candidate. A production build used explicit rehearsal metadata `PUBLIC_COMMIT_REF=main`, `PUBLIC_VERSION=2.0.0`, `PUBLIC_URL=https://css.master.co`; this does not assert that npm version exists. The verified output digest was `d44066babede70d8fcb6990cfaa0069927097f68ae4784c6b5412bb5e4cef9ae` using the verifier's sorted file-path/content-hash inventory.

- Stable branch canonical defaults now use the stable domain even when a provider supplies a preview hostname. Explicit overrides and local development retain their documented behavior.
- Installation now distinguishes the intended coordinated package channel from the presently incomplete public package set. Local workspace builds do not prove registry installation works.
- Agent prompts in Migration and AI coding no longer hardcode the RC domain on the stable documentation surface.
- A verifier checks existing output and owns its temporary local HTTP server. It does not build, publish or deploy. Redirect destinations are resolved through local chains, with missing targets, missing anchors, cycles and insecure external destinations rejected.
- Existing stylesheet budgets and CSS contracts were unchanged. The user's existing homepage version-display change was preserved.

## Results

| Check | Local result |
| --- | --- |
| Production build | 155 pages; 85 referenced public assets verified |
| Static release inventory | 155 HTML documents; 16,178 local links/assets/anchors; canonical, sitemap and portable origins passed |
| Public environment tests | 22 passed |
| Portable documentation / current-content hygiene | 39 passed |
| Authored documentation examples | 28 passed |
| Release verifier rejection tests | Four passed: redirect anchors, unused broken destinations/cycles, HTTPS-only external redirects and wildcard targets |
| Generated references | 27 passed |
| CSS contract | 155 routes, 80 contracts, 2,287 segments plus two unit tests passed |
| Stylesheet budgets | 155 routes, 44 CSS assets passed existing budgets |
| Site lint/type checks | Passed; Astro reported existing hints, no errors; Svelte reported no errors or warnings |
| Chromium and WebKit | 56 profiles passed across seven representative routes, 390/1,280 widths and light/dark themes |
| Keyboard/search and reading | Installation search opens by keyboard, supports result navigation and Escape/focus return; Installation remains readable without JavaScript |
| Automated accessibility | No WCAG A/AA rule violations in those 56 profiles; incomplete rules still require manual assessment |
| Firefox | Failed before navigation: bundled Firefox reported `Could not find profile folder`; launch also failed with a different temporary directory |

The browser routes were `/`, `/tw`, `/guide/installation`, `/guide/migration`, `/guide/language-service`, `/reference/packages` and `/tw/guide/installation`. Reduced-motion preference was requested. Automated checks do not certify all animations or screen-reader behavior. Axe incomplete rule IDs included `aria-valid-attr-value`, `color-contrast` and `link-in-text-block`; these were reported rather than converted into passes.

The verifier defaults to Chromium, Firefox and WebKit and keeps the Firefox failure fatal. Ubuntu CI must complete all three engines on the final committed build. External redirect destinations and actual Cloudflare response headers remain live checks. No local output or rehearsal version is evidence that the stable or RC public domain serves this candidate.

## Release blockers outside local verification

The registry inventory still has unavailable candidate packages and stage-only packages. Final clean-install smoke, stable installation commands, actual release metadata and announcement must be reconciled with a real coordinated release. The new scoped Pages credentials, channel project mapping, immutable deployment identity and previous production rollback target must be verified privately. Authorized staging, public-domain checks and manual assistive-technology review remain pending. These constraints prevent closing #472/#473 solely from local checks.
