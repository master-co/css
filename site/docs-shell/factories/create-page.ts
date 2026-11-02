import type { AstroComponentFactory } from 'astro/runtime/server/index.js'
import type { Props } from '../types/Props'
import generate from '../utils/generate-metadata'

export interface ContentModule {
  default: AstroComponentFactory
  toc?: any
}

/** Translated MDX lives beside its source as `content.<locale>.mdx`. */
const translatedContent = import.meta.glob<ContentModule>('/content/**/content.*.mdx')

/** `generateMetadata` for a page rendered by `factories/Page.astro`. */
export function createPageMetadata(metadata: any, dictionaries: Record<string, () => Promise<any>>) {
  return (props: Pick<Props, 'params'>) => generate(metadata, props, dictionaries)
}

/**
 * The page's MDX in the requested locale. Import the source statically (`import * as content from './content.mdx'`):
 * Astro collects a page's stylesheets from its module graph when the page module loads, before a pending dynamic import finishes in dev.
 */
export async function resolveContent(locale: string, metadata: any, content: ContentModule) {
  const directory = contentDirectoryOf(metadata)
  return (directory ? await translatedContent[`/content/${directory}/content.${locale}.mdx`]?.() : undefined) ?? content
}

function contentDirectoryOf(metadata: any) {
  const sourcePath = metadata?.sourcePath
  if (typeof sourcePath !== 'string') return
  return sourcePath.match(/^site\/content\/(.+)\/content\.mdx$/)?.[1]
}
