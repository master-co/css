import metadata from './metadata'
import ReviewNavigation from '../../components/ReviewNavigation'
import ComponentDocumentation from './content.mdx'
import CodeTabs from '~/site/docs-shell/components/CodeTabs'
import { projectStyleExample } from '~/site/components/demo/project-style-examples'
export { metadata }

export default function Page() {
  const example = projectStyleExample('tokens')
  return <main className="ds-component-page">
    <ReviewNavigation />
    <h1>Code windows</h1>
    <p>One source window with named tabs, a fitted selection and an accessible copy action.</p>
    <section aria-labelledby="code-current"><h2 id="code-current">The complete source</h2>
      <CodeTabs>{[{ name: 'collection.html', lang: 'html', code: example.html, beautify: true }, { name: 'theme.css', lang: 'css', code: example.source }]}</CodeTabs>
    </section>
    <section aria-labelledby="code-languages"><h2 id="code-languages">One palette across languages</h2>
      <p>Keywords, names, properties and values keep the same visual roles in light and dark. Comments stay quiet and readable.</p>
      <CodeTabs>{[
        { name: 'Card.tsx', lang: 'tsx', code: `// A small, reusable component\ntype CardProps = { title: string; featured?: boolean }\n\nexport function Card({ title, featured = false }: CardProps) {\n  const count = 3\n  return (\n    <article className="p-lg r-lg bg-surface-raised">\n      <h2>{title}</h2>\n      <p data-featured={featured}>{count} new ideas</p>\n    </article>\n  )\n}` },
        { name: 'settings.json', lang: 'json', code: `{\n  "name": "Collection",\n  "featured": true,\n  "limit": 12,\n  "tags": ["design", "development"],\n  "cursor": null\n}` },
        { name: 'Terminal', lang: 'bash', code: `# Build and preview the project\npnpm run build\npnpm run preview -- --host "localhost"` },
        { name: 'Classes', lang: 'mcss', code: `display:flex gap-md p-lg\nfg-text-strong bg-surface-raised\nfg-text-blue:hover@sm\npadding:1rem width:calc(100%-2rem)` }
      ]}</CodeTabs>
    </section>
    <section className="ds-component-api prose" aria-labelledby="component-interface"><h2 id="component-interface">Usage and interface</h2><ComponentDocumentation /></section>
  </main>
}
