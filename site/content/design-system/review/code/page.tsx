import metadata from './metadata'
import ComponentPage from '../../components/ComponentPage'
import ComponentDocumentation from './content.mdx'
import CodeTabs from '~/site/docs-shell/components/CodeTabs'
import { projectStyleExample } from '~/site/components/demo/project-style-examples'
export { metadata }

export default function Page() {
  const example = projectStyleExample('tokens')
  return <ComponentPage kicker="Documents" title="Code windows" description="One source window with named tabs, a fitted selection and an accessible copy action." sections={[
    { id: 'code-current', title: 'The complete source', children: <CodeTabs>{[{ name: 'collection.html', lang: 'html', code: example.html, beautify: true }, { name: 'theme.css', lang: 'css', code: example.source }]}</CodeTabs> },
    { id: 'code-languages', title: 'One palette across languages', description: 'Keywords, names, properties and values keep the same visual roles in light and dark. Comments stay quiet and readable.', children: <CodeTabs>{[
      { name: 'Card.tsx', lang: 'tsx', code: `// A small, reusable component\ntype CardProps = { title: string; featured?: boolean }\n\nexport function Card({ title, featured = false }: CardProps) {\n  const count = 3\n  return (\n    <article className="p-lg r-lg bg-surface-raised">\n      <h2>{title}</h2>\n      <p data-featured={featured}>{count} new ideas</p>\n    </article>\n  )\n}` },
      { name: 'settings.json', lang: 'json', code: `{\n  "name": "Collection",\n  "featured": true,\n  "limit": 12,\n  "tags": ["design", "development"],\n  "cursor": null\n}` },
      { name: 'Terminal', lang: 'bash', code: `# Build and preview the project\npnpm run build\npnpm run preview -- --host "localhost"` },
      { name: 'Classes', lang: 'mcss', code: `flex gap-md p-lg\nfg-text-strong bg-surface-raised\nfg-text-blue:hover@sm\npadding:1rem (width:calc(100%-2rem))` }
    ]}</CodeTabs> },
  ]} usage={{ href: '/guide/theme', label: 'the Theme guide' }} Documentation={ComponentDocumentation} />
}
