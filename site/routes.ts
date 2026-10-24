import { createElement as h, type ComponentType, type ReactNode } from 'react'
import i18n from './docs-shell/common/i18n.config.js'
import { mergeAssets, type PageAssets, type PropagatedModule } from './astro/propagated-assets'
import type { Metadata } from './docs-shell/types/Metadata'
import type { PageParams, Props } from './docs-shell/types/Props'

/**
 * Content routes follow `content/<url>/page.tsx`. A page module default-exports a
 * React server component and may export `metadata`, `generateMetadata`,
 * `generateStaticParams` or a permanent `redirect`. `layout.tsx` modules wrap
 * nested pages; `(group)` directories do not add URL segments.
 */
interface PageModule {
  default?: (props: Props) => ReactNode | Promise<ReactNode>
  metadata?: Partial<Metadata>
  generateMetadata?: (props: Pick<Props, 'params'>) => Promise<Partial<Metadata>> | Partial<Metadata>
  generateStaticParams?: () => Record<string, string | string[]>[] | Promise<Record<string, string | string[]>[]>
  redirect?: string
}

interface LayoutModule {
  default: (props: Props) => ReactNode | Promise<ReactNode>
}

interface SectionModule {
  default: ComponentType<{ children: ReactNode }>
  bodyClass?: string
  bare?: boolean
}

type Segment = { kind: 'static', value: string } | { kind: 'param' | 'rest', name: string }

export type Section = 'home' | 'guide' | 'reference' | 'blog' | 'brand' | 'sponsor' | 'design-system' | 'examples'

export interface RouteProps {
  file: string
  locale: PageParams['locale']
  params: Record<string, string | string[]>
}

type Propagated<T> = () => Promise<PropagatedModule<T>>

const contentRoot = '/content/'
// Literal globs: see astro/propagated-assets for why modules load through this query.
const pageModules = import.meta.glob<PropagatedModule<PageModule>>('/content/**/page.tsx', { query: '?astroPropagatedAssets', import: 'default' })
const layoutModules = import.meta.glob<PropagatedModule<LayoutModule>>('/content/**/layout.tsx', { query: '?astroPropagatedAssets', import: 'default' })
const sectionModules = import.meta.glob<PropagatedModule<SectionModule>>('/sections/*.tsx', { query: '?astroPropagatedAssets', import: 'default' })
const siteStyles = import.meta.glob<PropagatedModule<unknown>>('/styles/site.ts', { query: '?astroPropagatedAssets', import: 'default' })
const unlocalizedSections = new Set<Section>(['examples'])
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

function directoriesOf(file: string) {
  return file.slice(contentRoot.length).split('/').slice(0, -1)
}

function segmentsOf(file: string): Segment[] {
  // Static files would publish `<route>/index.html` as the parent directory's index.
  if (directoriesOf(file).at(-1) === 'index') throw new Error(`${file}: \`index\` is not a valid route segment`)
  return directoriesOf(file)
    .filter((directory) => !/^\(.+\)$/.test(directory))
    .map((directory) => {
      const rest = directory.match(/^\[\.\.\.(\w+)\]$/)
      if (rest) return { kind: 'rest', name: rest[1] }
      const param = directory.match(/^\[(\w+)\]$/)
      if (param) return { kind: 'param', name: param[1] }
      return { kind: 'static', value: directory }
    })
}

export function sectionOf(file: string): Section {
  const first = segmentsOf(file)[0]
  return first?.kind === 'static' ? first.value as Section : 'home'
}

function pathnameOf(segments: Segment[], params: Record<string, string | string[]>) {
  return '/' + segments.map((segment) => {
    if (segment.kind === 'static') return segment.value
    const value = params[segment.name]
    if (value === undefined) throw new Error(`Missing route parameter ${segment.name}`)
    return Array.isArray(value) ? value.join('/') : value
  }).join('/')
}

export function localizePathname(pathname: string, locale: string) {
  return locale === i18n.defaultLocale ? pathname : `/${locale}${pathname === '/' ? '' : pathname}`
}

async function loadPropagated<T>(modules: Record<string, Propagated<T>>, file: string) {
  const load = modules[file]
  if (!load) throw new Error(`Unknown module ${file}`)
  const propagated = await load()
  return { propagated, module: await propagated.getMod() }
}

async function loadModule(file: string) {
  return (await loadPropagated(pageModules, file)).module
}

/** Every content page × locale, as Astro `getStaticPaths()` entries. */
export async function getStaticPaths() {
  const paths: { params: { path: string | undefined }, props: RouteProps }[] = []
  for (const file of Object.keys(pageModules).sort()) {
    const module = await loadModule(file)
    const segments = segmentsOf(file)
    const paramSets = module.generateStaticParams ? await module.generateStaticParams() : [{}]
    const locales = unlocalizedSections.has(sectionOf(file)) ? [i18n.defaultLocale] : i18n.locales
    for (const params of paramSets) {
      for (const locale of locales) {
        const pathname = localizePathname(pathnameOf(segments, params), locale)
        paths.push({ params: { path: pathname.slice(1) || undefined }, props: { file, locale: locale as RouteProps['locale'], params } })
      }
    }
  }
  return paths
}

export type LoadedRoute =
  | { kind: 'redirect', location: string }
  | { kind: 'page', metadata: Partial<Metadata>, element: ReactNode, assets: PageAssets, bodyClass?: string, bare?: boolean }

export async function loadRoute({ file, locale, params }: RouteProps): Promise<LoadedRoute> {
  const page = await loadPropagated(pageModules, file)
  const module = page.module
  if (module.redirect) return { kind: 'redirect', location: localizePathname(module.redirect, locale) }
  if (!module.default) throw new Error(`${file} must export a page component or a redirect`)
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
    bare: section.module.bare
  }
}
