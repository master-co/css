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

/** Resolve page metadata into document head tags. Relative URLs resolve against `siteURL`. */
export function resolveHead(metadata: Partial<Metadata>, { project, siteURL }: { project: string, siteURL: string }): ResolvedHead {
  const tags: HeadTag[] = []
  const meta = (key: 'name' | 'property', name: string, content: string | undefined) => {
    if (content) tags.push({ tag: 'meta', attributes: { [key]: name, content } })
  }
  meta('name', 'description', metadata.description)
  meta('name', 'category', metadata.category)
  meta('name', 'robots', resolveRobots(metadata.robots))
  if (metadata.alternates?.canonical) {
    tags.push({ tag: 'link', attributes: { rel: 'canonical', href: new URL(metadata.alternates.canonical, siteURL).href } })
  }
  const { openGraph, twitter } = metadata
  meta('property', 'og:title', openGraph?.title)
  meta('property', 'og:description', openGraph?.description)
  meta('property', 'og:site_name', openGraph?.siteName)
  for (const image of list(openGraph?.images)) meta('property', 'og:image', image)
  meta('name', 'twitter:card', twitter?.card)
  meta('name', 'twitter:site', twitter?.site)
  meta('name', 'twitter:creator', twitter?.creator)
  meta('name', 'twitter:title', twitter?.title)
  meta('name', 'twitter:description', twitter?.description)
  for (const image of list(twitter?.images)) meta('name', 'twitter:image', image)
  return { title: resolveTitle(metadata.title, project), tags }
}
