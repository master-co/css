import { JSX, Key } from 'react'
import { Props } from '../types/Props'
import generate from '../utils/generate-metadata'
import type { ResolvingMetadata } from 'next'
import { createTranslation } from '../utils/i18n'
import brands from '../data/brands'
import translatedContentRegistry from '~/site/.translations/content-registry'

interface Options {
  metadata: any
  content?: Promise<any> | ((props: Props & {
    $: (text: any) => string
  }) => JSX.Element)
  categories?: any
  Layout?: any
  dictionaries: any
  categoryLink?: string
  icon?: React.ReactElement | keyof typeof brands
  noTOC?: boolean
  subtitle?: string
}

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
    dynamic: 'force-static',
    revalidate: false,
    async generateMetadata(
      props: Props,
      parent: ResolvingMetadata
    ) {
      return await generate(metadata, props, dictionaries, parent)
    },
    async Page(props: Props) {
      const params = await props.params
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
            {subtitle && <p className='italic'>{subtitle}</p>}
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
  const routeKey = routeKeyFromMetadata(metadata)
  if (!routeKey) return
  const load = (translatedContentRegistry as Record<string, Record<string, () => Promise<any>>>)[locale]?.[routeKey]
  return load?.()
}

function routeKeyFromMetadata(metadata: any) {
  const fileURL = metadata?.fileURL
  if (typeof fileURL !== 'string') return
  const match = fileURL.match(/\/app\/\[locale\]\/(.+)\/metadata\.(?:ts|js)$/)
  return match?.[1]
}
