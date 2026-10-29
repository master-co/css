import i18n from '../docs-shell/common/i18n.config.js'
import type { PageParams } from '../docs-shell/types/Props'

export type Section = 'home' | 'guide' | 'reference' | 'blog' | 'brand' | 'sponsor' | 'design-system' | 'examples'
export type RouteParams = Record<string, string | string[]>
export interface RouteProps {
  file: string
  locale: PageParams['locale']
  params: RouteParams
}
export interface ParamsModule {
  generateStaticParams(): RouteParams[] | Promise<RouteParams[]>
}
type Segment = { kind: 'static', value: string } | { kind: 'param' | 'rest', name: string }

export function directoriesOf(file: string) {
  return file.slice('/content/'.length).split('/').slice(0, -1)
}

function segmentsOf(file: string): Segment[] {
  if (directoriesOf(file).at(-1) === 'index') throw new Error(`${file}: \`index\` is not a valid route segment`)
  return directoriesOf(file)
    .filter(directory => !/^\(.+\)$/.test(directory))
    .map(directory => {
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

export function localesOf(section: Section): readonly string[] {
  return section === 'examples' ? [i18n.defaultLocale] : i18n.locales
}

export function localizePathname(pathname: string, locale: string) {
  return locale === i18n.defaultLocale ? pathname : `/${locale}${pathname === '/' ? '' : pathname}`
}

function pathnameOf(segments: Segment[], params: RouteParams) {
  return '/' + segments.map(segment => {
    if (segment.kind === 'static') return segment.value
    const value = params[segment.name]
    if (value === undefined) throw new Error(`Missing route parameter ${segment.name}`)
    return Array.isArray(value) ? value.join('/') : value
  }).join('/')
}

/** Enumerate filenames and lightweight params providers without evaluating page modules. */
export async function createStaticPaths(files: string[], providers: Record<string, () => Promise<ParamsModule>>) {
  const paths: { params: { path: string | undefined }, props: RouteProps }[] = []
  for (const file of [...files].sort()) {
    const segments = segmentsOf(file)
    const dynamic = segments.some(segment => segment.kind !== 'static')
    const providerFile = file.replace(/page\.tsx$/, 'params.ts')
    if (dynamic && !providers[providerFile]) throw new Error(`${file}: dynamic routes require a sibling params.ts`)
    const paramSets = dynamic ? await (await providers[providerFile]()).generateStaticParams() : [{}]
    for (const params of paramSets) {
      for (const locale of localesOf(sectionOf(file))) {
        const pathname = localizePathname(pathnameOf(segments, params), locale)
        paths.push({ params: { path: pathname.slice(1) || undefined }, props: { file, locale: locale as RouteProps['locale'], params } })
      }
    }
  }
  return paths
}
