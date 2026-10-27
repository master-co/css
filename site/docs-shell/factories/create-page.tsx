import type { JSX } from 'react'
import type { Props } from '../types/Props'
import generate from '../utils/generate-metadata'
import { createTranslation } from '../utils/i18n'

interface ContentModule {
  default: (props: { pageCategories?: any }) => JSX.Element
  toc?: any
}

interface Options {
  metadata: any
  /**
   * Import MDX statically: Astro collects a page's stylesheets from its module graph
   * when the page module loads, before a pending dynamic import finishes in dev.
   */
  content?: ContentModule | ((props: Props & {
    $: (text: any) => string
  }) => JSX.Element)
  categories?: any
  Layout?: any
  dictionaries: any
  categoryLink?: string
  icon?: React.ReactElement
  noTOC?: boolean
  subtitle?: string
}

/** Translated MDX lives beside its source as `content.<locale>.mdx`. */
const translatedContent = import.meta.glob<{ default: any, toc?: any }>('/content/**/content.*.mdx')

export default function createPage({
  metadata,
  content,
  dictionaries,
  categories,
  noTOC = false,
  Layout,
  subtitle,
  ...options
}: Options) {
  return {
    async generateMetadata(props: Pick<Props, 'params'>) {
      return await generate(metadata, props, dictionaries)
    },
    async Page(props: Props) {
      const { params } = props
      const $ = await createTranslation(params.locale, dictionaries)
      let resolvedContent: any
      let toc: any
      if (content) {
        if (typeof content === 'function') {
          resolvedContent = content({ ...props, $ })
        } else {
          const contentModule = await loadTranslatedContent(params.locale, metadata) || content
          if (!contentModule.default) throw new Error('Invalid content module')
          resolvedContent = <contentModule.default pageCategories={categories} />
          toc = contentModule.toc
        }
      }
      const children =
        <>
          {resolvedContent}
          {props.children}
        </>
      if (Layout) {
        return (
          <Layout
            {...props}
            {...options}
            pageCategories={categories}
            dictionaries={dictionaries}
            metadata={metadata}
            toc={noTOC ? null : toc}
          >
            {subtitle && <p className='font-style:italic'>{subtitle}</p>}
            {children}
          </Layout>
        )
      } else {
        return children
      }
    }
  }
}

async function loadTranslatedContent(locale: string, metadata: any) {
  const directory = contentDirectoryOf(metadata)
  return directory ? translatedContent[`/content/${directory}/content.${locale}.mdx`]?.() : undefined
}

function contentDirectoryOf(metadata: any) {
  const sourcePath = metadata?.sourcePath
  if (typeof sourcePath !== 'string') return
  return sourcePath.match(/^site\/content\/(.+)\/content\.mdx$/)?.[1]
}
