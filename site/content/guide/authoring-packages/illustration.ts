/** One source package, independently requested utility output. */
export const packageIllustration = {
  title: 'Share definitions; compile for each app',
  alt: 'A shared master.css defines the native btn component and an on-demand content-auto utility. App A uses btn and emits the component. App B uses btn content-auto and also emits the requested utility.',
  caption: 'Both apps import the same CSS source. The native component is included by default; each app generates the utilities its own markup requests.',
  labels: {
    source: '@acme/ui-theme · master.css', native: '.btn { … }', utility: '@utility content-auto { … }',
    shared: 'Shared source', a: 'App A', b: 'App B', useA: 'class="btn"', useB: 'class="btn content-auto"',
    output: 'Compiled CSS', rule: '.content-auto { … }', build: 'Each app compiles its own entry'
  },
  description: [
    { title: 'Share source', text: 'The package defines a native .btn component and an on-demand content-auto utility.' },
    { title: 'App A', text: 'Its markup uses btn. The native component is included, but the unused content-auto utility is not emitted.' },
    { title: 'App B', text: 'Its markup uses btn and content-auto. Its output includes the native component and the requested utility.' }
  ]
} as const

export function packageIllustrationMarkdown() {
  return `**${packageIllustration.title}**\n\n${packageIllustration.description.map(item => `- **${item.title}.** ${item.text}`).join('\n')}\n\n${packageIllustration.caption}`
}
