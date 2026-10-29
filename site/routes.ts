import { createElement as h, type ComponentType, type ReactNode } from 'react'
import { mergeAssets, type PageAssets, type PropagatedModule } from './astro/propagated-assets'
import { createStaticPaths, directoriesOf, localesOf, sectionOf, type ParamsModule, type RouteProps, type Section } from './astro/route-paths'
import type { Metadata } from './docs-shell/types/Metadata'
import type { Props } from './docs-shell/types/Props'

export { localizePathname, sectionOf } from './astro/route-paths'
export type { RouteProps, Section } from './astro/route-paths'

/**
 * Content routes follow `content/<url>/page.tsx`. A page module default-exports a
 * React server component and may export `metadata` or `generateMetadata`.
 * Dynamic routes enumerate params through a lightweight sibling `params.ts`.
 * `layout.tsx` modules wrap nested pages; `(group)` directories add no URL segment.
 */
interface PageModule {
  default?: (props: Props) => ReactNode | Promise<ReactNode>
  metadata?: Partial<Metadata>
  generateMetadata?: (props: Pick<Props, 'params'>) => Promise<Partial<Metadata>> | Partial<Metadata>
}

interface LayoutModule {
  default: (props: Props) => ReactNode | Promise<ReactNode>
}

interface SectionModule {
  default: ComponentType<{ children: ReactNode }>
  bodyClass?: string
  bare?: boolean
}

type Propagated<T> = () => Promise<PropagatedModule<T>>

const contentRoot = '/content/'
// Literal globs: see astro/propagated-assets for why modules load through this query.
const pageModules = import.meta.glob<PropagatedModule<PageModule>>('/content/**/page.tsx', { query: '?astroPropagatedAssets', import: 'default' })
const paramsModules = import.meta.glob<ParamsModule>('/content/**/params.ts')
const layoutModules = import.meta.glob<PropagatedModule<LayoutModule>>('/content/**/layout.tsx', { query: '?astroPropagatedAssets', import: 'default' })
const sectionModules = import.meta.glob<PropagatedModule<SectionModule>>('/sections/*.tsx', { query: '?astroPropagatedAssets', import: 'default' })
const siteStyles = import.meta.glob<PropagatedModule<unknown>>('/styles/site.ts', { query: '?astroPropagatedAssets', import: 'default' })
const sectionShells: Record<Section, string> = {
  home: 'home',
  guide: 'guide',
  reference: 'reference',
  blog: 'blog',
  brand: 'page',
  sponsor: 'page',
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

export type LoadedRoute = { kind: 'page', metadata: Partial<Metadata>, element: ReactNode, assets: PageAssets, bodyClass?: string, bare?: boolean, locales: readonly string[] }

export async function loadRoute({ file, locale, params }: RouteProps): Promise<LoadedRoute> {
  const page = await loadPropagated(pageModules, file)
  const module = page.module
  if (!module.default) throw new Error(`${file} must export a page component`)
  const props: Props = { params: { ...params, locale } }
  const metadata = (module.generateMetadata ? await module.generateMetadata(props) : module.metadata) ?? {}
  let element: ReactNode = h(module.default, props)
  const propagated: PropagatedModule<unknown>[] = [page.propagated]
  const directories = directoriesOf(file)
  for (let depth = directories.length; depth > 0; depth--) {
    const layoutFile = `${contentRoot}${directories.slice(0, depth).join('/')}/layout.tsx`
    if (!layoutModules[layoutFile]) continue
    const layout = await loadPropagated(layoutModules, layoutFile)
    element = h(layout.module.default, props, element)
    propagated.unshift(layout.propagated)
  }
  return withSection(sectionOf(file), metadata, element, propagated)
}

/** Wrap a page in its section shell, e.g. for routes outside `content/` such as 404. */
export async function withSection(sectionName: Section, metadata: Partial<Metadata>, element: ReactNode, propagated: PropagatedModule<unknown>[] = []): Promise<LoadedRoute & { kind: 'page' }> {
  const section = await loadPropagated(sectionModules, `/sections/${sectionShells[sectionName]}.tsx`)
  // Links within one asset boundary are unordered, so site-wide styles form their own first boundary.
  const site = section.module.bare ? [] : [await siteStyles['/styles/site.ts']()]
  return {
    kind: 'page',
    metadata,
    element: h(section.module.default, null, element),
    assets: mergeAssets(...site, section.propagated, ...propagated),
    bodyClass: section.module.bodyClass,
    bare: section.module.bare,
    locales: localesOf(sectionName)
  }
}
