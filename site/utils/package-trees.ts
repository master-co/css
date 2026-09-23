import type { DocumentFileEntry, DocumentFileTreeProps } from '../components/DocumentFileTree'

export const packageTrees = {
  monorepo: {
    title: 'Independent applications, shared vocabulary',
    entries: [
      { name: 'projects', children: [
        { name: 'admin', children: [
          { name: 'package.json', description: 'Declares Master CSS dependencies' },
          { name: 'index.css', description: 'Admin entry and local overrides' }
        ] },
        { name: 'shop', children: [
          { name: 'package.json', description: 'Declares Master CSS dependencies' },
          { name: 'index.css', description: 'Shop entry' }
        ] }
      ] },
      { name: 'index.css', description: 'Shared tokens and components' },
      { name: 'package.json', description: 'Repository scripts and workspace tooling' }
    ],
    caption: 'Each app has a project root. Both import the same shared CSS source.'
  },
  authoring: {
    title: 'A CSS source package',
    entries: [{ name: 'ui-theme', children: [
      { name: 'package.json', description: 'Public stylesheet entry' },
      { name: 'master.css', description: 'Tokens, variants, utilities and components' },
      { name: 'README.md', description: 'Usage and compatibility contract' }
    ] }],
    caption: 'The consuming app compiles the source with its own Master CSS entry.'
  }
} as const satisfies Record<string, DocumentFileTreeProps>

export type PackageTreeName = keyof typeof packageTrees

export function fileTreeText(entries: readonly DocumentFileEntry[], prefix = ''): string {
  return entries.map((entry, index) => {
    const last = index === entries.length - 1
    const line = `${prefix}${last ? '└──' : '├──'} ${entry.name}${entry.children ? '/' : ''}${entry.description ? ' — ' + entry.description : ''}`
    return entry.children ? line + '\n' + fileTreeText(entry.children, prefix + (last ? '    ' : '│   ')) : line
  }).join('\n')
}

export function packageTreeMarkdown(name: string) {
  const tree = packageTrees[name as PackageTreeName]
  if (!tree) throw new Error(`Unknown package tree: ${name}`)
  return `**${tree.title}**\n\n\`\`\`text\n${fileTreeText(tree.entries)}\n\`\`\`\n\n${tree.caption}`
}
