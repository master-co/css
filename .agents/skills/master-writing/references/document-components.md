# Document components

Choose the shared component by the reader's task. Import through explicit
`@master/internal-site/components/*.astro` paths and check the consuming site's
pinned version. The [document gallery](https://design.master.co/components/data-display)
and neighboring tooling, parameter and agent pages show the shared presentations.

| Content | Presentation |
| --- | --- |
| File and directory hierarchy | `ExplorerView` with nested `items` |
| Long setting names, defaults and explanations | `DocumentOptions`, or `DocumentOptionList` and `DocumentOptionEntry` for authored Markdown |
| API inputs with types and requirements | `DocumentParameters` |
| Secondary detail that may start collapsed | `DocumentDisclosure`; essential steps stay visible |
| Instructions copied into an agent or another tool | `DocumentPrompt`; preserve the complete clipboard text |
| Short two-column prose or syntax comparisons | `DocumentComparison` around the Markdown table |
| Short syntax tokens paired with native CSS | `DocumentCodeTable` |
| Verified source/result pairs or labeled diagnostics | `DocumentCodeExample` |
| Short related-link groups | `DocumentChoices`; large catalogs use the site's index |
| Short static ordered processes | `DocumentFlow` |

Ordinary Markdown already maps code fences, tables, inline code and callout
markers to shared renderers. Do not replace a valid fence with explicit `Code`
markup merely to use a component. Multi-column matrices remain tables with
bounded keyboard-accessible scrolling. Instructions containing commands or
source remain code examples; only copyable prose prompts use `DocumentPrompt`.

Keep one authored data source. Search and Markdown must retain displayed labels,
names, defaults, links, heading depth, code and hierarchy. Check the consumer's
adapter before introducing a component; do not silently omit it or substitute a
fixed example from another article. Changes to props need matching export checks.

Review the affected content at narrow and wide widths in both themes. Exercise
disclosures by keyboard and verify copied text, including line breaks. For a
site-wide review, enumerate the current routes from the build or route registry;
historical review ledgers are evidence, not a current coverage list.
