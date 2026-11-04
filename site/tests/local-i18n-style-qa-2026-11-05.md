# Local multilingual CSS delivery review

The approved document bundle contained 163 rules and 399 declarations. The current build partitions the same rules and declarations into four assets, with no added declaration values: `Doc` (82 rules / 219 declarations), callout (15 / 42), disclosure (17 / 42), and prose (49 / 96). Three prose selectors recognize actual Astro server wrappers and the document comparison component.

The four assets replace one document asset on 73 routes retained in the previous artifact. The newer `/guide/optimizing-css-delivery` uses the same four assets. None is delivered to the homepage. Owners remain `DocArticle`, `ArticleHeader`, `PageContentDisclosure` and `PageNavs`; this preserves document component boundaries.

Separate response compression adds 1,632 gzip / 1,389 Brotli bytes for this partition alone. Changes in the remaining compressed assets bring each measured route increase to 1,570–1,579 gzip / 1,328–1,351 Brotli bytes. Each affected route adds exactly three files. The table records measured ceilings with no added margin; existing depth and inline-byte ceilings remain unchanged.

The shared audit checks actual external stylesheet SHA-256 sets and inline CSS SHA-256 against the English page before reusing its ceiling for a translated route. The 75 obsolete duplicate Taiwan ceilings were removed so every language uses one canonical budget. Any language-specific CSS difference still fails, including differences below a size ceiling.

| Canonical route | Files | Gzip bytes | Brotli bytes |
| --- | --- | --- | --- |
| /benchmarks | 16 → 19 | 31245 → 32815 | 26630 → 27958 |
| /guide | 14 → 17 | 27260 → 28839 | 23164 → 24500 |
| /guide/ai-coding | 23 → 26 | 34873 → 36445 | 29590 → 30937 |
| /guide/authoring-packages | 21 → 24 | 33240 → 34814 | 28223 → 29564 |
| /guide/cascade-layers | 20 → 23 | 32480 → 34055 | 27575 → 28915 |
| /guide/code-linting | 17 → 20 | 28690 → 30268 | 24330 → 25672 |
| /guide/colors | 22 → 25 | 34550 → 36121 | 29325 → 30672 |
| /guide/compatibility | 21 → 24 | 35261 → 36834 | 29988 → 31327 |
| /guide/global-styles | 21 → 24 | 33930 → 35503 | 28797 → 30145 |
| /guide/installation | 24 → 27 | 34936 → 36507 | 29630 → 30967 |
| /guide/installation/angular | 22 → 25 | 34866 → 36437 | 29631 → 30978 |
| /guide/installation/astro | 22 → 25 | 34866 → 36437 | 29631 → 30978 |
| /guide/installation/lit | 21 → 24 | 33416 → 34989 | 28409 → 29748 |
| /guide/installation/nextjs | 22 → 25 | 34866 → 36437 | 29631 → 30978 |
| /guide/installation/nuxtjs | 22 → 25 | 34866 → 36437 | 29631 → 30978 |
| /guide/installation/server-rendered | 23 → 26 | 35045 → 36616 | 29766 → 31113 |
| /guide/installation/storybook | 20 → 23 | 32214 → 33789 | 27355 → 28695 |
| /guide/installation/svelte | 22 → 25 | 34866 → 36437 | 29631 → 30978 |
| /guide/installation/vite | 23 → 26 | 35045 → 36616 | 29766 → 31113 |
| /guide/installation/webpack | 23 → 26 | 35045 → 36616 | 29766 → 31113 |
| /guide/introduction | 20 → 23 | 32480 → 34055 | 27575 → 28915 |
| /guide/language-service | 20 → 23 | 31212 → 32787 | 26449 → 27799 |
| /guide/layout-system | 22 → 25 | 34139 → 35712 | 28959 → 30307 |
| /guide/migration | 20 → 23 | 30869 → 32444 | 26160 → 27509 |
| /guide/migration/bootstrap | 17 → 20 | 28730 → 30308 | 24366 → 25708 |
| /guide/migration/css-in-js | 18 → 21 | 30180 → 31756 | 25588 → 26938 |
| /guide/migration/css | 20 → 23 | 32520 → 34095 | 27611 → 28951 |
| /guide/migration/material-ui | 19 → 22 | 30359 → 31935 | 25723 → 27073 |
| /guide/migration/sass | 19 → 22 | 30359 → 31935 | 25723 → 27073 |
| /guide/migration/tailwindcss | 19 → 22 | 30359 → 31935 | 25723 → 27073 |
| /guide/monorepo | 18 → 21 | 29450 → 31027 | 24978 → 26321 |
| /guide/optimizing-css-delivery | 20 → 23 | 31079 → 32654 | 26335 → 27686 |
| /guide/rendering-modes | 20 → 23 | 31521 → 33095 | 26741 → 28090 |
| /guide/responsive-design | 23 → 26 | 37331 → 38902 | 31756 → 33103 |
| /guide/reusing-styles | 22 → 25 | 34109 → 35682 | 28932 → 30280 |
| /guide/route-level-styles | 21 → 24 | 33240 → 34814 | 28223 → 29564 |
| /guide/scanning-and-pruning | 17 → 20 | 28690 → 30268 | 24330 → 25672 |
| /guide/syntax-tutorial | 22 → 25 | 34109 → 35682 | 28932 → 30280 |
| /guide/theme | 21 → 24 | 33930 → 35503 | 28797 → 30145 |
| /guide/typography | 20 → 23 | 32480 → 34055 | 27575 → 28915 |
| /guide/view-transitions | 23 → 26 | 34318 → 35891 | 29094 → 30442 |
| /reference | 15 → 18 | 27762 → 29341 | 23577 → 24913 |
| /reference/direct-values | 23 → 26 | 36957 → 38530 | 31407 → 32755 |
| /reference/directives/definitions | 23 → 26 | 36637 → 38210 | 31110 → 32458 |
| /reference/directives/imports | 23 → 26 | 36637 → 38210 | 31110 → 32458 |
| /reference/directives/pruning | 23 → 26 | 36637 → 38210 | 31110 → 32458 |
| /reference/directives/queries | 23 → 26 | 36637 → 38210 | 31110 → 32458 |
| /reference/directives/scanning | 23 → 26 | 36637 → 38210 | 31110 → 32458 |
| /reference/directives/theme | 23 → 26 | 36637 → 38210 | 31110 → 32458 |
| /reference/grid-tracks | 23 → 26 | 37013 → 38586 | 31459 → 32807 |
| /reference/packages | 23 → 26 | 36637 → 38210 | 31110 → 32458 |
| /reference/rules/conditions | 23 → 26 | 36637 → 38210 | 31110 → 32458 |
| /reference/rules/declarations | 23 → 26 | 36637 → 38210 | 31110 → 32458 |
| /reference/rules/extraction | 23 → 26 | 36637 → 38210 | 31110 → 32458 |
| /reference/rules/layers | 23 → 26 | 36637 → 38210 | 31110 → 32458 |
| /reference/rules/modes | 23 → 26 | 36637 → 38210 | 31110 → 32458 |
| /reference/rules/named-conditions | 23 → 26 | 36918 → 38491 | 31379 → 32727 |
| /reference/rules/selectors | 23 → 26 | 36637 → 38210 | 31110 → 32458 |
| /reference/sr-only | 23 → 26 | 36945 → 38518 | 31385 → 32733 |
| /reference/tokens/color-roles | 25 → 28 | 40337 → 41907 | 34287 → 35633 |
| /reference/tokens/color | 25 → 28 | 40301 → 41871 | 34265 → 35611 |
| /reference/tokens/container | 25 → 28 | 40370 → 41940 | 34314 → 35660 |
| /reference/tokens/families | 25 → 28 | 39884 → 41454 | 33874 → 35220 |
| /reference/tokens/font | 25 → 28 | 40089 → 41659 | 34073 → 35419 |
| /reference/tokens/leading | 25 → 28 | 39998 → 41568 | 33992 → 35338 |
| /reference/tokens/motion | 25 → 28 | 40337 → 41907 | 34294 → 35640 |
| /reference/tokens/radius | 25 → 28 | 40495 → 42065 | 34441 → 35787 |
| /reference/tokens/shadow | 25 → 28 | 40504 → 42074 | 34436 → 35782 |
| /reference/tokens/spacing | 25 → 28 | 40289 → 41859 | 34243 → 35589 |
| /reference/tokens/text | 25 → 28 | 40007 → 41577 | 33993 → 35339 |
| /reference/tokens/tracking | 25 → 28 | 40028 → 41598 | 34011 → 35357 |
| /reference/tools/cli | 23 → 26 | 36637 → 38210 | 31110 → 32458 |
| /reference/tools/mcp | 23 → 26 | 36637 → 38210 | 31110 → 32458 |
| /reference/truncation | 23 → 26 | 37172 → 38745 | 31625 → 32973 |

Evidence: `site/.cache/style-delivery.json`, `/tmp/master-local-i18n/css-style-classification.json` and `/tmp/master-local-i18n/css-style-budget-approved.json`. Independent classification compared the previous approved bundle with actual current CSS, including rule and ordered declaration totals.

The final Japanese/Korean word-boundary rule adds 22 gzip bytes to the shared hero stylesheet. The homepage gzip ceiling moves from 63,144 to the measured 63,147 bytes after absorbing the prior 19-byte margin. Files (10), depth (1), inline bytes (13,266) and the existing Brotli ceiling (49,554; actual 49,549) are unchanged. All five homepage editions deliver identical CSS.
