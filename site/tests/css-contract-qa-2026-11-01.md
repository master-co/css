# CSS contract refresh, 2026-11-01

## Refresh {#refresh}

The committed snapshot dated from `095ce731d` and no longer matched `rc`. This refresh records the output of `rc` at `76b80ebb9` plus the follow-up commits on `design/followups`. It was approved in the 2026-11-01 refactor session ("全做").

### Drift already on rc (`095ce731d` → `76b80ebb9`)

Nine commits since the old snapshot changed site output:

- `dacbf69eb` rebuilt the Reference as structured sheets.
- `85f210253` consolidated the Guide into task pages.
- `acac92606` made fixed values static utilities and renamed the gap axes.
- `d58b586e4` shared the typed Manifest v6 model.
- The rest were site polish and tooling commits: `d782e8f91`, `9e6842f95`, `5571a4496`, `4206fd97e` and `d962c7452`.

| Change | Count |
| --- | --- |
| Routes removed (mostly consolidated `/guide/installation/*`, `/tw/guide/*` and `/tw/reference/*` pages) | 148 |
| Routes added (Reference sheets and consolidated guides) | 24 |
| Shared routes with a different CSS contract | 221 |

The project manifest also changed for the same reasons: `radius-pill` became the static `pill` utility, and the spacing and direct-value families moved.

### This change set

Compared against a build of `76b80ebb9` with the same toolchain, the delta is fully attributed. Preset shadow values were substituted before comparing.

- Four delivered CSS segments that hold preset `--shadow-*` values now carry the converged shadows.
- `/design-system/review/comparison` and `/design-system/review/label` (and their `/tw` copies) list every shadow token. They gain `--shadow-inset` and `.shadow-inset`.
- The manifest gains the converged shadow values, `--shadow-inset` and eleven `--max-*` custom media. Keyframe ids change their file-hash prefix because `theme.css` changed; their offsets are unchanged.
- `@max-md` and the new lint examples appear only in documentation code, not in delivered site CSS.

### Visual check

The routes below were captured from the static build at 1280px in light and dark:

- `/`
- `/guide/introduction`
- `/guide/responsive-design`
- `/guide/code-linting`
- `/reference/tokens/shadow`: Values lists `shadow-inset`, and the Usage preview shows the converged `shadow-xs` and `shadow-lg`.
- `/reference/tokens/breakpoints`: the new "Below viewport widths" group.
- `/design-system/review/comparison`

No layout regressions were seen. The rc drift above was reviewed by its own commits; it is recorded here, not re-reviewed page by page.
