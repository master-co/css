# 0090 Server HTML correctness and raw-text safety

## Scope

- Continues authorized fixes after0089. Existing three server regressions reproduced on current native artifacts:3FAIL ([before](../evidence/0090-server-before.log)). Fixed IDs retained. No changes to Rust CSS generation, fixtures/snapshots, dependencies, lockfiles or unrelated Site files.
- Read server package/AI, parser, decoder, renderer, HTML render session, current tests and0007 evidence. Server owns HTML parsing/serialization; semantic CSS remains in Rust.

## BH-0005 fixed

- Attribute entity decoding uses the existing htmlparser2 parser in attribute context, only when an ampersand is present. Original DOM attributes remain encoded for serialization; no new dependency or global mutable decoder.
- Decode before tokenizing, and split only HTML ASCII whitespace. Nonbreaking space and vertical tab remain within a browser class token. Do not decode references twice.
- Seven added cases cover numeric/hex/named whitespace, a multi-codepoint named entity, NBSP, vertical tab, nested encoding and ambiguous ampersands. Original decimal separator regression also passes.

## BH-0006 fixed

- Escape closing-style raw-text sequences only at HTML stylesheet injection/replacement. CSS hex escaping preserves string/identifier meaning and original tag case; an odd immediately preceding backslash is reused so its escape semantics stay unchanged.
- The returned cssText and hydration IR retain the original semantic CSS. Ordinary comparison operators are not globally replaced; no HTML entity escaping inside style raw text.
- Browser control adds original CSS through DOM textContent, avoiding HTML tokenization, then compares the computed content value to serialized SSR HTML.
- Chromium153/Firefox155/WebKit26.6 each pass24cases (72total):0/1/2preceding backslashes, mixed-case closing tags, new/existing master style, return/inject/disabled/external hydration. No marker execution or executable script nodes, exactly one master style, CSS content identical to DOM/CSSOM control ([log](../evidence/0090-server-browser.log), [repro](../repros/server-raw-text.mjs)). All browsers/pages closed.

## BH-0007 fixed

- Renderer always requests a class-subset snapshot, including empty class lists, so engine-owned static resources reach HTML. Existing cache isolation and empty-CSS behavior remain covered by the package suite.

## Validation

- Compatibility-wrapped `pnpm --filter @master/css-server exec vitest run`:12files/60tests PASS, including three original failures ([log](../evidence/0090-server-tests.log)). Seven added entity cases then pass with all10tests in `tests/bug-hunt.test.ts` ([log](../evidence/0090-server-entities.log)); no product change between these runs.
- Same wrapper with server `lint`, `type-check` and `build`:PASS ([lint](../evidence/0090-server-lint.log), [types](../evidence/0090-server-types.log), [build](../evidence/0090-server-build.log)). Build only refreshes ignored package artifacts; no published deployment/commit.
- No CSS semantic or browser runtime bundle change; serialized HTML style text intentionally uses equivalent CSS escapes. No benchmark performance claim.

## Downstream Nuxt follow-up

- Nuxt package production/HMR checks already pass0089. Refreshing root ignored Nuxt dist using its ordinary build, then run actual examples/nuxt.js build/SSR/browser against these package exports. Current build session78958; poll before restarting. No external deployment or release operation.

## Remaining

- 44historical confirmed findings:12fixed,32unresolved after these three fixes. Remaining failures and Integration lab identity prerequisite unchanged. Goalactive; ledger cleanup waits for full completion.

- Downstream follow-up complete: root Nuxt package build PASS ([log](../evidence/0090-nuxt-package-build.log)); original `examples/nuxt.js` build, real SSR and Chromium/Firefox/WebKit dynamic runtime controls all PASS against rebuilt package exports ([log](../evidence/0090-nuxt-example.log)). Session8044terminal, host/browser/copy cleaned. No deployment.
