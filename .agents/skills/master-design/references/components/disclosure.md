# Disclosure and panels

Hiding information reduces the visible amount, but can increase search and memory demands. Begin with ordinary visible sections when people need to read sequentially or compare content.

## Choose what can be hidden

| Need | Suitable starting point | Cost to check |
| --- | --- | --- |
| Essential instructions or comparison | Visible sections with headings | Length and scanning |
| Optional local detail | Disclosure button or native details | Discoverability and retained state |
| Several independent optional sections | Accordion; allow multiple open when comparison matters | Repeated opening and hidden errors |
| Peer views in a stable task | Tabs with associated panels | Activation latency and hidden edits |
| Distinct destination or substantial task | Another page with a real URL | Return context and task continuity |

Do not hide a prerequisite simply to shorten the page. A set of filter buttons is not automatically a tablist. An accordion's one-open rule is a choice, not a requirement. See [GOV.UK accordion guidance](https://design-system.service.gov.uk/components/accordion/).

## Define expansion and activation

Expose expanded state and the controlled region for a custom disclosure; native details already provides its contract. Ordinary disclosures normally keep focus on the trigger. Tabs require the complete tab/tabpanel relationship and keyboard model. Automatic activation is appropriate only when panel presentation has no noticeable latency; otherwise let arrow keys move focus and Enter/Space activate. Follow [APG tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

When an operation hides the currently focused control, move focus deliberately to a surviving trigger or logical location. Do not move it just because new optional content became visible. Never leave focus inside an inert or removed panel.

## Preserve work and discovery

Keep entered values when switching panels unless the task explicitly discards them. Reveal the section containing a validation error before directing focus there. If panels have shareable URLs, restore the correct panel on direct load and Back without inventing redundant history entries.

Browser find and print support differ for hidden/unmounted content. Test the actual implementation; provide an expanded reading/print view when discovery requires it. Do not assume a collapsed heading makes its contents searchable.

## Verify

Compare the same content visible and collapsed. Use keyboard, first touch, a slow panel, a long label, hidden invalid input and a return from another page. A short, readable group should remain visible when hiding it adds effort without benefit.
