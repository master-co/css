export const lintIllustration = {
  title: 'Fix formatting; choose meaning',
  alt: 'Two lint outcomes. Sorting p-md flex flex automatically produces flex p-md, removing the duplicate. A raw font-size of 15px remains unchanged: a person must choose a token or allow the value.',
  caption: 'An automatic fix can reorder and deduplicate classes. A raw-value warning cannot choose the design role on your behalf.',
  labels: { automatic: 'Automatic fix', before: 'p-md flex flex', after: 'flex p-md', fix: 'Sort + deduplicate', review: 'Author decision', raw: '(font-size:15px)', unchanged: 'Value stays unchanged', choose: 'Choose a token', allow: 'or allow the value', policy: 'With raw-value policy enabled' },
  description: [
    { title: 'Safe formatting', text: 'sort-classes changes p-md flex flex to flex p-md. The duplicate disappears without changing the generated declarations.' },
    { title: 'Design decision', text: 'With no-unapproved-raw-values enabled, (font-size:15px) can produce a warning. It has no automatic fix: choose a semantic token or explicitly allow that value.' }
  ]
} as const
export function lintIllustrationMarkdown() {
  return `**${lintIllustration.title}**\n\n${lintIllustration.description.map(item => `- **${item.title}.** ${item.text}`).join('\n')}\n\n${lintIllustration.caption}`
}
