import { NextRequest } from 'next/server'
import create from '~/og-image'

export async function GET(req: NextRequest, { params }: any) {
    const { searchParams } = req.nextUrl
    return create({
        title: searchParams.get('title'),
        description: searchParams.get('description'),
        props: {
            params: {
                locale: searchParams.get('locale') || 'en',
            }
        },
        metadata: {
            category: searchParams.get('category'),
            authors: JSON.parse(searchParams.get('authors') || '[]'),
        },
        ogImageTitle: searchParams.get('ogImageTitle'),
        ogImageIcon: searchParams.get('ogImageIcon'),
        ogImageIconWidth: searchParams.get('ogImageIconWidth'),
    })
}