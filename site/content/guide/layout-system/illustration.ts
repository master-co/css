export const layoutIllustration = {
  title: 'Coordinate item spans with the grid',
  alt: 'An eight-column grid has a header spanning all eight columns, two metrics spanning four columns each, and a final row split into a five-column demand region and a three-column task region.',
  caption: 'The wide layout uses eight equal tracks. Each row accounts for those tracks: 8, 4 + 4, then 5 + 3. Gutters sit between the tracks.',
  labels: { grid: 'grid-cols(8)', header: 'Header · span 8', revenue: 'Revenue · span 4', activation: 'Activation · span 4', demand: 'Demand · span 5', tasks: 'Tasks · span 3', footer: 'Change the column count and item spans together' },
  description: [
    { title: 'One grid', text: 'The wide composition uses grid-cols(8), with the same gap between each pair of tracks.' },
    { title: 'Full and shared rows', text: 'The header spans eight tracks. Each metric spans four. The demand and task regions span five and three.' },
    { title: 'Adapt together', text: 'When a breakpoint changes the grid’s column count, update the spans that depend on it at the same breakpoint.' }
  ]
} as const
export function layoutIllustrationMarkdown() {
  return `**${layoutIllustration.title}**\n\n${layoutIllustration.description.map(item => `- **${item.title}.** ${item.text}`).join('\n')}\n\n${layoutIllustration.caption}`
}
