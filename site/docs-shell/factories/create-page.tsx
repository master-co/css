import type { JSX } from 'react'
import type { Props } from '../types/Props'
import generate from '../utils/generate-metadata'
import { createTranslation } from '../utils/i18n'

interface Options {
  metadata: any
  content?: Promise<any> | ((props: Props & {
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
        if (content instanceof Promise) {
          const importContentModule = await loadTranslatedContent(params.locale, metadata) || await content
          if (importContentModule && importContentModule.default) {
            resolvedContent = <importContentModule.default pageCategories={categories} />
            toc = importContentModule.toc
          } else {
            throw new Error('Invalid content module')
          }
        } else {
          resolvedContent = content({ ...props, $ })
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
  const fileURL = metadata?.fileURL
  if (typeof fileURL !== 'string') return
  return decodeURI(fileURL).match(/\/site\/content\/(.+)\/metadata\.(?:ts|js)$/)?.[1]
}
