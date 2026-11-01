# Site design system: Moonstone / Obsidian

The site's interface vocabulary. Light mode is moonstone (cool pearl), dark mode is obsidian (volcanic glass). The homepage may compose its own layouts but uses these tokens.

## Files

| File | Scope | Loaded |
| --- | --- | --- |
| `tokens.css` | `--ui-*` roles: surfaces, lines, text, light, elevation, radius, rhythm, motion, tones, status, code | global |
| `surfaces.css` | `ui-sheet`, `ui-well`, `ui-tray`, `ui-stage`, `ui-compare`, `ui-browser`, `ui-scroll` | global |
| `controls.css` | `ui-button`, `ui-segmented`, `ui-field`, `ui-input`, `ui-select`, `ui-range`, `ui-check`, `ui-switch`, `ui-copy`, `ui-kbd`, `ui-tooltip`, `ui-menu` | global |
| `code.css` | `ui-code`, `ui-tabs`, `ui-inline-code`, `ui-disclosure`, `ui-prompt`, `ui-tree` | global |
| `prose.css` | `ui-callout` and the article flow helpers | global |
| `shell.css` | `ui-header`, `ui-sidebar`, `ui-nav-group`, `ui-nav-link`, `ui-toc`, `ui-pagehead`, `ui-pager`, `ui-dialog`, `ui-results` | global |
| `specimens.css` | `ui-item`, `ui-badge`, `ui-label`, `ui-legend`, `ui-measure`, `ui-leader`, `ui-axes`, `ui-swatch`, `ui-palette`, `ui-spacing`, `ui-player` | imported by the components that use it |
| `data.css` | `ui-table`, `ui-metrics`/`ui-metric`, `ui-bar`, `ui-source`, `ui-params`, `ui-steps`, `ui-index`, `ui-chart`, `ui-waterfall` | imported by the components that use it |

The approved visual specification is the published "Master CSS Site Design System：Moonstone" artifact.

## Rules

1. **Monochrome interface.** Chrome uses ink and pearl only. Hue appears in teaching specimens (`--ui-tone-*`, always named by a legend or label) and status (`--ui-status-*`). Brand gold (`data-variant="gold"`) belongs to the homepage and the brand page, one gold focus per view.
2. **One material ladder.** canvas → tray → stage → sheet → float; a well sits below its surroundings. Never invent a surface color.
3. **Elevation order.** sink < flat < rise-1 < rise-1h < rise-2 < rise-3 < overlay. Hover lifts 0.5px to rise-1h; press sinks to the well. Do not express state by changing hue.
4. **Concentric radii.** 4 / 6 / 10 / 14 / 18 / 24 with a 6px tray inset: tray 24 → stage, code and sheet 18; track 12 → thumb 9.
5. **Converged shadows.** Every layer doubles offset and blur and pulls its spread in by half the offset. No single large blur.

## Markup

| Layer | Convention |
| --- | --- |
| Root | One class per component, prefixed `ui-` |
| Part | `ui-<component>-<part>`, used only inside that component |
| Variant | Fixed vocabulary on data attributes: `data-variant`, `data-size`, `data-tone`, `data-elevation`, `data-background`, `data-padding`, `data-density`, `data-shape` |
| State | Native pseudo-classes and ARIA: `aria-pressed`, `aria-selected`, `aria-current`, `aria-checked`, `[open]`, `:checked`, `:disabled`. `data-state` only to show a static state in documentation; `data-result` for an action's outcome |
| Tokens | `--ui-*` roles; never raw palette steps in component CSS |
| Utilities | Master CSS classes compose layout inside content and specimens. They do not paint components, and shell components do not carry long utility lists |
| React | Components map one-to-one to classes; props only become data attributes |

Content and example markup keep teaching the preset vocabulary (`bg-surface-raised`, `shadow-lg`, …); `--ui-*` tokens are deliberately not utility tokens.
