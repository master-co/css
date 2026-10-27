import type { Metadata } from '../types/Metadata'

export interface HeadTag {
  tag: 'meta' | 'link'
  attributes: Record<string, string>
}

export interface ResolvedHead {
  title: string
  tags: HeadTag[]
}

function list(value: string | string[] | undefined) {
  return value === undefined ? [] : Array.isArray(value) ? value : [value]
}

function resolveTitle(title: Metadata['title'], project: string) {
  if (!title) return project
  if (typeof title === 'string') return `${title} - ${project}`
  if ('absolute' in title) return title.absolute
  return title.default
}

function resolveRobots(robots: Metadata['robots']) {
  if (!robots || typeof robots === 'string') return robots
  return [robots.index === false ? 'noindex' : 'index', robots.follow === false ? 'nofollow' : 'follow']
    .filter((value, index) => index === 0 || robots.follow !== undefined)
    .join(', ')
}

export interface HeadOptions {
  project: string
  siteURL: string
  /** The page's published pathname; indexable pages declare it as canonical. */
  pathname?: string
  /** Published pathnames of the page by `hreflang`, including `x-default`. */
  languages?: Record<string, string>
}

/** Resolve page metadata into document head tags. Relative URLs resolve against `siteURL`. */
export function resolveHead(metadata: Partial<Metadata>, { project, siteURL, pathname, languages = {} }: HeadOptions): ResolvedHead {
  const tags: HeadTag[] = []
  const absolute = (url: string) => new URL(url, siteURL).href
  const meta = (key: 'name' | 'property', name: string, content: string | undefined) => {
    if (content) tags.push({ tag: 'meta', attributes: { [key]: name, content } })
  }
  const robots = resolveRobots(metadata.robots)
  const indexable = !robots?.includes('noindex')
  meta('name', 'description', metadata.description)
  meta('name', 'category', metadata.category)
  meta('name', 'robots', robots)
  const canonical = metadata.alternates?.canonical ?? (indexable ? pathname : undefined)
  if (canonical) tags.push({ tag: 'link', attributes: { rel: 'canonical', href: absolute(canonical) } })
  if (indexable) {
    for (const [hreflang, href] of Object.entries(languages)) {
      tags.push({ tag: 'link', attributes: { rel: 'alternate', hreflang, href: absolute(href) } })
    }
  }
  const { openGraph, twitter } = metadata
  meta('property', 'og:title', openGraph?.title)
  meta('property', 'og:description', openGraph?.description)
  meta('property', 'og:site_name', openGraph?.siteName)
  // Open Graph and Twitter cards require absolute image URLs.
  for (const image of list(openGraph?.images)) meta('property', 'og:image', absolute(image))
  meta('name', 'twitter:card', twitter?.card)
  meta('name', 'twitter:site', twitter?.site)
  meta('name', 'twitter:creator', twitter?.creator)
  meta('name', 'twitter:title', twitter?.title)
  meta('name', 'twitter:description', twitter?.description)
  for (const image of list(twitter?.images)) meta('name', 'twitter:image', absolute(image))
  return { title: resolveTitle(metadata.title, project), tags }
}
