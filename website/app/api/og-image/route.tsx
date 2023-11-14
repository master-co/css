/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
import { NextRequest } from 'next/server'
import type { Metadata } from 'next'
import type { Author } from 'next/dist/lib/metadata/types/metadata-types'
import { queryDictionary } from 'websites/dictionaries'
import stringWidth from 'string-width'
import create from '~/og-image'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, props: any) {
    const { searchParams } = req.nextUrl
    let title = searchParams.get('title')
    let description = searchParams.get('description')
    const locale = searchParams.get('locale') || 'en'
    const metadata: Metadata = {
        category: searchParams.get('category'),
        authors: JSON.parse(searchParams.get('authors') || '[]'),
    }
    const $ = await queryDictionary(locale)
    title = $(title || metadata?.openGraph?.title).replace(' - Master CSS', '') as string
    description = $(description || metadata?.openGraph?.description) as string
    if (stringWidth(description) > 110) {
        description = description.substring(0, 109)
        if (stringWidth(description) >= 110) {
            description = description.substring(0, 59)
        }
        description = description.replace(/[,.;]?\s[\w']*$|.$/, '...')
    }
    return create({
        metadata,
        title,
        description,
        props
    })
}
