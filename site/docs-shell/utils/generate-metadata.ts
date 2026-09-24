import { defu } from 'defu'
import type { Metadata as NextMetadata, ResolvingMetadata } from 'next'
import type { Props } from '../types/Props'
import { createTranslation } from './i18n'

export default async function generate(
  metadata: NextMetadata | Record<string, any>,
  { params }: Props,
  dictionaries: Record<string, () => Promise<any>>,
  parent: ResolvingMetadata
): Promise<NextMetadata> {
  const { locale } = await params
  const $ = await createTranslation(locale, dictionaries)
  const description = $(metadata.description)
  const category = $(metadata.category)
  const ogTitle = $(metadata.openGraph?.title || metadata.title?.absolute || metadata.title)
  const ogDescription = $(metadata.openGraph?.description || metadata.description)
  const requestedSearchParams = {
    ...metadata as any,
    title: ogTitle,
    description: ogDescription,
    locale
  }
  delete requestedSearchParams.openGraph
  if (requestedSearchParams.authors) {
    requestedSearchParams.authors = JSON.stringify(requestedSearchParams.authors.map((author: any) => author.name))
  }
  const baseMetadata: any = {
    icons: '',
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      siteName: process.env.NEXT_PUBLIC_PROJECT
    },
    twitter: {
      title: ogTitle,
      description: ogDescription,
      site: '@mastercorg',
      creator: '@aron1tw',
      card: 'summary_large_image'
    }
  }
  if (!(metadata as any).vercelOG) {
    if (metadata.openGraph?.images) {
      baseMetadata.twitter.images = baseMetadata.openGraph.images
    } else {
      const ogImageUrl = new URL(`/api/og-image?${new URLSearchParams(requestedSearchParams)}`, process.env.NEXT_PUBLIC_URL).toString()
      baseMetadata.openGraph.images = baseMetadata.twitter.images = ogImageUrl
    }
  }
  return defu(
    {
      title: typeof metadata.title === 'string'
        ? $(metadata.title)
        : {
          absolute: $(metadata.title.absolute)
        },
      description,
      category
    },
    metadata,
    baseMetadata
  )
}
