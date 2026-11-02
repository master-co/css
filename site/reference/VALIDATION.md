# Reference validation

Local working-tree validation for the 2026-11-02 Reference refactor. This records source and browser checks, not a production deployment or observed user study.

## Scope

The catalog has 32 articles: seven Syntax, twelve Tokens, four Utilities, six Directives and three tool/package catalogs. Query definitions is a deliberate new boundary. Removed pages have no redirects. Guide retains task workflows and links to the current Reference owner.

Every article includes at least one authored explanatory image, with editable source, light/dark paint and a text equivalent in search and portable output. Complete useful scales and examples remain, including real-size typography and animation playback. Preview controls are present only when they teach the subject.

A final static audit checked all 64 localized article routes, their figure assets and 2,056 Guide/Reference links and anchors with no failures.

The shared catalog supplies navigation, search, per-page Markdown, grouped text, structured discovery and llms content. The Reference index also has English and Traditional Chinese `/reference.md` exports. Tool schemas and full API declarations remain in installed interfaces and linked source; the site explains selection, inputs and effects.

## Automated checks

| Check | Result |
| --- | --- |
| Reference | 27 passing checks: source coverage, search, examples, figures, links, owner boundaries, route payloads, highlights, exports and overview parity |
| Documentation examples | 30 passing checks, including all five complete stylesheet examples and live CLI/MCP fixtures |
| Portable content | 34 passing checks |
| MDX imports | 2 passing checks |
| Site TypeScript | Passed |
| Site lint | Zero errors; 81 existing warnings outside the new article work |
| Astro production build | 241 routes built successfully |
| AI/source budgets | Passed |
| Full-site CSS contract | Helper tests pass; route assertion stops at `/design-system` (see limitations) |
| Public asset gate | Two unchanged unused SVGs (see limitations) |

Independent temporary probes verify the illustrations' claims through public APIs: token retention/substitution, query expansion, whole-definition replacement, reference/import output, file and candidate policy, native pruning, actual utility geometry, preview identity and lifetime, CLI output and snapshots, and compiler/engine resource ownership.

The stylesheet-example check exposed a site presentation defect: native compiler output was omitted from result disclosures. The helper now combines compiler-owned native CSS with engine-generated CSS, and all five examples agree with an independent stylesheet compilation. Compiler semantics were not changed.

## Browser and visual review

Each article was inspected in light and dark themes, at desktop and narrow widths, with proportional figure sizing and intrinsic demo heights. Latest batch records:

- Typography: 48 normal width/locale/theme profiles and 16 enlarged-text profiles.
- Motion: 12 normal profiles and 20 shared typography/Motion reflow profiles; native playback, reduced motion and overshoot bounds verified.
- Utilities: 48 normal profiles, 16 reflow profiles, 24 focused reruns after layout corrections and four final Truncation disclosure checks.
- Directives: 72 normal profiles and 24 reflow profiles, including navigation/search, anchors, source/result disclosures and figure text descriptions.
- Tools and packages: 36 normal profiles and 12 enlarged-text profiles; the overview adds 12 category/A–Z profiles. All catalog entries, headings, manual theme selection and search destinations verified.

Normal profiles use 390, 768 and 1440px widths and English/Traditional Chinese routes as applicable. Reflow checks use 320/390px and 100/200% root text size; this is enlarged text, not a claim of browser-zoom equivalence. Raster figures scale proportionally; their independent HTML descriptions retain the full lesson on small screens.

## Remaining limitations

- The public-asset gate reports unused `images/contents.svg` and `images/search.svg`; these unrelated assets are unchanged.
- The footer’s Trademark Policy link extends approximately 10px at 320px with 200% root text. Article content is checked separately; no claim of whole-site enlarged-text conformance is made.
- The full-site CSS contract check stops at `/design-system`: its assertion expects a `--color-text-strong` declaration that the built route does not contain. This route is outside the edited article scope; the check and snapshot were not weakened or updated. The two CSS-variable parser helper tests pass.
- Lint retains the existing 81 warnings.
- Browser role/name checks are not a screen-reader user study or accessibility certification. Semantic and visual walkthroughs are not measured novice comprehension.

Run the scripts described in [MAINTENANCE.md](MAINTENANCE.md) when changing authored sources. Update this record to match actual results; do not retain obsolete document counts or historical framework warnings.
