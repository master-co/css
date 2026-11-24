# Shared site 0.3.3 compact highlighted code site CSS review

The reviewed build is `main` at `d910a3a88`, with `@master/internal-site` raised
from 0.3.2 to 0.3.3. `@master/ui` stays at 2.1.0.

## Exact contract and intentional change

The previous snapshot SHA256 is
`c49cbd1906853973580394a9250935bc4cb856192b992444df562e73783077ac`
(approved by `css-contract-qa-2026-11-22-shared-site-0.3.2.md`): 389 routes, 58
contracts and 511 exact segments. The new snapshot records the same 389 routes
and 58 contracts with 519 segments. No route was added or removed, routes group
into the same contracts, and the project manifest, semantic and public baselines
are equal. No segment changed or was removed; eight were added, and every
contract is its previous segments plus these eight:

| Segment | Bytes | Rule |
| --- | --- | --- |
| `9fbae042867110ac` | 37 | `.shiki .ht{color:var(--ui-code-text)}` |
| `eb0428b97194045d` | 44 | `.shiki .hp{color:var(--ui-code-punctuation)}` |
| `270a461b544d9dd4` | 41 | `.shiki .ha{color:var(--ui-code-property)}` |
| `1c4ec451af194198` | 39 | `.shiki .hs{color:var(--ui-code-string)}` |
| `912f2d62004baabc` | 41 | `.shiki .hf{color:var(--ui-code-function)}` |
| `ad88fa383021a59e` | 40 | `.shiki .hk{color:var(--ui-code-keyword)}` |
| `32de43dd9cca7df8` | 40 | `.shiki .hn{color:var(--ui-code-number)}` |
| `ed78ee35f4c17a8a` | 40 | `.shiki .hc{color:var(--ui-code-comment)}` |

Shared site 0.3.3 writes the color of a plain highlighted token in a code block
as one of these classes instead of Shiki's inline `style`, and merges adjacent
tokens of one color. The rules are unlayered, like the inline styles they
replace. Spans that carry other attributes, such as Master CSS semantic and host
spans, keep their inline style; shell blocks keep one span per token; inline
code is unchanged. The site's adapter test reads a token's color from either
form.

## Rendered effect

The built output was read in a browser at `/guide/cascade-layers` in the light
and dark themes. Every compacted token (686 across eight roles) computes the
same color as its `--ui-code-*` role in both themes, and the 40 semantic and
host spans keep their inline colors.

Narrow widths and forced colors were not read for this review.

## Delivery and HTML

All 81 budgeted routes deliver exactly 65 more gzip and 59 more Brotli bytes.
The budgeted total rises from 2863371 to 2868636 gzip bytes and from 2444802 to
2449581 Brotli bytes. File counts, import depth and inline CSS are unchanged.
Inline token color styles in the published HTML fall to 14510, the semantic
and host spans.
