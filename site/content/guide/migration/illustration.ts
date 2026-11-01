/** One converted screen still shares the app's CSS with screens outside the batch. */
export const migrationIllustration = {
  title: 'Convert one screen; check the shared CSS surface',
  alt: 'One shared CSS entry connects to Account, Billing and Reports. Only Account is marked as the conversion batch; all three belong to the verification scope.',
  caption: 'In this app, all three screens load the same stylesheet entry. Converting Account does not isolate changes to shared resets, tokens or selectors from Billing and Reports.',
  labels: {
    entry: 'Shared CSS entry',
    existing: 'Existing styles',
    master: 'Master CSS',
    connection: 'Loaded by all three screens',
    account: 'Account',
    billing: 'Billing',
    reports: 'Reports',
    converted: 'First conversion batch',
    retained: 'Existing styling retained',
    verify: 'Verify all three screens'
  },
  description: [
    { title: 'One shared entry', text: 'The example app loads its existing styles and Master CSS through a shared CSS entry used by Account, Billing and Reports.' },
    { title: 'One conversion batch', text: 'Only Account is being converted. Billing and Reports still depend on their existing styles.' },
    { title: 'A wider verification scope', text: 'Check all three screens when setup or shared definitions change. A component-sized edit does not make the stylesheet component-scoped, and the old dependency remains needed by the other screens.' }
  ]
} as const

export function migrationIllustrationMarkdown() {
  return `**${migrationIllustration.title}**\n\n${migrationIllustration.description.map(item => `- **${item.title}.** ${item.text}`).join('\n')}\n\n${migrationIllustration.caption}`
}
