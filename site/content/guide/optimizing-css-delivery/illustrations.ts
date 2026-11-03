/** One source for figure meaning, article descriptions, search and portable output. */
export const deliveryIllustrations = {
  ownership: {
    title: 'Move the import, change the delivery path',
    alt: 'Before and after import graphs for Overview and Reports.',
    caption: 'The reports entry owns the feature import. Shared navigation still reaches both pages; report rules reach only Reports. Blocks denote rule groups, not measured bytes.',
    description: [
      { title: 'Common import', text: 'When main.js imports navigation and report styles, both Overview and Reports receive both groups even though Overview has no report markup.' },
      { title: 'Local import', text: 'Move reports.css to reports.js. Both pages retain the common entry; only Reports loads reports.js and receives the report rules.' }
    ]
  },
  evidence: {
    title: 'A known class retains its later selector states',
    alt: 'Complete report class names feed pruning; unknown external names lead to preservation.',
    caption: 'The evidence is the possible class set, not a screenshot of the initial DOM. A safelist can complete a bounded external set; an unknown set needs preservation.',
    description: [
      { title: 'Known usage', text: 'The report markup and complete idle/ready map supply report, report-idle and report-ready. A scanner-backed build retains their rules, including report[data-state="ready"] and report:focus-visible.' },
      { title: 'Unknown usage', text: 'Unbounded CMS classes cannot be proven absent from a source scan. Preserve their owning native stylesheet and load it where the CMS content can appear.' }
    ]
  },
  dimensions: {
    title: 'Rendering and native pruning are independent choices',
    alt: 'A matrix compares static and progressive rendering against preserved and pruned native CSS.',
    caption: 'Both columns can serve initial CSS. The progressive row additionally supports later utilities; pruning changes eligible native output, not the rendering mode.',
    description: [
      { title: 'Native policy', text: 'Preservation keeps native rules. A supported pruning path filters eligible native rules against its known usage set. The matrix illustrates policy, not a guarantee that every integration path supplies that set.' },
      { title: 'Rendering mode', text: 'Static rendering does not generate new browser rules. Progressive rendering serves initial CSS and can generate later valid utilities in either native-policy column.' },
      { title: 'Boundary', text: 'Runtime generation does not restore arbitrary removed native selectors. Managed keyframes follow their separate definition and dependency contract.' }
    ]
  },
  verification: {
    title: 'A smaller output needs a behavior check',
    alt: 'Asset comparison and interaction checks converge before a project budget is saved.',
    caption: 'The two checks establish different facts. A missing feature can make a file smaller, so byte savings alone cannot pass the change.',
    description: [
      { title: 'Output evidence', text: 'Compare Overview and Reports with the same build and compression method. Trace external imports and inline CSS; record files, depth, bytes and cache reuse.' },
      { title: 'Behavior evidence', text: 'Open both routes directly, navigate between them, and exercise ready, focus, theme and responsive states. For progressive pages, verify initial CSS and a new runtime utility separately.' },
      { title: 'Budget', text: 'Save project-specific ceilings only after the intended delivery change and preserved behavior are both verified. Timing samples remain separate from deterministic byte limits.' }
    ]
  }
} as const
export type DeliveryIllustrationId = keyof typeof deliveryIllustrations
export function deliveryIllustrationMarkdown(id: string) {
  const figure = deliveryIllustrations[id as DeliveryIllustrationId]
  if (!figure) throw new Error(`Unknown delivery illustration: ${id}`)
  return `**${figure.title}**\n\n${figure.description.map(item => `- **${item.title}.** ${item.text}`).join('\n')}\n\n${figure.caption}`
}
