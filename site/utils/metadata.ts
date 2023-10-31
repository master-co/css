import extend from '@techor/extend';
import type { Metadata, ResolvingMetadata } from 'next';
import type { Locale } from 'shared/i18n.config';
import type { Props } from 'shared/types/Props';
import allAuthors from 'shared/data/authors'
import { queryDictionary } from 'shared/dictionaries';

export async function generate(
    metadata: Metadata | Record<string, any>,
    { params, searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const $ = await queryDictionary(params?.locale)
    const title = $(metadata.title)
    const description = $(metadata.description)
    const category = $(metadata.category)
    const ogTitle = $(metadata.openGraph?.title || metadata.title)
    const ogDescription = $(metadata.openGraph?.description || metadata.description)
    const requestedSearchParams = {
        ...metadata as any,
        title: ogTitle,
        description: ogDescription,
        locale: params?.locale as Locale,
    }
    if (requestedSearchParams.authors) {
        requestedSearchParams.authors = JSON.stringify(requestedSearchParams.authors)
    }
    const ogImageUrl = `${process.env.HOST}/api/og-image?${new URLSearchParams(requestedSearchParams)}`
    return extend(
        {
            icons: '',
            openGraph: {
                title: ogTitle,
                description: ogDescription,
                siteName: 'Master CSS',
                images: ogImageUrl
            },
            twitter: {
                title: ogTitle,
                description: ogDescription,
                site: '@mastercorg',
                creator: '@aron1tw',
                card: 'summary_large_image',
                images: ogImageUrl
            }
        } as Metadata,
        metadata,
        {
            title,
            description,
            category
        }
    )
}