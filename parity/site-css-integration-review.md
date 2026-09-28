# Integrated site CSS contract review

Authority: on 2026-09-28 Aron approved the outstanding work ("全部核准") and
authorized integrating the result ending at `9d9817241` before the freeze.
That history includes `6adc31c5a` (retired sizing utilities) and complete Compose
removal. This review records the resulting site bytes; it does not claim a new
human review of an unseen diff. The previous snapshot's 2026-09-25 visual QA
remains historical evidence, rather than being relabeled for these new bytes.

## Scope and source

The old snapshot was last updated by `3eee73b7c`; the rebuilt site uses integrated
source through `6b82e15db`, with later TypeScript resolution and CI-only changes.
The production CSS was not changed to make this gate pass. The exact-byte
verifier, route stylesheet boundaries, inline-variable checks, CSS reconstruction
and Manifest version checks remain intact.

The refreshed snapshot retains all 1,240 static HTML route identities and their
CSS/no-CSS classification. It contains 125 delivery contracts (previously 124),
1,843 generated rules (previously 1,827), and 4,031 deduplicated exact CSS segments
(previously 4,015). Contract hashes change transitively when their contents change.

## Exact differences

- The project Manifest differs only by removing the six `size`, `min-size`, and
  `max-size` raw/named utility definitions from `6adc31c5a`, and reducing subsequent
  utility order indexes by six. All other fields are equal, including versions,
  variables, modes, aliases and remaining utility definitions.
- All 1,811 retained generated rules are exactly equal. Sixteen `size:<value>`
  rules become 32 `width:<value>` / `height:<value>` rules. Exact comparisons
  preserve each value, selector escaping and media wrapper. Site class migrations
  already belong to `6adc31c5a`; this snapshot adds no syntax or runtime behavior.
- Of 57 removed and 73 added CSS segments, 16/32 are those dimension rules,
  40/40 are theme resource blocks, and one/one is `.doc-step-number`.
- Theme blocks retain every common property's value. Added resources are limited
  to `--font-family-mono`, `--font-mono`, `--font-family-sans`, and `--font-sans`
  required by existing native styles. The three Next installation pages no longer
  need orange warning-callout resources after their guidance was corrected.
  The three retired sizing reference pages no longer need four resources used by
  their former interactive reference shell. The same changes apply to locales.
- `.doc-step-number` retains its complete declaration multiset. Only
  `inset-inline-start` moves before the other declarations; no shorthand or
  duplicate declaration competes with it.
- Per-route class sets match the dimension migration except 24 localized routes:
  the three Next installation pages lose obsolete warning-icon classes, three
  sizing reference pages become removal notices, the Compose notice loses its
  unused screen-reader helper, and the adjacent screen-readers page gains three
  pagination-arrow classes after the reference catalog changed. These are existing
  document/catalog changes, not unexplained engine output differences.

## Playground contract

The starter template migrated from Compose to native declarations in `9d9817241`.
Its tests now expect native whitespace and nested `&:hover .btn-arrow-line`, while
retaining opacity, transform, layer, token, keyframe, warning and Manifest checks.
Native custom-property values are correctly reported as `CSS_VALUE_UNKNOWN`
information; tests reject any other diagnostic kind or warning prefix instead
of requiring the obsolete empty diagnostic result. No diagnostic is suppressed.

## Validation

The 17 Playground cases pass. The Vercel deployment of `5ee8e180e` was inspected
in the browser: the Design System document, typography and navigation render;
both host previews previously passed the Compose removal notice and native CSS
example checks. The snapshot's exact differences were checked before regeneration.
Final scoped lint, type checks and the unchanged CSS contract gate are recorded
with the current CI and issue #454 acceptance evidence.

Exact old/new snapshots, a machine-readable segment/resource review and the
comparison script are preserved in this chat's external evidence directory.
