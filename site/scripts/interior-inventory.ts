import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import fg from 'fast-glob'
import { createStaticPaths, sectionOf } from '../astro/route-paths'

const siteRoot = fileURLToPath(new URL('../', import.meta.url))
const contentRoot = path.join(siteRoot, 'content')
const pageFiles = await fg('**/page.tsx', { cwd: contentRoot, onlyFiles: true })
const paramsFiles = await fg('**/params.ts', { cwd: contentRoot, onlyFiles: true })
const providers = Object.fromEntries(paramsFiles.map(file => [`/content/${file}`, () => import(pathToFileURL(path.join(contentRoot, file)).href)]))
const paths = await createStaticPaths(pageFiles.map(file => `/content/${file}`), providers)
interface AuditRoute {
  pathname: string
  locale: string
  section: ReturnType<typeof sectionOf> | 'not-found'
  source: string
  expectedStatus: number
  purpose: string
}
const routes: AuditRoute[] = paths.map(entry => ({
  pathname: `/${entry.params.path ?? ''}`,
  locale: entry.props.locale,
  section: sectionOf(entry.props.file),
  source: `site${entry.props.file}`,
  expectedStatus: 200,
  purpose: sectionOf(entry.props.file) === 'home' ? 'home-regression' : 'interior',
}))
routes.push({ pathname: '/404', locale: 'en', section: 'brand', source: 'site/src/pages/404.astro', expectedStatus: 404, purpose: 'interior' })
for (const locale of ['en', 'tw']) routes.push({ pathname: `${locale === 'tw' ? '/tw' : ''}/missing-interior-review-page`, locale, section: 'not-found', source: 'site/src/pages/404.astro', expectedStatus: 404, purpose: 'not-found-probe' })
const outputIndex = process.argv.indexOf('--output')
const output = outputIndex >= 0 ? path.resolve(process.argv[outputIndex + 1]) : path.join(siteRoot, 'test-results/interior-redesign/inventory.json')
const counts = Object.fromEntries([...Map.groupBy(routes, route => route.section)].map(([section, entries]) => [section, entries.length]))
await mkdir(path.dirname(output), { recursive: true })
await writeFile(output, JSON.stringify({ generatedAt: new Date().toISOString(), counts, routes }, null, 2) + '\n')
console.log(JSON.stringify({ output, total: routes.length, counts }))
