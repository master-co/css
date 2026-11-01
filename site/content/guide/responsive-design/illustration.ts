export const responsiveIllustration = {
  title: 'One viewport, two component widths',
  alt: 'In one page, the same summary receives a 448px container in the main column and a 160px container in the sidebar. Its two tracks appear only in the main column, where the container reaches the 28rem threshold.',
  caption: 'At a 16px root size, 28rem is 448px. These are actual container widths: the wide summary has two tracks, while the narrow summary stacks inside the same viewport.',
  labels: { page: 'One page viewport', main: 'Main · 448px', side: 'Sidebar · 160px', card: 'Release notes', detail: 'Draft ready', project: 'Project', status: 'Status', query: 'grid-cols(2)@container(--md)', base: 'Base: grid-cols(1)', rule: 'The ancestor’s available width decides' },
  description: [
    { title: 'Same viewport', text: 'Both cards are in the same page. A viewport breakpoint would see the same width for both.' },
    { title: 'Different containers', text: 'The main container is 448px wide and the sidebar container is 160px wide.' },
    { title: 'Local response', text: 'Each ancestor uses container-inline. The descendant card uses grid-cols(1) and grid-cols(2)@container(--md), so only the main card reaches the preset 28rem query.' }
  ]
} as const
export function responsiveIllustrationMarkdown() {
  return `**${responsiveIllustration.title}**\n\n${responsiveIllustration.description.map(item => `- **${item.title}.** ${item.text}`).join('\n')}\n\n${responsiveIllustration.caption}`
}
