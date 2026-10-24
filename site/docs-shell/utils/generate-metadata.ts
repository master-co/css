import { defu } from 'defu'
import type { Metadata } from '../types/Metadata'
import type { Props } from '../types/Props'
import { createTranslation } from './i18n'

export default async function generate(
  metadata: Metadata | Record<string, any>,
  { params }: Pick<Props, 'params'>,
  dictionaries: Record<string, () => Promise<any>>
): Promise<Metadata> {
  const { locale } = params
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
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      siteName: import.meta.env.PUBLIC_PROJECT
    },
    twitter: {
      title: ogTitle,
      description: ogDescription,
      site: '@mastercorg',
      creator: '@aron1tw',
      card: 'summary_large_image'
    }
  }
  if (metadata.openGraph?.images) {
    baseMetadata.twitter.images = metadata.openGraph.images
  } else {
    // postbuild-static renders each placeholder into a static /og image.
    baseMetadata.openGraph.images = baseMetadata.twitter.images = `/api/og-image?${new URLSearchParams(requestedSearchParams)}`
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
  ) as Metadata
}
