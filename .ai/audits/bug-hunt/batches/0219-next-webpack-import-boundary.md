# Batch 0219: Next Webpack import boundary

Batch finished for bounded host and test-contract verification. Previous goal turn made progress by establishing a sibling-wrapper candidate and rejecting incompatible URL strategies. At start all634 selected sources/493 artifacts matched0218. Goal active; historical61/57fixed/4unresolved and65checked/10blocked unchanged. This batch does not deliver the general loader candidate.

## Existing assertion contracts

The new tests/helpers/stylesheet-output.ts reads only CSS files reachable from the actual loader result. It never scans old asset revisions. Full-text assertions inspect that graph; source-map assertions follow an import-only synthetic wrapper to the published entry and its own inline map. Plain inline output remains unchanged.

In the owned candidate copy, three files use that helper: stylesheet-loader.test.ts, bug-hunt-sass-source-offsets.test.ts and bug-hunt-output-source-maps.test.ts. All original expected values remain byte-for-byte unchanged: base CSS, imported native rules/keyframes, Sass partial ownership and exact source-map positions. Those three files plus the five0218 controls give29PASS. The exact patch is repros/next-loader-output-graph-tests.patch. Root existing tests are untouched. This patch has not been applied or presented for authorization because the product candidate still fails the default Webpack host; approval must follow a concrete verified delivery strategy.

The full package suite was not rerun after these test-copy changes. Do not arithmetically convert0218's116PASS/9FAIL into a new full-suite result.

## Real host matrix

The host repro now selects webpack or turbopack, records all12 browser assertions without stopping at the first failure, and preserves emitted CSS/file inventories before cleanup. Pure controls omit Master CSS entirely and replace only the owned fixture's compose declaration with equivalent padding. External CSS is served by an owned loopback server, never fetched from an unrelated service.

| Configuration | PASS | FAIL | Boundary |
|---|---:|---:|---|
| Candidate, default Next Webpack | 6 | 6 | Direct SVG/padding pass; layered child/external import fail in all3browsers |
| Pure Next, default Webpack | 6 | 6 | Same failures without any Master CSS loader/plugin |
| Candidate, explicit Lightning CSS Webpack control | 9 | 3 | Layered child now works; external import remains inactive |
| Pure Next, Turbopack | 12 | 0 | Same intended native CSS semantics work |
| Candidate, Turbopack | 12 | 0 | Captured assets, composed CSS and active qualifiers work |

Use0219-host-matrix.json and the five observations JSON files for exact browser values and emitted CSS. The first Webpack run stopped after direct PASS/nested FAIL;0219-general-webpack-complete.log supersedes its incomplete browser count. Failed rows retain their exact expected checks; no oracle was weakened.

Default Next16.3.4 css-loader takes all tokens after an import URL as a media string. Its runtime wraps that string in @media. Actual output consequently contains @media layer(card){...}, which does not apply. Its external import also appears after ordinary rules in the final bundle and is ignored. The pure Next output reproduces both facts. Installed parser/runtime hashes and exact code excerpts are in0219-next-css-loader-source.json. This is a host boundary under the existingBH-0004/Next requirements, not a new finding ID and not proof that the integration can be considered complete.

The Lightning CSS control was restricted to an owned generated Next project; no real project config or default changed. It fixes only one failure category. A separate control forces external-import filters to return true; both ordinary and Lightning Webpack builds then fail resolving the HTTP URL as a filesystem/module request. The installed isUrlRequestable treats scheme URLs as requestable. These rejected controls are evidence, not repairs or recommended defaults. Do not add network downloading or change remote CSS semantics to hide this failure.

## Preservation and remaining work

All633 unchanged inherited source records plus the modified host repro and2new audit/helper files yield636 selected records. All493 shared artifacts and all production sources remain0217. The isolated candidate's44 artifacts match0218; only its three test files/helper changed. Updated owned-copy source/artifact state is0219-wrapper-candidate.json. The0217 old-artifact backup is separate and must never be rebuilt.

All34 inherited remaining entries are preserved verbatim in0219-final-checks.json, with one bounded result/next requirement appended (35 total). The two pending Webpack approvals and0038 identity confirmation remain pending. The prepared Next graph test patch is not a new approval request yet. No root existing-test, fixture, dependency, lockfile, CI, release, foreign Site or commit changes. HEAD/index unchanged; owned servers, browsers and projects cleaned; all commands terminal. Next lint/type checks pass; final AI context check is recorded separately.

Next0220: isolate Next's import metadata/runtime and CSS extraction behavior in owned loader controls before designing a repair. Preserve stylesheet boundaries, remote import ordering, per-file maps, CSSModules and ordinary user loaders. A formal installed-dependency/lockfile correction requires a precise validated patch and explicit authorization. Do not force global Lightning CSS or an external-import filter override: neither is a complete verified repair. Complete actual host maps/Sass/dev/HMR/SSR and required suite/e2e evidence before applying/promoting the general loader candidate or migrating its existing assertions.
