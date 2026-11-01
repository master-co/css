export const monorepoIllustration = {
  title: 'Share a source, keep two project contexts',
  alt: 'The admin and shop projects both import styles/shared.css. Each project overrides color-primary in its own index.css. The same bg-primary class resolves to purple in admin and teal in shop, without one override leaking into the other.',
  caption: 'An import shares definitions. Each app still owns its entry, overrides, source selection and generated output.',
  labels: { source: 'styles/shared.css', shared: '--color-primary: #123456', admin: 'projects/admin', shop: 'projects/shop', entry: 'index.css', token: '--color-primary', adminValue: '#4f46e5', shopValue: '#0f766e', usage: 'bg-primary', output: 'Own compiled output', independence: 'A local override stays inside its app' },
  description: [
    { title: 'Share definitions', text: 'Both application entries import styles/shared.css.' },
    { title: 'Admin context', text: 'projects/admin/index.css overrides color-primary with #4f46e5. Its bg-primary class uses that purple value.' },
    { title: 'Shop context', text: 'projects/shop/index.css overrides color-primary with #0f766e. Its bg-primary class uses that teal value independently.' }
  ]
} as const
export function monorepoIllustrationMarkdown() {
  return `**${monorepoIllustration.title}**\n\n${monorepoIllustration.description.map(item => `- **${item.title}.** ${item.text}`).join('\n')}\n\n${monorepoIllustration.caption}`
}
