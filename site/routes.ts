import type { AstroComponentFactory } from 'astro/runtime/server/index.js'
import { mergeAssets, type PageAssets, type PropagatedModule } from './astro/propagated-assets'
import { createStaticPaths, directoriesOf, localesOf, sectionOf, type ParamsModule, type RouteProps, type Section } from './astro/route-paths'
import type { Metadata } from './docs-shell/types/Metadata'
import type { Props } from './docs-shell/types/Props'

export { localizePathname, sectionOf } from './astro/route-paths'
export type { RouteProps, Section } from './astro/route-paths'

/**
 * Content routes follow `content/<url>/page.astro`. A page component receives {@link Props}
 * and may export `metadata` or `generateMetadata` from its frontmatter. Dynamic routes
 * enumerate params through a lightweight sibling `params.ts`. `layout.astro` modules wrap
 * nested pages through their default slot; `(group)` directories add no URL segment.
 */
interface PageModule {
  default?: AstroComponentFactory
  metadata?: Partial<Metadata>
  generateMetadata?: (props: Pick<Props, 'params'>) => Promise<Partial<Metadata>> | Partial<Metadata>
  /** `false` for pages that render no document surfaces, code or prose, such as indexes. */
  documentStyles?: boolean
}

interface LayoutModule {
  default: AstroComponentFactory
}

interface SectionModule {
  default: AstroComponentFactory
  bodyClass?: string
  bare?: boolean
}

type Propagated<T> = () => Promise<PropagatedModule<T>>

const contentRoot = '/content/'
// Literal globs: see astro/propagated-assets for why modules load through this query.
const pageModules = import.meta.glob<PropagatedModule<PageModule>>('/content/**/page.astro', { query: '?astroPropagatedAssets', import: 'default' })
const paramsModules = import.meta.glob<ParamsModule>('/content/**/params.ts')
const layoutModules = import.meta.glob<PropagatedModule<LayoutModule>>('/content/**/layout.astro', { query: '?astroPropagatedAssets', import: 'default' })
const sectionModules = import.meta.glob<PropagatedModule<SectionModule>>('/sections/*.astro', { query: '?astroPropagatedAssets', import: 'default' })
const siteStyles = import.meta.glob<PropagatedModule<unknown>>('/styles/site.ts', { query: '?astroPropagatedAssets', import: 'default' })
const interfaceStyles = import.meta.glob<PropagatedModule<unknown>>('/styles/interface.ts', { query: '?astroPropagatedAssets', import: 'default' })
const documentStyles = import.meta.glob<PropagatedModule<unknown>>('/styles/documents.ts', { query: '?astroPropagatedAssets', import: 'default' })
const sectionShells: Record<Section, string> = {
  home: 'home',
  guide: 'guide',
  reference: 'reference',
  blog: 'blog',
  brand: 'page',
  benchmarks: 'page',
  'design-system': 'design-system',
  examples: 'examples'
}

async function loadPropagated<T>(modules: Record<string, Propagated<T>>, file: string) {
  const load = modules[file]
  if (!load) throw new Error(`Unknown module ${file}`)
  const propagated = await load()
  return { propagated, module: await propagated.getMod() }
}

/** Every content page × locale, as Astro `getStaticPaths()` entries. */
export async function getStaticPaths() {
  return createStaticPaths(Object.keys(pageModules), paramsModules)
}

export interface LoadedRoute {
  metadata: Partial<Metadata>
  /** Components from the outermost (the section shell) to the page; each wraps the next in its default slot. */
  layers: AstroComponentFactory[]
  props: Props
  assets: PageAssets
  bodyClass?: string
  bare?: boolean
  locales: readonly string[]
}

export async function loadRoute({ file, locale, params }: RouteProps): Promise<LoadedRoute> {
  const page = await loadPropagated(pageModules, file)
  const module = page.module
  if (!module.default) throw new Error(`${file} must export a page component`)
  const props: Props = { params: { ...params, locale } }
  const metadata = (module.generateMetadata ? await module.generateMetadata(props) : module.metadata) ?? {}
  const layers = [module.default]
  const propagated: PropagatedModule<unknown>[] = [page.propagated]
  const directories = directoriesOf(file)
  for (let depth = directories.length; depth > 0; depth--) {
    const layoutFile = `${contentRoot}${directories.slice(0, depth).join('/')}/layout.astro`
    if (!layoutModules[layoutFile]) continue
    const layout = await loadPropagated(layoutModules, layoutFile)
    layers.unshift(layout.module.default)
    propagated.unshift(layout.propagated)
  }
  return withSection(sectionOf(file), metadata, layers, props, propagated, module.documentStyles)
}

/** Wrap a page in its section shell, e.g. for routes outside `content/` such as 404. */
export async function withSection(sectionName: Section, metadata: Partial<Metadata>, layers: AstroComponentFactory[], props: Props, propagated: PropagatedModule<unknown>[] = [], documents = true): Promise<LoadedRoute> {
  const section = await loadPropagated(sectionModules, `/sections/${sectionShells[sectionName]}.astro`)
  // Links within one asset boundary are unordered, so the foundation, the shell interface and
  // document styles each form their own boundary, in that order. Bare sections import what they render.
  const site = section.module.bare ? [] : [await siteStyles['/styles/site.ts'](), await interfaceStyles['/styles/interface.ts']()]
  const document = section.module.bare || !documents ? [] : [await documentStyles['/styles/documents.ts']()]
  return {
    metadata,
    layers: [section.module.default, ...layers],
    props,
    assets: mergeAssets(...site, ...document, section.propagated, ...propagated),
    bodyClass: section.module.bodyClass,
    bare: section.module.bare,
    locales: localesOf(sectionName)
  }
}
