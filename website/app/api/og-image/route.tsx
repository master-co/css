/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
import { NextRequest } from 'next/server'
import type { Metadata } from 'next';

export const runtime = 'edge'

export async function GET(req: NextRequest, { params }: any) {
    let { searchParams } = req.nextUrl
    let title = searchParams.get('title');
    let description = searchParams.get('description')
    let locale = searchParams.get('locale') || 'en'
    let ogImageTitle = searchParams.get('ogImageTitle')
    let ogImageIcon = searchParams.get('ogImageIcon')
    let ogImageIconWidth = searchParams.get('ogImageIconWidth')
    let metadata: Metadata = {
        category: searchParams.get('category'),
        authors: JSON.parse(searchParams.get('authors') || '[]'),
    }
    let icon: JSX.Element
    let size = { width: 1200, height: 630 }
    let fonts = [
        {
            name: 'Inter Medium',
            data: await (await fetch(new URL('public/fonts/Inter-Medium.ttf', import.meta.url))).arrayBuffer()
        },
        {
            name: 'Inter SemiBold',
            data: await (await fetch(new URL('public/fonts/Inter-SemiBold.ttf', import.meta.url))).arrayBuffer()
        },
        {
            name: 'Inter ExtraBold',
            data: await (await fetch(new URL('public/fonts/Inter-ExtraBold.ttf', import.meta.url))).arrayBuffer()
        },
        {
            name: 'NotoSansTC Regular',
            data: await (await fetch(new URL('public/fonts/NotoSansTC-Regular.ttf', import.meta.url))).arrayBuffer()
        },
        {
            name: 'NotoSansTC Medium',
            data: await (await fetch(new URL('public/fonts/NotoSansTC-Medium.ttf', import.meta.url))).arrayBuffer()
        },
        {
            name: 'NotoSansTC Black',
            data: await (await fetch(new URL('public/fonts/NotoSansTC-Black.ttf', import.meta.url))).arrayBuffer()
        }
    ]
    const $ = await queryDictionary(locale)
    title = $(ogImageTitle || title || metadata?.openGraph?.title).replace(' - Master CSS', '') as string
    description = $(description || metadata?.openGraph?.description) as string
    const authorNames = metadata?.authors as Author[] || []
    const category = $(metadata?.category) as string
    if (ogImageIcon) {
        icon = <img src={ogImageIcon} width={ogImageIconWidth ? +ogImageIconWidth : undefined} height='100%' style={{ objectFit: 'contain', margin: 'auto' }} />
    }
    if (stringWidth(description) > 110) {
        description = description.substring(0, 109)
        if (stringWidth(description) >= 110) {
            description = description.substring(0, 59)
        }
        description = description.replace(/[,.;]?\s[\w']*$|.$/, '...')
    }
    const titleStringWidth = stringWidth(title as string) + (icon ? 8 : 0)
    let titleFontSize = 64
    if (icon) {
        if (titleStringWidth > 84) {
            titleFontSize = 40
        } else if (titleStringWidth > 56) {
            titleFontSize = 48
        } else if (titleStringWidth > 28) {
            titleFontSize = 56
        }
    }

    const fontFamily = {
        medium: ['Inter Medium', 'NotoSansTC Regular'].join(','),
        semibold: ['Inter SemiBold', 'NotoSansTC Medium'].join(','),
        extrabold: ['Inter ExtraBold', 'NotoSansTC Black'].join(',')
    }

    return new ImageResponse(
        (
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'nowrap',
                backgroundImage: `url(${(await fetch(new URL('public/images/cover-bg.jpg', import.meta.url))).url})`,
                backgroundSize: '100% 100%',
                padding: '70px 95px',
                WebkitFontSmoothing: 'subpixel-antialiased',
                textRendering: 'geometricPrecision',
                ...size
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    flex: '1 1 auto'
                }}>
                    {/* logotype */}
                    <div style={{
                        display: 'flex'
                    }}>
                        <img src={(await fetch(new URL('public/images/css-logotype@light.png', import.meta.url))).url} width="340" />
                    </div>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '25px'
                    }}>
                        {/* title */}
                        <div style={{
                            display: 'flex',
                            fontFamily: fontFamily.extrabold,
                            fontWeight: 'bolder',
                            fontSize: `${titleFontSize}px`,
                            letterSpacing: '-0.025em'
                        }}>
                            {title}
                        </div>
                        {/* description */}
                        {
                            description && <div style={{
                                display: 'flex',
                                fontFamily: fontFamily.medium,
                                fontSize: `32px`,
                                color: '#6C7693',
                                width: '92%',
                                letterSpacing: '-0.015em',
                                lineHeight: '56px'
                            }}>
                                {description}
                            </div>
                        }
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-end'
                    }}>
                        {/* authors */}
                        {!!authorNames.length && Promise.all(authorNames.map(async (authorName, index) => {
                            const author: any = authors.find((eachAuthor) => eachAuthor.name === authorName)
                            return (
                                // eslint-disable-next-line react/jsx-key
                                <div style={{ display: 'flex', marginRight: '30px', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', width: 70, height: 70, padding: 5, border: '1px solid #878D9F', borderRadius: '50%' }}>
                                        <img src={(await fetch(new URL(authorImages[author.name], import.meta.url))).url} width="100%" height="100%" style={{ objectFit: 'cover', borderRadius: '50%' }} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', margin: '0px 15px' }}>
                                        <div style={{
                                            fontFamily: fontFamily.semibold,
                                            fontSize: `26px`,
                                            letterSpacing: '-0.025em',
                                        }}>
                                            {author.name}
                                        </div>
                                        <div style={{
                                            fontFamily: fontFamily.medium,
                                            fontSize: 18,
                                            color: '#878D9F',
                                            letterSpacing: '-0.025em',
                                            marginTop: 5
                                        }}>
                                            {author.twitter}
                                        </div>
                                    </div>
                                </div>
                            )
                        }))}
                        {/* category */}
                        {!authorNames.length && category &&
                            <div style={{
                                display: 'flex',
                                fontFamily: fontFamily.semibold,
                                fontSize: '28px',
                                color: '#e6a300'
                            }}>
                                {category}
                            </div>
                        }
                    </div>
                </div>
                {icon &&
                    <div style={{
                        display: 'flex',
                        justifyItems: 'center',
                        alignItems: 'center',
                        height: '100%',
                        flex: '0 0 280px'
                    }}>
                        {icon}
                    </div>}
            </div>
        ),
        {
            ...size,
            fonts,
            headers: {
                'Cache-Control': 'public, max-age=31536000, immutable'
            }
        },
    )
}

/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */

import type { Author } from 'next/dist/lib/metadata/types/metadata-types';

import { ImageResponse } from 'next/og';
import authors from 'websites/data/authors';
import { queryDictionary } from 'websites/dictionaries';
import stringWidth from 'string-width'

// const readImage = (filename: string) => {
//     console.log('cwd:', process.cwd())
//     console.log('read image:', filename)
//     const extname = path.extname(filename);
//     const mimeType = mime.lookup(extname);
//     return `data:${mimeType};base64,` + fs.readFileSync(filename, { encoding: 'base64' })
// }

// const cssLogotypeSrc = readImage('public/images/css-logotype@light.png')
// const coverBgSrc = readImage('public/images/cover-bg.jpg')
const authorImages: any = {
    Aron: 'public/images/authors/aron.jpg',
    Joy: 'public/images/authors/joy.jpg',
    Benseage: 'public/images/authors/benseage.jpg',
    Miles: 'public/images/authors/miles.jpg',
    Lola: 'public/images/authors/lola.jpg',
    Monting: 'public/images/authors/monting.jpg',
}
