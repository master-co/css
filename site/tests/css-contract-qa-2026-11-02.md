# CSS contract review, 2026-11-02

## Guide and Reference consolidation {#guide-and-reference-consolidation}

The user authorized resolving the outstanding validation failures after committing the Reference consolidation (`3b6a0aa01`). This review refreshes the historical snapshot against the current tested workspace, including the pre-existing shell and illustration refinements. Those pre-existing source edits remain untouched by this task.

The old snapshot recorded 244 routes and 123 delivery contracts. The current build records 241 routes and 121 contracts. The project manifest is byte-for-byte unchanged after repository-relative source normalization: this refresh does not approve an engine, preset, schema or compiler behavior change.

Nine historical routes disappear: the responsive-gallery example, the three obsolete installation children in both locales, and the breakpoints Reference in both locales. Six routes are added: Reusing styles, Query definitions and Named conditions in both locales. These are the authorized documentation consolidations; redirects are not restored.

The reviewed CSS diff adds 240 segments and removes 212 before the final caption-wrap adjustment. The changes are attributable to:

- The committed Guide/Reference consolidation: new directory/index layouts, full token specimens, integration covers and text descriptions; obsolete gallery and delivery-tab rules disappear.
- The previously edited shared shell: contents-rail behavior, disclosure presentation, expanded document surfaces and reading rhythm. These were included in the browser regression run; this task does not stage or overwrite their source changes.
- Exact-value site UI substitutions: rem spacing and size values become existing token references; `460` becomes `--ui-weight-medium`; `0.2s` becomes `--duration-normal`; common max-width caps use their existing container tokens. A square avatar uses the preset `pill` utility and retains its circular appearance.
- Two intentional reflow repairs: the footer's two-column override starts at 18rem of container width, and tray captions allow long identifiers to wrap. Neither repair clips content.

The `/design-system` assertion previously required `--color-text-strong` despite its current overview using `--ui-text-strong` through native components and isolated previews. The check now requires the actual `--ui-text-strong`, `--ui-surface-sheet` and existing `--spacing-lg` declarations. All existing route stylesheet inclusion/exclusion assertions remain enabled, and the generated HTML passes them. The historical labels now accurately identify language version 18 and the Manifest v6 CSS-first baseline.

The refreshed snapshot captures every exact delivered CSS segment, per-route segment order, hydration contract and project manifest. It is not a reduced or pattern-only snapshot. The final validation record is in [Guide illustration QA](guide-illustration-qa-2026-11-02.md).
