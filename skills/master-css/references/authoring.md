# Authoring UI

Keep existing component abstractions and design choices. Use `@theme` for named
values, native CSS in `@layer components` for shared component styles, `@utility`
for on-demand classes, and `@mixin` for CSS reuse. Native component classes do not
automatically acquire Master selector or condition suffixes.

## Small syntax bridge

These are preset examples; verify names against the active manifest:

| CSS intent | Class |
| --- | --- |
| `display:flex` | `flex` |
| `align-items:center` | `items-center` |
| `padding:16px` | `p(16)` |
| `gap:1rem` | `(gap:1rem)` |
| `padding:var(--spacing-card)` | `p-card`, if that token family is registered |
| `scroll-margin-top:4rem` | `(scroll-margin-top:4rem)` |

Direct-value number utilities use their defined units: `p(16)` emits
`padding:calc(16 * 1px)`. Never turn `1rem` into `16px` by assuming a root font size.
Use fixed utilities such as `flex`, `hidden`, `w-full` and `text-center` when they
exist. Native declarations require parentheses and full CSS property names.

Selectors follow the head (`bg-brand:hover`); conditions follow as suffixes
(`grid-cols(3)@md`). Query `custom-media` before assuming a breakpoint's threshold.
Whitespace in a native value is encoded as `|` outside strings/escapes. Do not
rewrite quoted strings or CSS escapes with a blanket replacement. Keep those in
native CSS when their class encoding is uncertain.

## Ask for class suggestions

When available, call `mastercss_suggest_classes` with a declaration block:

```json
{"declarations":"display:flex; align-items:center; padding:16px; gap:1rem;"}
```

The tool reads the active manifest, checks candidate declaration output, and
returns classes, generated CSS, validation statuses and `remainingCss`. It does
not rewrite files. `verification.declarations` checks output correspondence, not
CSS value validity; use the separate validation results for that.

- A `suggested` result is an authoring proposal. Moving declarations between an
  inline style, stylesheet selector and utilities changes cascade context.
- A `preserved` result retains the entire block. Keep it in native CSS and read
  the explanation instead of repeatedly trying a smaller input to bypass it.
- Literal values stay literal. Equal values alone do not justify choosing a
  product token with unrelated meaning.
- Complex selectors, comments, escapes, resource URLs, custom-property declarations and
  potentially overlapping properties can remain CSS. The first version does
  not invert multi-declaration recipes or arbitrary stylesheets.

Use `mastercss_manifest_query`, `mastercss_suggest_syntax` and inspection if the
suggestion tool is unavailable. Do not invent a replacement converter in
JavaScript. Apply a small edit, lint it, and check its browser behavior.
